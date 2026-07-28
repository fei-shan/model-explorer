"""
Phase 2 ingestion, second toy dataset: scikit-learn's built-in digits dataset
(1797 8x8 grayscale handwritten-digit images, 10 classes). Mirrors
ingest_breast_cancer.py's structure and its use of synthetic placeholder
fields (age/sex/date - the source dataset has none), but this time the raw
file uploaded to GCS per entry is a real PNG image instead of a CSV, to
exercise the image branch of the modality-specific loader described in
docs/data-pipeline.md §3.

Note on modalityType: the app's ModalityType enum is fixed to biomedical
values (MRI/ECG/CT/Pathology/Clinical Note/X-Ray). Handwritten digits aren't
any of those - 'X-Ray' is used purely as a placeholder tag so this dataset
exercises the same code path a real X-Ray dataset would, not because these
are medical images. Called out explicitly in the dataset description too.

Usage: python3 ingest_digits.py
"""

import io
import random
from datetime import datetime, timedelta, timezone

import numpy as np
import requests
from PIL import Image
from sklearn.datasets import load_digits

API_BASE = "http://localhost:8080"

PROJECT_ID = "p-digits"
DATASET_ID = "ds-digits-train"
MODEL_SPEC_ID = "ms-logreg-digits"

PER_CLASS = 2  # 2 samples x 10 digit classes = 20 entries, 16 train / 4 val
SEED = 7


def build_entries(images, target):
    rng = random.Random(SEED)
    chosen = []
    for digit in range(10):
        idx = [i for i, t in enumerate(target) if t == digit][:PER_CLASS]
        chosen.extend(idx)
    rng.shuffle(chosen)

    base_date = datetime(2025, 5, 1, tzinfo=timezone.utc)
    entries = []
    for i, sample_idx in enumerate(chosen):
        entry_num = i + 1
        entries.append(
            {
                "id": f"en-dg-{entry_num:02d}",
                "datasetId": DATASET_ID,
                "subjectId": f"dg-{entry_num:03d}",
                "sessionId": "ses-001",
                "date": (base_date + timedelta(days=rng.randint(0, 60))).strftime("%Y-%m-%d"),
                # No real per-subject metadata in the source dataset - synthetic
                # placeholders to satisfy the Entry type, same as ingest_breast_cancer.py.
                "age": rng.randint(18, 90),
                "sex": rng.choice(["M", "F"]),
                "diagnosis": str(target[sample_idx]),  # digit label, repurposing the field
                "modalityType": "X-Ray",  # placeholder tag - see module docstring
                "split": "train" if i < 16 else "val",
                "_image": images[sample_idx],
            }
        )
    return entries


def upload_entry_png(entry):
    resp = requests.post(
        f"{API_BASE}/datasets/{DATASET_ID}/entries/upload-url",
        json={"entryId": entry["id"], "contentType": "image/png", "ext": "png"},
    )
    resp.raise_for_status()
    payload = resp.json()

    # 8x8 float array, values 0-16 -> 8-bit grayscale PNG, upscaled 8x so it's
    # actually viewable (64x64) rather than a nearly-invisible 8x8 thumbnail.
    pixels = (entry["_image"] / 16.0 * 255).astype(np.uint8)
    img = Image.fromarray(pixels, mode="L").resize((64, 64), Image.NEAREST)
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    put_resp = requests.put(
        payload["uploadUrl"],
        data=buf.getvalue(),
        headers={"Content-Type": "image/png"},
    )
    put_resp.raise_for_status()
    return payload["gcsUri"]


def main():
    print("Loading scikit-learn digits dataset...")
    ds = load_digits()
    entries = build_entries(ds.images, ds.target)
    print(f"Selected {len(entries)} entries (2 per digit class, 0-9)")

    now = datetime.now(timezone.utc).isoformat()

    print(f"Creating project {PROJECT_ID}...")
    project = {
        "id": PROJECT_ID,
        "name": "Handwritten Digit Recognition (Toy)",
        "description": (
            "Toy 10-class image classification project using scikit-learn's "
            "built-in digits dataset (8x8 grayscale handwritten digits). Not "
            "biomedical data - included purely as a second, image-modality "
            "off-the-shelf dataset to exercise the image-file branch of the "
            "ingestion and training pipeline end-to-end alongside the tabular "
            "breast-cancer project."
        ),
        "domain": "Computer Vision (off-the-shelf toy)",
        "createdBy": "u-bob",
        "members": [
            {"userId": "u-bob", "role": "researcher"},
            {"userId": "u-dave", "role": "practitioner"},
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
        "name": "Handwritten Digits — Training Set",
        "description": (
            f"Training cohort of {len(entries)} samples (16 train / 4 val) from "
            "scikit-learn's load_digits(). Each entry's 8x8 image is stored as a "
            "real 64x64 PNG object in Cloud Storage (upscaled for visibility), "
            "not embedded in Firestore. modalityType is tagged 'X-Ray' as a "
            "placeholder only - see ingest_digits.py docstring."
        ),
        "modalities": ["X-Ray"],
        "labelSet": [str(d) for d in range(10)],
        "entries": [],
        "createdAt": now,
        "role": "training",
    }
    resp = requests.post(f"{API_BASE}/datasets", json=dataset)
    resp.raise_for_status()

    print("Uploading entries (signed URL -> GCS PUT -> confirm)...")
    for entry in entries:
        gcs_uri = upload_entry_png(entry)
        confirmed = {k: v for k, v in entry.items() if k != "_image"}
        confirmed["imagePath"] = gcs_uri
        resp = requests.post(f"{API_BASE}/datasets/{DATASET_ID}/entries", json=confirmed)
        resp.raise_for_status()
        print(f"  {entry['id']}  digit={entry['diagnosis']}  split={entry['split']:<5} -> {gcs_uri}")

    print(f"Creating model spec {MODEL_SPEC_ID}...")
    model_spec = {
        "id": MODEL_SPEC_ID,
        "projectId": PROJECT_ID,
        "name": "Logistic Regression — Digit Classifier",
        "description": (
            "Off-the-shelf scikit-learn LogisticRegression over flattened 8x8 "
            "pixel vectors (64 features). Deliberately simple, matching the "
            "breast-cancer model's scale - proves the image loader path, not "
            "modeling sophistication."
        ),
        "type": "classification",
        "architecture": "LogisticRegression (scikit-learn)",
        "parameters": {"C": 1.0, "max_iter": 200, "penalty": "l2"},
        "savedWeights": [],
        "uploadedAt": now,
        "uploadedBy": "u-bob",
    }
    resp = requests.post(f"{API_BASE}/modelSpecs", json=model_spec)
    resp.raise_for_status()

    print("\nDone.")
    print(f"  Project:    GET {API_BASE}/projects/{PROJECT_ID}")
    print(f"  Dataset:    GET {API_BASE}/datasets/{DATASET_ID}")
    print(f"  ModelSpec:  GET {API_BASE}/modelSpecs/{MODEL_SPEC_ID}")


if __name__ == "__main__":
    main()
