"""
Task-type -> evaluator registry, mirroring pipeline/train/models.py's
pattern. Only 'classification' is implemented, matching the only
ModelSpec.type the two seeded toy datasets use; regression/clustering/
detection/segmentation/llm-finetuning are deferred (see
docs/data-pipeline.md §7) and would each produce a different
AnyEntryResult shape (ClusteringEntryResult, LLMEntryResult, ...), not just
a different model.
"""

from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, roc_auc_score

# Every ModelSpec.type the app's type system allows (src/types/index.ts
# ModelType) - see pipeline/train/models.py's ALL_MODEL_TYPES for the same
# pattern.
ALL_MODEL_TYPES = ["classification", "regression", "detection", "segmentation", "clustering", "llm-finetuning"]


def evaluate_classifier(model, label_encoder, entries, X, y_true):
    proba = model.predict_proba(X)
    y_pred = model.predict(X)
    labels = list(range(len(label_encoder.classes_)))

    entry_results = []
    for i, entry in enumerate(entries):
        entry_results.append(
            {
                "entryId": entry["id"],
                "subjectId": entry["subjectId"],
                "sessionId": entry["sessionId"],
                "predictedLabel": label_encoder.inverse_transform([y_pred[i]])[0],
                "trueLabel": entry["diagnosis"],
                "confidence": round(float(proba[i].max()), 4),
            }
        )

    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()
    metrics = {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "f1": round(float(f1_score(y_true, y_pred, labels=labels, average="macro")), 4),
        "confusionMatrix": {
            "labels": list(label_encoder.classes_),
            "matrix": cm,
        },
    }
    # ROC-AUC only defined when every class actually appears in y_true -
    # not guaranteed at this dataset's tiny scale (12 held-out samples).
    if len(set(y_true)) == len(labels):
        multi_class = "raise" if len(labels) == 2 else "ovr"
        auc_input = proba[:, 1] if len(labels) == 2 else proba
        metrics["auc"] = round(float(roc_auc_score(y_true, auc_input, labels=labels, multi_class=multi_class)), 4)

    return entry_results, metrics


EVALUATORS = {
    "classification": evaluate_classifier,
}


def is_model_type_supported(model_type: str) -> bool:
    return model_type in EVALUATORS


def evaluate(model_type: str, *args, **kwargs):
    if not is_model_type_supported(model_type):
        raise NotImplementedError(
            f"ModelSpec.type={model_type!r} has no evaluator yet. "
            f"Implemented: {sorted(EVALUATORS)}. All types: {ALL_MODEL_TYPES}."
        )
    return EVALUATORS[model_type](*args, **kwargs)
