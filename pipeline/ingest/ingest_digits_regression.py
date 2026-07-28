"""
Adds a multimodal (image + text) regression task to the existing p-digits
project, reusing its training dataset (ds-digits-train) - no new training
images needed, since the regression target and caption text are both
derived from the images at train/eval time (see
pipeline/train/loaders.py's caption_features_from_xray_pixels /
xray_ink_coverage), not ingested separately.

This script only adds what's actually new:
  1. A held-out eval dataset (ds-digits-eval) - a disjoint slice of
     scikit-learn's digits dataset from what ingest_digits.py used for
     training (that script took indices [0:2] per digit class; this one
     takes [2:3]), so evaluation isn't run against already-seen images.
  2. A new ModelSpec (regression) on the same project.

Usage: python3 ingest_digits_regression.py
"""

import io
from datetime import datetime, timedelta, timezone

import numpy as np
import requests
from PIL import Image
from sklearn.datasets import load_digits

API_BASE = "http://localhost:8080"

PROJECT_ID = "p-digits"
EVAL_DATASET_ID = "ds-digits-eval"
MODEL_SPEC_ID = "ms-sgdreg-xray-caption"

TRAIN_PER_CLASS = 2  # must match ingest_digits.py, to skip past those samples
EVAL_PER_CLASS = 1  # 1 per digit class = 10 held-out entries


def build_eval_entries(images, target):
    chosen = []
    for digit in range(10):
        idx = [i for i, t in enumerate(target) if t == digit][TRAIN_PER_CLASS : TRAIN_PER_CLASS + EVAL_PER_CLASS]
        chosen.extend(idx)

    base_date = datetime(2025, 6, 1, tzinfo=timezone.utc)
    entries = []
    for i, sample_idx in enumerate(chosen):
        entry_num = i + 1
        entries.append(
            {
                "id": f"en-dge-{entry_num:02d}",
                "datasetId": EVAL_DATASET_ID,
                "subjectId": f"dge-{entry_num:03d}",
                "sessionId": "ses-001",
                "date": (base_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                "age": 40,
                "sex": "M" if i % 2 == 0 else "F",
                "diagnosis": str(target[sample_idx]),  # unused by the regression task, kept for schema consistency
                "modalityType": "X-Ray",
                "_image": images[sample_idx],
            }
        )
    return entries


def upload_entry_png(entry):
    resp = requests.post(
        f"{API_BASE}/datasets/{EVAL_DATASET_ID}/entries/upload-url",
        json={"entryId": entry["id"], "contentType": "image/png", "ext": "png"},
    )
    resp.raise_for_status()
    payload = resp.json()

    pixels = (entry["_image"] / 16.0 * 255).astype(np.uint8)
    img = Image.fromarray(pixels, mode="L").resize((64, 64), Image.NEAREST)
    buf = io.BytesIO()
    img.save(buf, format="PNG")

    put_resp = requests.put(payload["uploadUrl"], data=buf.getvalue(), headers={"Content-Type": "image/png"})
    put_resp.raise_for_status()
    return payload["gcsUri"]


def main():
    print("Loading scikit-learn digits dataset (held-out slice)...")
    ds = load_digits()
    entries = build_eval_entries(ds.images, ds.target)
    print(f"Selected {len(entries)} held-out entries (1 per digit class), disjoint from training's slice")

    now = datetime.now(timezone.utc).isoformat()

    print(f"Creating dataset {EVAL_DATASET_ID} (empty entries)...")
    dataset = {
        "id": EVAL_DATASET_ID,
        "projectId": PROJECT_ID,
        "name": "Handwritten Digits — Regression Evaluation Set",
        "description": (
            f"Held-out evaluation cohort of {len(entries)} samples from "
            "scikit-learn's load_digits() - disjoint from ds-digits-train's 20 "
            "samples. Used for the multimodal (image+text) ink-coverage "
            "regression task (ms-sgdreg-xray-caption), not the classification "
            "one. diagnosis is carried over for schema consistency but unused "
            "by regression - the real target (ink coverage) and the caption "
            "text feature are both computed from the image at eval time, see "
            "pipeline/evaluate/loaders.py."
        ),
        "modalities": ["X-Ray"],
        "labelSet": [str(d) for d in range(10)],
        "entries": [],
        "createdAt": now,
        "role": "evaluation",
    }
    resp = requests.post(f"{API_BASE}/datasets", json=dataset)
    resp.raise_for_status()

    print("Uploading entries (signed URL -> GCS PUT -> confirm)...")
    for entry in entries:
        gcs_uri = upload_entry_png(entry)
        confirmed = {k: v for k, v in entry.items() if k != "_image"}
        confirmed["imagePath"] = gcs_uri
        resp = requests.post(f"{API_BASE}/datasets/{EVAL_DATASET_ID}/entries", json=confirmed)
        resp.raise_for_status()
        print(f"  {entry['id']} -> {gcs_uri}")

    print(f"Adding {EVAL_DATASET_ID} to project {PROJECT_ID}.datasetIds...")
    project = requests.get(f"{API_BASE}/projects/{PROJECT_ID}").json()
    dataset_ids = project.get("datasetIds", [])
    if EVAL_DATASET_ID not in dataset_ids:
        resp = requests.put(f"{API_BASE}/projects/{PROJECT_ID}", json={"datasetIds": dataset_ids + [EVAL_DATASET_ID]})
        resp.raise_for_status()

    print(f"Creating model spec {MODEL_SPEC_ID}...")
    model_spec = {
        "id": MODEL_SPEC_ID,
        "projectId": PROJECT_ID,
        "name": "SGD Regressor — Ink Coverage (Multimodal Image+Text)",
        "description": (
            "Off-the-shelf scikit-learn SGDRegressor predicting a digit "
            "image's ink coverage (mean pixel intensity, a real continuous "
            "quantity) from a combined input: the flattened 8x8 pixel vector "
            "PLUS a small text-derived feature vector describing the stroke "
            "pattern's left-right symmetry (see "
            "pipeline/train/loaders.py:caption_features_from_xray_pixels). "
            "The caption deliberately encodes symmetry, not ink density, so "
            "it's a genuinely separate (if related) signal from the "
            "regression target rather than a restatement of the answer. "
            "Reuses ds-digits-train's existing images - no new training data "
            "needed, since both the caption and the target are computed from "
            "the image at train/eval time, not ingested."
        ),
        "type": "regression",
        "architecture": "SGDRegressor (scikit-learn) — multimodal image+text",
        "parameters": {"alpha": 0.001, "penalty": "l2", "max_iter": 200},
        "savedWeights": [],
        "uploadedAt": now,
        "uploadedBy": "u-bob",
    }
    resp = requests.post(f"{API_BASE}/modelSpecs", json=model_spec)
    resp.raise_for_status()

    project = requests.get(f"{API_BASE}/projects/{PROJECT_ID}").json()
    model_spec_ids = project.get("modelSpecIds", [])
    if MODEL_SPEC_ID not in model_spec_ids:
        resp = requests.put(f"{API_BASE}/projects/{PROJECT_ID}", json={"modelSpecIds": model_spec_ids + [MODEL_SPEC_ID]})
        resp.raise_for_status()

    print("\nDone.")
    print(f"  Eval dataset: GET {API_BASE}/datasets/{EVAL_DATASET_ID}")
    print(f"  ModelSpec:    GET {API_BASE}/modelSpecs/{MODEL_SPEC_ID}")


if __name__ == "__main__":
    main()
