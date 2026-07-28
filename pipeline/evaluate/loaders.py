"""
Modality-specific feature loaders, per docs/data-pipeline.md §3. Each loader
turns one downloaded raw file into a fixed-length numeric feature vector.
Only the two modalities the seeded toy datasets actually use are
implemented; anything else raises rather than silently guessing.

Identical to pipeline/train/loaders.py - see that file's module docstring
for why this is duplicated rather than shared as a package. Extraction MUST
stay identical between training and evaluation (same feature space in, same
model), so if you change one, change the other.
"""

from typing import Tuple

import csv
import numpy as np
from PIL import Image


def load_pathology_features(local_path: str) -> Tuple[list, np.ndarray]:
    """CSV with header 'feature,value' -> (sorted feature names, sorted values)."""
    with open(local_path, newline="") as f:
        rows = list(csv.DictReader(f))
    rows.sort(key=lambda r: r["feature"])
    names = [r["feature"] for r in rows]
    values = np.array([float(r["value"]) for r in rows], dtype=np.float64)
    return names, values


def load_xray_pixels(local_path: str, size: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """PNG (any resolution) -> resized grayscale -> flattened [0,1] pixel vector."""
    img = Image.open(local_path).convert("L").resize(size, Image.NEAREST)
    pixels = np.asarray(img, dtype=np.float64) / 255.0
    return pixels.flatten()


# Every modalityType the app's type system allows (src/types/index.ts
# ModalityType), regardless of whether training support exists yet - kept
# here so "what's possible" and "what's implemented" are both visible in one
# place, not just inferable from which dict keys happen to exist.
ALL_MODALITIES = ["MRI", "ECG", "CT", "Pathology", "Clinical Note", "X-Ray"]

# Subset of ALL_MODALITIES with an actual loader below.
LOADERS = {
    "Pathology": lambda path: load_pathology_features(path)[1],
    "X-Ray": load_xray_pixels,
}


def is_modality_supported(modality_type: str) -> bool:
    return modality_type in LOADERS


def load_entry_vector(modality_type: str, local_path: str) -> np.ndarray:
    if not is_modality_supported(modality_type):
        raise NotImplementedError(
            f"modalityType={modality_type!r} has no training loader yet. "
            f"Implemented: {sorted(LOADERS)}. All modalities: {ALL_MODALITIES}."
        )
    return LOADERS[modality_type](local_path)
