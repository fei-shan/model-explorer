"""
Firestore rejects arrays nested directly inside arrays, and
EvaluationMetrics.confusionMatrix.matrix is number[][]. Mirrors
server/src/serialize/evaluationMatrix.ts's toFirestore transform exactly
(flatten to {rows, cols, values}) so the API's existing fromFirestore
decode - already verified working for the seeded mock evaluations - handles
matrices written by this job with no changes on the server side.
"""


def encode_confusion_matrix(matrix: list) -> dict:
    rows = len(matrix)
    cols = len(matrix[0]) if rows else 0
    values = [v for row in matrix for v in row]
    return {"rows": rows, "cols": cols, "values": values}
