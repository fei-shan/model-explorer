"""
Phase 3 training job, per docs/data-pipeline.md §4. Runs both locally
(python3 train.py --run-id ...) and as the Cloud Run Job container
(TRAINING_RUN_ID env var) - identical logic either way, only the run-id
source differs.

Steps: look up the TrainingRun doc -> its ModelSpec + Dataset -> download
every entry's raw file from GCS -> extract features via the modality
registry (loaders.py) -> train via the task-type registry (models.py) one
epoch at a time, writing trainingHistory back to Firestore after each epoch
-> on completion, save weights to the artifacts bucket and set
finalMetrics/outputWeightsSnapshotId/status on the TrainingRun doc.

Usage: python3 train.py --run-id <trainingRunId>
"""

import argparse
import os
import pickle
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, log_loss
from sklearn.preprocessing import LabelEncoder, StandardScaler

from gcp_clients import artifacts_bucket, data_bucket, firestore_client, gcs_uri, parse_gcs_uri
from loaders import load_entry_vector
from models import build_model


def download_entry_file(entry_gcs_uri: str, dest_dir: Path) -> Path:
    bucket_name, object_path = parse_gcs_uri(entry_gcs_uri)
    bucket = data_bucket if bucket_name == data_bucket.name else artifacts_bucket
    local_path = dest_dir / Path(object_path).name
    bucket.blob(object_path).download_to_filename(str(local_path))
    return local_path


def main(run_id: str):
    run_ref = firestore_client.collection("trainingRuns").document(run_id)
    run_snapshot = run_ref.get()
    if not run_snapshot.exists:
        raise SystemExit(f"trainingRuns/{run_id} not found")
    run_data = run_snapshot.to_dict()

    model_spec_ref = firestore_client.collection("modelSpecs").document(run_data["modelSpecId"])
    model_spec = model_spec_ref.get().to_dict()

    dataset_ref = firestore_client.collection("datasets").document(run_data["trainDatasetId"])
    dataset = dataset_ref.get().to_dict()

    entries = dataset["entries"]
    modality = dataset["modalities"][0]
    print(f"Training run {run_id}: {len(entries)} entries, modality={modality}, model={model_spec['architecture']}")

    run_ref.update({"status": "running"})

    print("Downloading entry files and extracting features...")
    vectors, labels, splits = [], [], []
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        for entry in entries:
            local_path = download_entry_file(entry["imagePath"], tmp_path)
            vectors.append(load_entry_vector(modality, str(local_path)))
            labels.append(entry["diagnosis"])
            splits.append(entry.get("split", "train"))

    X = np.stack(vectors)
    splits_arr = np.array(splits)
    train_mask = splits_arr == "train"
    val_mask = splits_arr == "val"
    if not val_mask.any():
        val_mask = train_mask  # no held-out split defined - fall back to training metrics as val

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(labels)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X[train_mask])
    X_val = scaler.transform(X[val_mask])
    y_train, y_val = y[train_mask], y[val_mask]

    parameters = {**model_spec.get("parameters", {}), **run_data.get("parameterOverrides", {})}
    n_epochs = int(parameters.get("max_iter", 50))
    model = build_model(model_spec["type"], parameters)
    classes = np.unique(y)

    print(f"Training {n_epochs} epochs over {len(X_train)} train / {len(X_val)} val samples...")
    history = []
    for epoch in range(1, n_epochs + 1):
        model.partial_fit(X_train, y_train, classes=classes)
        train_loss = log_loss(y_train, model.predict_proba(X_train), labels=classes)
        val_loss = log_loss(y_val, model.predict_proba(X_val), labels=classes)
        val_accuracy = accuracy_score(y_val, model.predict(X_val))
        history.append(
            {
                "epoch": epoch,
                "trainLoss": round(float(train_loss), 4),
                "valLoss": round(float(val_loss), 4),
                "valAccuracy": round(float(val_accuracy), 4),
            }
        )
        run_ref.update({"trainingHistory": history})
        if epoch % 10 == 0 or epoch == n_epochs:
            print(f"  epoch {epoch:>3}  trainLoss={train_loss:.4f}  valLoss={val_loss:.4f}  valAcc={val_accuracy:.4f}")

    final_train_loss = history[-1]["trainLoss"]
    final_val_loss = history[-1]["valLoss"]
    final_val_accuracy = history[-1]["valAccuracy"]

    print("Saving trained model to artifacts bucket...")
    snapshot_id = f"w-{run_id}"
    object_path = f"artifacts/{model_spec['id']}/{snapshot_id}.pkl"
    with tempfile.TemporaryDirectory() as tmpdir:
        local_path = Path(tmpdir) / "model.pkl"
        with open(local_path, "wb") as f:
            pickle.dump({"model": model, "scaler": scaler, "label_encoder": label_encoder}, f)
        artifacts_bucket.blob(object_path).upload_from_filename(str(local_path))
    weights_uri = gcs_uri("artifacts", object_path)

    now = datetime.now(timezone.utc).isoformat()
    weight_snapshot = {
        "id": snapshot_id,
        "modelSpecId": model_spec["id"],
        "name": f"Auto-saved from training run {run_id}",
        "description": f"Trained {n_epochs} epochs, final val accuracy {final_val_accuracy:.3f}",
        "savedAt": now,
        "filePath": weights_uri,
        "sourceTrainingRunId": run_id,
    }
    existing_weights = [w for w in model_spec.get("savedWeights", []) if w["id"] != snapshot_id]
    model_spec_ref.update({"savedWeights": existing_weights + [weight_snapshot]})

    run_ref.update(
        {
            "status": "completed",
            "completedAt": now,
            "trainingHistory": history,
            "outputWeightsSnapshotId": snapshot_id,
            "finalMetrics": {
                "finalTrainLoss": final_train_loss,
                "finalValLoss": final_val_loss,
                "finalValAccuracy": final_val_accuracy,
                "epochs": n_epochs,
            },
        }
    )

    print(f"\nDone. status=completed, outputWeightsSnapshotId={snapshot_id}, finalValAccuracy={final_val_accuracy:.3f}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    # TRAINING_RUN_ID env var is the primary interface once this runs as a
    # Cloud Run Job (the API triggers a run via an env var override, not a
    # CLI arg override); --run-id stays for local invocation like we've been
    # doing so far. CLI flag wins if both are somehow set.
    parser.add_argument("--run-id", default=os.environ.get("TRAINING_RUN_ID"))
    args = parser.parse_args()
    if not args.run_id:
        raise SystemExit("--run-id or TRAINING_RUN_ID env var is required")
    main(args.run_id)
