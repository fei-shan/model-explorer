"""
Task-type -> model registry, per docs/data-pipeline.md §3. 'classification'
and 'regression' are implemented, matching the three seeded toy
ModelSpecs; detection/segmentation/clustering/llm-finetuning are deferred
(see the doc's §7).
"""

from sklearn.linear_model import SGDClassifier, SGDRegressor


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


def build_regressor(parameters: dict) -> SGDRegressor:
    # Same partial_fit-for-per-epoch-progress reasoning as build_classifier,
    # but the fix that worked there (raise alpha) barely moves the needle
    # here: squared-error loss has an unbounded gradient (unlike log-loss's
    # saturating one), so with only 16 train samples against a 66-dim input
    # (64 pixels + 2 caption features), sklearn's default
    # learning_rate='optimal' schedule takes steps large enough to overfit
    # in a handful of epochs regardless of alpha - and was observed to
    # occasionally diverge to astronomical loss values at low alpha.
    # learning_rate='constant' + small eta0 fixes the instability (verified
    # by direct sweep against the real data, not guesswork) and gives a
    # gradual, chart-worthy curve. R² still lands negative on the held-out
    # set even so - not a bug, the 4-sample val split's targets have a
    # standard deviation of ~0.015 (all 4 digits happen to have similar ink
    # coverage), so R²'s variance-normalized denominator is tiny and even a
    # small absolute error produces a harsh negative score. MAE/RMSE (also
    # reported) are the more honest read of this model at this data scale.
    penalty = parameters.get("penalty", "l2")
    alpha = parameters.get("alpha", 1.0)
    eta0 = parameters.get("eta0", 0.003)
    return SGDRegressor(
        penalty=penalty, alpha=alpha, learning_rate="constant", eta0=eta0, warm_start=True, random_state=0
    )


# Every ModelSpec.type the app's type system allows (src/types/index.ts
# ModelType), regardless of whether a trainer exists yet - see loaders.py's
# ALL_MODALITIES for the same pattern applied to modality.
ALL_MODEL_TYPES = ["classification", "regression", "detection", "segmentation", "clustering", "llm-finetuning"]

# Subset of ALL_MODEL_TYPES with an actual builder below.
MODEL_BUILDERS = {
    "classification": build_classifier,
    "regression": build_regressor,
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
