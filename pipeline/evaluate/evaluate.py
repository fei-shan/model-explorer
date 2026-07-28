"""
Phase 4 evaluation job, per docs/data-pipeline.md §5. Runs both locally
(python3 evaluate.py --evaluation-id ...) and as the Cloud Run Job container
(EVALUATION_ID env var) - identical logic either way, mirroring
pipeline/train/train.py's local/Cloud-Run duality.

Steps: look up the Evaluation doc -> its ModelSpec (find the requested
WeightSnapshot's filePath) + Dataset -> download the pickled model/scaler/
label_encoder and every entry's raw file from GCS -> extract features via
the modality registry (loaders.py, identical to training's) -> score via
the task-type registry (evaluators.py) -> write entryResults + metrics
(confusion matrix flattened for Firestore, see firestore_encoding.py) back
to the Evaluation doc.

Usage: python3 evaluate.py --evaluation-id <evaluationId>
"""

import argparse
import os
import pickle
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from evaluators import evaluate
from firestore_encoding import encode_confusion_matrix
from gcp_clients import artifacts_bucket, data_bucket, firestore_client, parse_gcs_uri
from loaders import load_entry_vector


def download_file(gcs_uri_str: str, dest_dir: Path) -> Path:
    bucket_name, object_path = parse_gcs_uri(gcs_uri_str)
    bucket = data_bucket if bucket_name == data_bucket.name else artifacts_bucket
    local_path = dest_dir / Path(object_path).name
    bucket.blob(object_path).download_to_filename(str(local_path))
    return local_path


def main(evaluation_id: str):
    eval_ref = firestore_client.collection("evaluations").document(evaluation_id)
    eval_snapshot = eval_ref.get()
    if not eval_snapshot.exists:
        raise SystemExit(f"evaluations/{evaluation_id} not found")
    eval_data = eval_snapshot.to_dict()

    model_spec_ref = firestore_client.collection("modelSpecs").document(eval_data["modelSpecId"])
    model_spec = model_spec_ref.get().to_dict()

    weights_snapshot_id = eval_data["weightsSnapshotId"]
    weight_snapshot = next((w for w in model_spec.get("savedWeights", []) if w["id"] == weights_snapshot_id), None)
    if weight_snapshot is None:
        raise SystemExit(f"weightsSnapshotId={weights_snapshot_id!r} not found in modelSpecs/{model_spec['id']}.savedWeights")

    dataset_ref = firestore_client.collection("datasets").document(eval_data["datasetId"])
    dataset = dataset_ref.get().to_dict()

    entries = dataset["entries"]
    modality = dataset["modalities"][0]
    print(f"Evaluation {evaluation_id}: {len(entries)} entries, modality={modality}, weights={weights_snapshot_id}")

    eval_ref.update({"status": "running"})

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        print(f"Downloading model weights ({weight_snapshot['filePath']})...")
        model_local_path = download_file(weight_snapshot["filePath"], tmp_path)
        with open(model_local_path, "rb") as f:
            saved = pickle.load(f)
        model, scaler, label_encoder = saved["model"], saved["scaler"], saved["label_encoder"]

        print("Downloading entry files and extracting features...")
        vectors = []
        for entry in entries:
            local_path = download_file(entry["imagePath"], tmp_path)
            vectors.append(load_entry_vector(modality, str(local_path)))

    X_raw = np.stack(vectors)
    X = scaler.transform(X_raw)
    y_true = label_encoder.transform([entry["diagnosis"] for entry in entries])

    print(f"Scoring {len(entries)} entries with {model_spec['architecture']}...")
    entry_results, metrics = evaluate(model_spec["type"], model, label_encoder, entries, X, y_true)

    if "confusionMatrix" in metrics:
        metrics["confusionMatrix"]["matrix"] = encode_confusion_matrix(metrics["confusionMatrix"]["matrix"])

    now = datetime.now(timezone.utc).isoformat()
    eval_ref.update(
        {
            "status": "completed",
            "completedAt": now,
            "entryResults": entry_results,
            "metrics": metrics,
        }
    )

    print(f"\nDone. status=completed, accuracy={metrics.get('accuracy')}, f1={metrics.get('f1')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--evaluation-id", default=os.environ.get("EVALUATION_ID"))
    args = parser.parse_args()
    if not args.evaluation_id:
        raise SystemExit("--evaluation-id or EVALUATION_ID env var is required")
    main(args.evaluation_id)
