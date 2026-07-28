"""
Phase 4 ingestion: a genuinely held-out evaluation dataset for the breast
cancer project - different samples than ingest_breast_cancer.py used for
training (that script took the first N_PER_CLASS of each class; this one
takes the *next* slice), so evaluation isn't run against already-seen data.

Same real pipeline as ingest_breast_cancer.py (signed URL -> GCS PUT ->
confirm entry via the API), just role='evaluation' and no train/val split
field (this dataset IS the held-out set, not itself split further).

Usage: python3 ingest_breast_cancer_eval.py
"""

import csv
import io
import random
from datetime import datetime, timedelta, timezone

import requests
from sklearn.datasets import load_breast_cancer

API_BASE = "http://localhost:8080"

PROJECT_ID = "p-breast-cancer"
DATASET_ID = "ds-breast-cancer-eval"

TRAIN_N_PER_CLASS = 10  # must match ingest_breast_cancer.py, to skip past those samples
EVAL_N_PER_CLASS = 6  # 6 malignant + 6 benign = 12 held-out entries
SEED = 43  # different seed than training's 42, just for a different shuffle order


def build_entries(data, target, feature_names):
    rng = random.Random(SEED)
    malignant_idx = [i for i, t in enumerate(target) if t == 0][TRAIN_N_PER_CLASS : TRAIN_N_PER_CLASS + EVAL_N_PER_CLASS]
    benign_idx = [i for i, t in enumerate(target) if t == 1][TRAIN_N_PER_CLASS : TRAIN_N_PER_CLASS + EVAL_N_PER_CLASS]
    chosen = malignant_idx + benign_idx
    rng.shuffle(chosen)

    base_date = datetime(2025, 4, 1, tzinfo=timezone.utc)
    entries = []
    for i, sample_idx in enumerate(chosen):
        entry_num = i + 1
        entries.append(
            {
                "id": f"en-bce-{entry_num:02d}",
                "datasetId": DATASET_ID,
                "subjectId": f"bce-{entry_num:03d}",
                "sessionId": "ses-001",
                "date": (base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                "age": rng.randint(35, 80),
                "sex": rng.choice(["M", "F"]),
                "diagnosis": "Malignant" if target[sample_idx] == 0 else "Benign",
                "modalityType": "Pathology",
                "_features": dict(zip(feature_names, data[sample_idx].tolist())),
            }
        )
    return entries


def upload_entry_csv(entry):
    resp = requests.post(
        f"{API_BASE}/datasets/{DATASET_ID}/entries/upload-url",
        json={"entryId": entry["id"], "contentType": "text/csv", "ext": "csv"},
    )
    resp.raise_for_status()
    payload = resp.json()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["feature", "value"])
    for feature, value in entry["_features"].items():
        writer.writerow([feature, value])

    put_resp = requests.put(
        payload["uploadUrl"],
        data=buf.getvalue().encode("utf-8"),
        headers={"Content-Type": "text/csv"},
    )
    put_resp.raise_for_status()
    return payload["gcsUri"]


def main():
    print("Loading scikit-learn breast_cancer dataset (held-out slice)...")
    ds = load_breast_cancer()
    entries = build_entries(ds.data, ds.target, ds.feature_names)
    print(f"Selected {len(entries)} entries ({EVAL_N_PER_CLASS} malignant + {EVAL_N_PER_CLASS} benign), disjoint from training's slice")

    now = datetime.now(timezone.utc).isoformat()

    print(f"Creating dataset {DATASET_ID} (empty entries)...")
    dataset = {
        "id": DATASET_ID,
        "projectId": PROJECT_ID,
        "name": "Breast Cancer Wisconsin (Diagnostic) — Evaluation Set",
        "description": (
            f"Held-out evaluation cohort of {len(entries)} samples from "
            "scikit-learn's load_breast_cancer() - disjoint from the training "
            "dataset's 20 samples (indices 0-9 per class used for training, "
            "10-15 per class used here). Each entry's 30 features are stored as "
            "a real CSV object in Cloud Storage, not embedded in Firestore."
        ),
        "modalities": ["Pathology"],
        "labelSet": ["Malignant", "Benign"],
        "entries": [],
        "createdAt": now,
        "role": "evaluation",
    }
    resp = requests.post(f"{API_BASE}/datasets", json=dataset)
    resp.raise_for_status()

    print("Uploading entries (signed URL -> GCS PUT -> confirm)...")
    for entry in entries:
        gcs_uri = upload_entry_csv(entry)
        confirmed = {k: v for k, v in entry.items() if k != "_features"}
        confirmed["imagePath"] = gcs_uri
        resp = requests.post(f"{API_BASE}/datasets/{DATASET_ID}/entries", json=confirmed)
        resp.raise_for_status()
        print(f"  {entry['id']}  {entry['diagnosis']:<10} -> {gcs_uri}")

    print(f"Adding {DATASET_ID} to project {PROJECT_ID}.datasetIds...")
    project = requests.get(f"{API_BASE}/projects/{PROJECT_ID}").json()
    dataset_ids = project.get("datasetIds", [])
    if DATASET_ID not in dataset_ids:
        resp = requests.put(f"{API_BASE}/projects/{PROJECT_ID}", json={"datasetIds": dataset_ids + [DATASET_ID]})
        resp.raise_for_status()

    print("\nDone.")
    print(f"  Dataset: GET {API_BASE}/datasets/{DATASET_ID}")


if __name__ == "__main__":
    main()
