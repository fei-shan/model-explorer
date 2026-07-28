import { Router } from 'express';
import { firestore } from '../firestore.js';
import { runEvaluationJob } from '../cloudRunJobs.js';
import type { Evaluation } from '../../../src/types/index.js';

/**
 * Phase 4 trigger endpoint, mirroring trainingRunTrigger.ts: creates the
 * Evaluation doc (status: pending) then fires the Cloud Run Job - it does
 * NOT wait for evaluation to finish. The frontend/caller polls
 * GET /evaluations/:id afterward; the job itself flips status to
 * running/completed/failed and fills in entryResults/metrics.
 */
export function evaluationTriggerRoutes(): Router {
  const router = Router({ mergeParams: true });

  router.post('/:projectId/evaluations', async (req, res) => {
    const { projectId } = req.params;
    const body = req.body as Partial<Evaluation>;
    if (!body.modelSpecId || !body.weightsSnapshotId || !body.datasetId || !body.runBy) {
      res.status(400).json({ error: 'modelSpecId, weightsSnapshotId, datasetId, and runBy are required' });
      return;
    }

    const id = `ev-${Date.now().toString(36)}`;
    const evaluation: Evaluation = {
      id,
      projectId,
      modelSpecId: body.modelSpecId,
      weightsSnapshotId: body.weightsSnapshotId,
      datasetId: body.datasetId,
      runBy: body.runBy,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metrics: {},
      entryResults: [],
    };
    await firestore.collection('evaluations').doc(id).set(evaluation);

    const projectRef = firestore.collection('projects').doc(projectId);
    const projectSnap = await projectRef.get();
    if (projectSnap.exists) {
      const evaluationIds = (projectSnap.data()!.evaluationIds ?? []) as string[];
      await projectRef.update({ evaluationIds: [...evaluationIds, id] });
    }

    try {
      await runEvaluationJob(id);
    } catch (err) {
      await firestore.collection('evaluations').doc(id).update({ status: 'failed' });
      res.status(502).json({
        error: `evaluation created but failed to start job: ${err instanceof Error ? err.message : String(err)}`,
      });
      return;
    }

    res.status(202).json(evaluation);
  });

  return router;
}
