/**
 * Firestore rejects arrays nested directly inside arrays (e.g. number[][]),
 * which EvaluationMetrics.confusionMatrix.matrix is. Flatten to a
 * Firestore-safe shape on write, restore the number[][] shape on read, so
 * the public API/frontend contract (src/types/index.ts) never changes.
 */
interface FlatMatrix {
  rows: number;
  cols: number;
  values: number[];
}

function isMatrix2D(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every((row) => Array.isArray(row));
}

function isFlatMatrix(value: unknown): value is FlatMatrix {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rows' in value &&
    'cols' in value &&
    'values' in value
  );
}

export function toFirestore(record: Record<string, unknown>): Record<string, unknown> {
  const metrics = record.metrics as { confusionMatrix?: { matrix?: unknown } } | undefined;
  const matrix = metrics?.confusionMatrix?.matrix;
  if (!isMatrix2D(matrix)) return record;

  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const flat: FlatMatrix = { rows, cols, values: matrix.flat() };
  return {
    ...record,
    metrics: {
      ...metrics,
      confusionMatrix: { ...metrics!.confusionMatrix, matrix: flat },
    },
  };
}

export function fromFirestore(record: Record<string, unknown>): Record<string, unknown> {
  const metrics = record.metrics as { confusionMatrix?: { matrix?: unknown } } | undefined;
  const flat = metrics?.confusionMatrix?.matrix;
  if (!isFlatMatrix(flat)) return record;

  const matrix: number[][] = [];
  for (let i = 0; i < flat.rows; i++) {
    matrix.push(flat.values.slice(i * flat.cols, (i + 1) * flat.cols));
  }
  return {
    ...record,
    metrics: {
      ...metrics,
      confusionMatrix: { ...metrics!.confusionMatrix, matrix },
    },
  };
}
