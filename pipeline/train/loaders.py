"""
Feature loaders, per docs/data-pipeline.md §3-4.

Two layers, deliberately kept separate:

1. Generic, data-type-level loaders (load_image, load_tabular,
   fit_caption_vectorizer/vectorize_caption) - these have no idea which
   clinical modality they're loading. load_image loads MRI, CT, X-Ray, or
   Pathology-as-images identically; the same file bytes in, the same
   vector out, regardless of what a human would call the modality. This is
   the reusable part.

2. A thin ModalityType -> data-type mapping (MODALITY_DATA_TYPE) plus one
   piece of genuinely domain-specific logic (deriving an X-Ray caption from
   pixel statistics, and the regression target derived from the same
   pixels). There's no way to make "derive a caption from an image" generic
   the way loading pixels is generic - same reason detection/segmentation
   will each need their own logic later, not just a registry entry. Kept
   small and clearly separated so it's obvious which parts of this file are
   reusable infrastructure and which are this one toy task's specific
   choices.

Adding a new image-shaped modality (real MRI, say) needs zero new loader
code - just one new line in MODALITY_DATA_TYPE. Adding a new *text* file
modality (a real Clinical Note) would reuse fit_caption_vectorizer/
vectorize_caption as-is and only need a small "read the file into a
string" step, not a new vectorizer.

Text -> vector uses a fitted TfidfVectorizer, not a hand-picked fixed
vocabulary: the vocabulary is learned from the actual training captions
(fit once on train.py's training split, pickled alongside the model, then
only ever .transform()'d - never refit - at eval time), so it generalizes
to whatever text a project actually has instead of only the specific words
someone anticipated in advance. Mirrors the exact fit-on-train/apply-
everywhere pattern already used for StandardScaler.
"""

from typing import Tuple

import csv
import numpy as np
from PIL import Image
from sklearn.feature_extraction.text import TfidfVectorizer

# ── Layer 1: generic, data-type-level loaders ────────────────────────────────


def load_image(local_path: str, size: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """Any image file -> resized grayscale -> flattened [0,1] pixel vector.
    Generic across every image-shaped modality - doesn't know or care which
    one it's loading."""
    img = Image.open(local_path).convert("L").resize(size, Image.NEAREST)
    return (np.asarray(img, dtype=np.float64) / 255.0).flatten()


def load_tabular(local_path: str) -> np.ndarray:
    """CSV with header 'feature,value' -> sorted-by-name feature vector.
    Generic across every tabular/feature-panel modality."""
    with open(local_path, newline="") as f:
        rows = list(csv.DictReader(f))
    rows.sort(key=lambda r: r["feature"])
    return np.array([float(r["value"]) for r in rows], dtype=np.float64)


def fit_caption_vectorizer(captions: list) -> TfidfVectorizer:
    """Fit a TF-IDF vectorizer on a corpus of caption strings. Call this
    ONCE, on the training split's captions only (never on val/eval
    captions - that would leak eval vocabulary into training). Persist the
    returned vectorizer (it's picklable) and reuse it via vectorize_caption
    for every other caption, train or eval, so they all share one
    vocabulary. Generic across any text source - doesn't care whether the
    captions are real free text or derived/generated strings."""
    vectorizer = TfidfVectorizer()
    vectorizer.fit(captions)
    return vectorizer


def vectorize_caption(vectorizer: TfidfVectorizer, caption: str) -> np.ndarray:
    """Already-fitted vectorizer -> dense feature vector for one caption.
    Never fits - just applies whatever vocabulary fit_caption_vectorizer
    already learned."""
    return vectorizer.transform([caption]).toarray()[0]


# ── Layer 2: modality -> data-type mapping ───────────────────────────────────

# Every modalityType the app's type system allows (src/types/index.ts
# ModalityType), regardless of whether a loader exists yet - kept here so
# "what's possible" and "what's implemented" are both visible in one place.
ALL_MODALITIES = ["MRI", "ECG", "CT", "Pathology", "Clinical Note", "X-Ray"]

# Which generic loader applies to each modality. This is the *only*
# clinically-aware part of layer 1/2 - everything it points at is generic.
MODALITY_DATA_TYPE = {
    "Pathology": "tabular",
    "X-Ray": "image",
    # MRI/CT would map to "image" too (same load_image, different files);
    # Clinical Note would map to "text" (read the file, then reuse
    # fit_caption_vectorizer/vectorize_caption as-is); ECG would map to
    # "tabular" or a new "signal" type. None implemented yet - see
    # is_modality_supported().
}

DATA_TYPE_LOADERS = {
    "image": load_image,
    "tabular": load_tabular,
}


def is_modality_supported(modality_type: str) -> bool:
    return MODALITY_DATA_TYPE.get(modality_type) in DATA_TYPE_LOADERS


def load_entry_vector(modality_type: str, local_path: str) -> np.ndarray:
    """Single-modality dispatch - looks up the data type for modality_type
    and calls the matching layer-1 loader. Used as-is by classification
    (image-only or tabular-only). The multimodal (image+text) composition
    for the regression task is orchestrated by train.py/evaluate.py
    instead of living in here, because fitting the text vectorizer needs
    the whole training corpus at once - it can't be done inside a
    per-entry dispatch function like this one."""
    data_type = MODALITY_DATA_TYPE.get(modality_type)
    if data_type not in DATA_TYPE_LOADERS:
        raise NotImplementedError(
            f"modalityType={modality_type!r} has no training loader yet. "
            f"Implemented: {sorted(m for m in MODALITY_DATA_TYPE if MODALITY_DATA_TYPE[m] in DATA_TYPE_LOADERS)}. "
            f"All modalities: {ALL_MODALITIES}."
        )
    return DATA_TYPE_LOADERS[data_type](local_path)


# ── Domain-specific: the one multimodal (image+text) task ───────────────────
# Everything below is specific to the X-Ray ink-coverage regression toy
# task (docs/data-pipeline.md §4) - built from the generic primitives above,
# but the captioning/target logic itself is inherently domain logic, not
# something a registry entry alone could express.


def derive_xray_caption(pixels: np.ndarray, size: Tuple[int, int] = (8, 8)) -> str:
    """Short natural-language caption from real pixel statistics - computed
    identically at train and eval time (not stored anywhere), so there's no
    train/eval skew risk. Only describes stroke *symmetry*, deliberately
    not ink density: the regression target (xray_ink_coverage) IS ink
    density, so the caption stays a genuinely separate signal rather than a
    bucketed restatement of the answer."""
    img2d = pixels.reshape(size)
    half = size[1] // 2
    left_half = img2d[:, :half]
    right_half_mirrored = img2d[:, ::-1][:, :half]
    asymmetry = float(np.abs(left_half - right_half_mirrored).mean())
    return "a handwritten stroke pattern that is roughly {} left-to-right".format(
        "symmetric" if asymmetry < 0.12 else "asymmetric"
    )


def xray_ink_coverage(pixels: np.ndarray) -> float:
    """Mean pixel intensity - the real, continuous regression target for the
    multimodal toy task. Takes an already-loaded pixel vector (callers in
    the multimodal path already have pixels in hand for captioning too, so
    this avoids loading the same image twice) - not ingested or stored
    anywhere."""
    return float(pixels.mean())
