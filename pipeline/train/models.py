"""
Task-type -> model registry, per docs/data-pipeline.md §3. Only
'classification' is implemented, matching the only ModelSpec.type the two
seeded toy datasets use; regression/clustering/detection/segmentation/
llm-finetuning are deferred (see the doc's §7).
"""

from sklearn.linear_model import SGDClassifier


def build_classifier(parameters: dict) -> SGDClassifier:
    # SGDClassifier(loss='log_loss') fits the same model family as
    # LogisticRegression, but supports partial_fit for real per-epoch
    # progress (needed for TrainingHistoryChart) instead of one opaque
    # batch .fit() call. 'C' (LogisticRegression-style inverse regularization
    # strength) doesn't map 1:1 onto SGD's alpha, so it's not consumed here;
    # penalty and epoch count (max_iter, repurposed as n_epochs by train.py)
    # are.
    #
    # alpha default is bumped well above sklearn's own default (0.0001):
    # at this dataset's scale (~16 train samples, up to 64 features) the
    # default lets the model perfectly fit the training set within a couple
    # of epochs, after which gradients vanish and the loss curve goes flat
    # for the rest of training - real, but a poor demo of per-epoch
    # progress. Stronger regularization trades a bit of (already-toy)
    # accuracy for an actually gradual, chart-worthy convergence curve.
    penalty = parameters.get("penalty", "l2")
    alpha = parameters.get("alpha", 0.05)
    return SGDClassifier(loss="log_loss", penalty=penalty, alpha=alpha, warm_start=True, random_state=0)


# Every ModelSpec.type the app's type system allows (src/types/index.ts
# ModelType), regardless of whether a trainer exists yet - see loaders.py's
# ALL_MODALITIES for the same pattern applied to modality.
ALL_MODEL_TYPES = ["classification", "regression", "detection", "segmentation", "clustering", "llm-finetuning"]

# Subset of ALL_MODEL_TYPES with an actual builder below.
MODEL_BUILDERS = {
    "classification": build_classifier,
}


def is_model_type_supported(model_type: str) -> bool:
    return model_type in MODEL_BUILDERS


def build_model(model_type: str, parameters: dict):
    if not is_model_type_supported(model_type):
        raise NotImplementedError(
            f"ModelSpec.type={model_type!r} has no model builder yet. "
            f"Implemented: {sorted(MODEL_BUILDERS)}. All types: {ALL_MODEL_TYPES}."
        )
    return MODEL_BUILDERS[model_type](parameters)
