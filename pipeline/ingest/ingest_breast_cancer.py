"""
Phase 2 ingestion: loads scikit-learn's built-in Breast Cancer Wisconsin
(Diagnostic) dataset, takes a small balanced 20-sample toy subset, and pushes
it through the real pipeline described in docs/data-pipeline.md:

    Project (Firestore, via API)
    Dataset (Firestore, via API, entries appended one at a time)
      -> per entry: signed URL -> PUT raw/<datasetId>/<entryId>.csv to GCS
                    -> confirm entry (Firestore array update, via API)
    ModelSpec (Firestore, via API) - LogisticRegression, matching type

No frontend involved; this script plays the role the frontend's upload flow
will eventually play. Every write goes through the API (http://localhost:8080
by default) - nothing here touches Firestore/GCS directly, matching the rule
that only the API holds GCP credentials.

Usage: python3 ingest_breast_cancer.py
"""

import csv
import io
import random
from datetime import datetime, timedelta, timezone

import requests
from sklearn.datasets import load_breast_cancer

API_BASE = "http://localhost:8080"

PROJECT_ID = "p-breast-cancer"
DATASET_ID = "ds-breast-cancer-train"
MODEL_SPEC_ID = "ms-logreg-breast-cancer"

N_PER_CLASS = 10  # 10 malignant + 10 benign = 20 entries, 16 train / 4 val
SEED = 42


def build_entries(data, target, feature_names):
    rng = random.Random(SEED)
    malignant_idx = [i for i, t in enumerate(target) if t == 0][:N_PER_CLASS]
    benign_idx = [i for i, t in enumerate(target) if t == 1][:N_PER_CLASS]
    chosen = malignant_idx + benign_idx
    rng.shuffle(chosen)

    base_date = datetime(2025, 3, 1, tzinfo=timezone.utc)
    entries = []
    for i, sample_idx in enumerate(chosen):
        entry_num = i + 1
        entries.append(
            {
                "id": f"en-bc-{entry_num:02d}",
                "datasetId": DATASET_ID,
                "subjectId": f"bc-{entry_num:03d}",
                "sessionId": "ses-001",
                "date": (base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                # Source dataset has no age/sex fields (it's a feature panel derived
                # from a digitized FNA image, not per-patient demographics) - these
                # are synthetic placeholders to satisfy the Entry type, not real data.
                "age": rng.randint(35, 80),
                "sex": rng.choice(["M", "F"]),
                "diagnosis": "Malignant" if target[sample_idx] == 0 else "Benign",
                "modalityType": "Pathology",
                "split": "train" if i < 16 else "val",
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
    print("Loading scikit-learn breast_cancer dataset...")
    ds = load_breast_cancer()
    entries = build_entries(ds.data, ds.target, ds.feature_names)
    print(f"Selected {len(entries)} entries ({N_PER_CLASS} malignant + {N_PER_CLASS} benign)")

    now = datetime.now(timezone.utc).isoformat()

    print(f"Creating project {PROJECT_ID}...")
    project = {
        "id": PROJECT_ID,
        "name": "Breast Cancer Diagnostic Classification",
        "description": (
            "Toy binary classification project using the UCI/scikit-learn Breast "
            "Cancer Wisconsin (Diagnostic) dataset - 30 numeric features per sample "
            "derived from a digitized image of a fine needle aspirate (FNA) of a "
            "breast mass, describing cell nuclei characteristics. Used to prove the "
            "real data -> real training pipeline end-to-end with an off-the-shelf, "
            "well-known, tiny dataset and a correspondingly simple model."
        ),
        "domain": "Oncology / Pathology",
        "createdBy": "u-alice",
        "members": [
            {"userId": "u-alice", "role": "researcher"},
            {"userId": "u-carol", "role": "practitioner"},
        ],
        "datasetIds": [DATASET_ID],
        "modelSpecIds": [MODEL_SPEC_ID],
        "evaluationIds": [],
        "trainingRunIds": [],
        "createdAt": now,
    }
    resp = requests.post(f"{API_BASE}/projects", json=project)
    resp.raise_for_status()

    print(f"Creating dataset {DATASET_ID} (empty entries)...")
    dataset = {
        "id": DATASET_ID,
        "projectId": PROJECT_ID,
        "name": "Breast Cancer Wisconsin (Diagnostic) — Training Set",
        "description": (
            f"Training cohort of {len(entries)} samples (16 train / 4 val) from "
            "scikit-learn's load_breast_cancer() (UCI Breast Cancer Wisconsin "
            "Diagnostic dataset). Each entry's 30 features are stored as a real "
            "CSV object in Cloud Storage, not embedded in Firestore."
        ),
        "modalities": ["Pathology"],
        "labelSet": ["Malignant", "Benign"],
        "entries": [],
        "createdAt": now,
        "role": "training",
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
        print(f"  {entry['id']}  {entry['diagnosis']:<10} split={entry['split']:<5} -> {gcs_uri}")

    print(f"Creating model spec {MODEL_SPEC_ID}...")
    model_spec = {
        "id": MODEL_SPEC_ID,
        "projectId": PROJECT_ID,
        "name": "Logistic Regression — Breast Cancer Diagnostic",
        "description": (
            "Off-the-shelf scikit-learn LogisticRegression over the 30-feature "
            "cell-nuclei panel. Deliberately simple: proves the real-data -> "
            "real-training plumbing, not modeling sophistication."
        ),
        "type": "classification",
        "architecture": "LogisticRegression (scikit-learn)",
        "parameters": {"C": 1.0, "max_iter": 200, "penalty": "l2"},
        "savedWeights": [],
        "uploadedAt": now,
        "uploadedBy": "u-alice",
    }
    resp = requests.post(f"{API_BASE}/modelSpecs", json=model_spec)
    resp.raise_for_status()

    print("\nDone.")
    print(f"  Project:    GET {API_BASE}/projects/{PROJECT_ID}")
    print(f"  Dataset:    GET {API_BASE}/datasets/{DATASET_ID}")
    print(f"  ModelSpec:  GET {API_BASE}/modelSpecs/{MODEL_SPEC_ID}")


if __name__ == "__main__":
    main()
