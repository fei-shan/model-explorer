import type { EntryResult, ModelType } from '../types';

// Regression predictions are essentially never going to exactly equal the
// true value (floating point), so exact string equality - correct for
// classification - would flag ~every row as a "failure" regardless of model
// quality. This tolerance is for display purposes only (a rough "close
// enough" badge); the real numbers are RMSE/MAE/R2 in MetricsPanel.
const REGRESSION_MATCH_TOLERANCE = 0.05;

export function isEntryResultCorrect(result: EntryResult, modelType: ModelType | undefined): boolean {
  if (modelType === 'regression') {
    const predicted = Number(result.predictedLabel);
    const trueValue = Number(result.trueLabel);
    if (Number.isNaN(predicted) || Number.isNaN(trueValue)) return result.predictedLabel === result.trueLabel;
    return Math.abs(predicted - trueValue) <= REGRESSION_MATCH_TOLERANCE;
  }
  return result.predictedLabel === result.trueLabel;
}
