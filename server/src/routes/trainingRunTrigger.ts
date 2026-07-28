import { Router } from 'express';
import { firestore } from '../firestore.js';
import { runTrainingJob } from '../cloudRunJobs.js';
import type { TrainingRun } from '../../../src/types/index.js';

/**
 * Phase 3 trigger endpoint, per docs/data-pipeline.md §4: creates the
 * TrainingRun doc (status: pending) then fires the Cloud Run Job - it does
 * NOT wait for training to finish. The frontend/caller polls
 * GET /trainingRuns/:id afterward; the job itself flips status to
 * running/completed/failed and fills in trainingHistory/finalMetrics.
 */
export function trainingRunTriggerRoutes(): Router {
  const router = Router({ mergeParams: true });

  router.post('/:projectId/training-runs', async (req, res) => {
    const { projectId } = req.params;
    const body = req.body as Partial<TrainingRun>;
    if (!body.modelSpecId || !body.trainDatasetId || !body.runBy) {
      res.status(400).json({ error: 'modelSpecId, trainDatasetId, and runBy are required' });
      return;
    }

    const id = `tr-${Date.now().toString(36)}`;
    const run: TrainingRun = {
      id,
      projectId,
      modelSpecId: body.modelSpecId,
      trainDatasetId: body.trainDatasetId,
      baseWeightsSnapshotId: body.baseWeightsSnapshotId,
      runBy: body.runBy,
      status: 'pending',
      parameterOverrides: body.parameterOverrides ?? {},
      createdAt: new Date().toISOString(),
      trainingHistory: [],
    };
    await firestore.collection('trainingRuns').doc(id).set(run);

    const projectRef = firestore.collection('projects').doc(projectId);
    const projectSnap = await projectRef.get();
    if (projectSnap.exists) {
      const trainingRunIds = (projectSnap.data()!.trainingRunIds ?? []) as string[];
      await projectRef.update({ trainingRunIds: [...trainingRunIds, id] });
    }

    try {
      await runTrainingJob(id);
    } catch (err) {
      await firestore.collection('trainingRuns').doc(id).update({ status: 'failed' });
      res.status(502).json({
        error: `training run created but failed to start job: ${err instanceof Error ? err.message : String(err)}`,
      });
      return;
    }

    res.status(202).json(run);
  });

  return router;
}
