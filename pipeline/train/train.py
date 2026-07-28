"""
Phase 3 training job, per docs/data-pipeline.md §4-5. Runs both locally
(python3 train.py --run-id ...) and as the Cloud Run Job container
(TRAINING_RUN_ID env var) - identical logic either way, only the run-id
source differs.

Steps: look up the TrainingRun doc -> its ModelSpec + Dataset -> download
every entry's raw file from GCS -> extract features via the modality
registry (loaders.py) -> train via the task-type registry (models.py) one
epoch at a time, writing trainingHistory back to Firestore after each epoch
-> on completion, save weights to the artifacts bucket and set
finalMetrics/outputWeightsSnapshotId/status on the TrainingRun doc.

Classification and regression diverge enough (loss function, partial_fit
signature, what "val accuracy" even means) that they're branched explicitly
below rather than forced through one abstraction for two cases. Regression
also has no discrete label to read from Firestore - its target
(loaders.xray_ink_coverage) is computed straight from the downloaded image,
identically at train and eval time - and its text input (the caption) needs
a two-pass load: derive every entry's caption first, THEN fit the TF-IDF
vectorizer on the training split's captions, THEN vectorize every entry
with that fitted vectorizer. That fit step can't happen per-entry, which is
why this orchestration lives here instead of inside loaders.py's generic
per-entry dispatch.

Usage: python3 train.py --run-id <trainingRunId>
"""

import argparse
import os
import pickle
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.metrics import accuracy_score, log_loss, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder, StandardScaler

from gcp_clients import artifacts_bucket, data_bucket, firestore_client, gcs_uri, parse_gcs_uri
from loaders import (
    derive_xray_caption,
    fit_caption_vectorizer,
    load_entry_vector,
    load_image,
    vectorize_caption,
    xray_ink_coverage,
)
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
    is_regression = model_spec["type"] == "regression"

    dataset_ref = firestore_client.collection("datasets").document(run_data["trainDatasetId"])
    dataset = dataset_ref.get().to_dict()

    entries = dataset["entries"]
    modality = dataset["modalities"][0]
    print(f"Training run {run_id}: {len(entries)} entries, modality={modality}, model={model_spec['architecture']}")

    run_ref.update({"status": "running"})

    print("Downloading entry files and extracting features...")
    targets, splits = [], []
    vectorizer = None
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        if is_regression:
            # Pass 1: load pixels + derive captions/targets for every entry.
            # Can't vectorize captions yet - the vectorizer needs the whole
            # training-split corpus fit first.
            pixel_vectors, captions = [], []
            for entry in entries:
                local_path = download_entry_file(entry["imagePath"], tmp_path)
                pixels = load_image(str(local_path))
                pixel_vectors.append(pixels)
                captions.append(derive_xray_caption(pixels))
                targets.append(xray_ink_coverage(pixels))
                splits.append(entry.get("split", "train"))

            splits_arr = np.array(splits)
            train_mask = splits_arr == "train"

            # Fit on the training captions only - fitting on val/eval
            # captions too would leak their vocabulary into training.
            vectorizer = fit_caption_vectorizer([c for c, is_train in zip(captions, train_mask) if is_train])

            # Pass 2: now vectorize every caption with that fitted
            # vectorizer and concatenate onto each entry's pixel vector.
            vectors = [
                np.concatenate([pixels, vectorize_caption(vectorizer, caption)])
                for pixels, caption in zip(pixel_vectors, captions)
            ]
        else:
            vectors = []
            for entry in entries:
                local_path = download_entry_file(entry["imagePath"], tmp_path)
                vectors.append(load_entry_vector(modality, str(local_path)))
                targets.append(entry["diagnosis"])
                splits.append(entry.get("split", "train"))

    X = np.stack(vectors)
    splits_arr = np.array(splits)
    train_mask = splits_arr == "train"
    val_mask = splits_arr == "val"
    if not val_mask.any():
        val_mask = train_mask  # no held-out split defined - fall back to training metrics as val

    label_encoder = None
    if is_regression:
        y = np.array(targets, dtype=np.float64)
    else:
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(targets)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X[train_mask])
    X_val = scaler.transform(X[val_mask])
    y_train, y_val = y[train_mask], y[val_mask]

    parameters = {**model_spec.get("parameters", {}), **run_data.get("parameterOverrides", {})}
    n_epochs = int(parameters.get("max_iter", 50))
    model = build_model(model_spec["type"], parameters)
    classes = np.unique(y) if not is_regression else None

    print(f"Training {n_epochs} epochs over {len(X_train)} train / {len(X_val)} val samples...")
    history = []
    for epoch in range(1, n_epochs + 1):
        if is_regression:
            model.partial_fit(X_train, y_train)
            train_loss = mean_squared_error(y_train, model.predict(X_train))
            val_loss = mean_squared_error(y_val, model.predict(X_val))
            # TrainingEpoch.valAccuracy has no regression-shaped sibling
            # field in the type system, so it's repurposed to hold R² here
            # (same idea as ingest_digits.py repurposing Entry.diagnosis for
            # a non-diagnosis label) - 1.0 is a perfect fit, same direction
            # as accuracy, just not bounded at 0 for a bad one.
            val_progress = r2_score(y_val, model.predict(X_val))
        else:
            model.partial_fit(X_train, y_train, classes=classes)
            train_loss = log_loss(y_train, model.predict_proba(X_train), labels=classes)
            val_loss = log_loss(y_val, model.predict_proba(X_val), labels=classes)
            val_progress = accuracy_score(y_val, model.predict(X_val))
        history.append(
            {
                "epoch": epoch,
                "trainLoss": round(float(train_loss), 4),
                "valLoss": round(float(val_loss), 4),
                "valAccuracy": round(float(val_progress), 4),
            }
        )
        run_ref.update({"trainingHistory": history})
        if epoch % 10 == 0 or epoch == n_epochs:
            metric_name = "valR2" if is_regression else "valAcc"
            print(f"  epoch {epoch:>3}  trainLoss={train_loss:.4f}  valLoss={val_loss:.4f}  {metric_name}={val_progress:.4f}")

    final_train_loss = history[-1]["trainLoss"]
    final_val_loss = history[-1]["valLoss"]
    final_val_accuracy = history[-1]["valAccuracy"]

    print("Saving trained model to artifacts bucket...")
    snapshot_id = f"w-{run_id}"
    object_path = f"artifacts/{model_spec['id']}/{snapshot_id}.pkl"
    with tempfile.TemporaryDirectory() as tmpdir:
        local_path = Path(tmpdir) / "model.pkl"
        with open(local_path, "wb") as f:
            pickle.dump(
                {"model": model, "scaler": scaler, "label_encoder": label_encoder, "vectorizer": vectorizer}, f
            )
        artifacts_bucket.blob(object_path).upload_from_filename(str(local_path))
    weights_uri = gcs_uri("artifacts", object_path)

    now = datetime.now(timezone.utc).isoformat()
    metric_label = "R²" if is_regression else "val accuracy"
    weight_snapshot = {
        "id": snapshot_id,
        "modelSpecId": model_spec["id"],
        "name": f"Auto-saved from training run {run_id}",
        "description": f"Trained {n_epochs} epochs, final {metric_label} {final_val_accuracy:.3f}",
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

    print(f"\nDone. status=completed, outputWeightsSnapshotId={snapshot_id}, final{metric_label.replace(' ', '')}={final_val_accuracy:.3f}")


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
