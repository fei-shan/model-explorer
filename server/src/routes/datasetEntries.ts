import { Router } from 'express';
import { firestore } from '../firestore.js';
import { getUploadUrl, gcsUri } from '../gcs.js';
import type { Entry } from '../../../src/types/index.js';

/**
 * Phase 2 dataset-entry ingestion, per docs/data-pipeline.md §1: the frontend
 * (or, for now, the ingestion script) never uploads file bytes through this
 * API — it asks for a signed URL, PUTs directly to GCS, then confirms the
 * entry so it gets appended to the Dataset doc.
 */
export function datasetEntriesRoutes(): Router {
  const router = Router({ mergeParams: true });

  router.post('/:datasetId/entries/upload-url', async (req, res) => {
    const { datasetId } = req.params;
    const { entryId, contentType, ext } = req.body as {
      entryId?: string;
      contentType?: string;
      ext?: string;
    };
    if (!entryId || !contentType || !ext) {
      res.status(400).json({ error: 'entryId, contentType, and ext are required' });
      return;
    }
    const objectPath = `raw/${datasetId}/${entryId}.${ext}`;
    const uploadUrl = await getUploadUrl(objectPath, contentType);
    res.json({ uploadUrl, gcsUri: gcsUri('data', objectPath) });
  });

  router.post('/:datasetId/entries', async (req, res) => {
    const { datasetId } = req.params;
    const entry = req.body as Entry;
    if (!entry.id || !entry.imagePath) {
      res.status(400).json({ error: 'entry.id and entry.imagePath are required' });
      return;
    }
    const doc = firestore.collection('datasets').doc(datasetId);
    const snapshot = await doc.get();
    if (!snapshot.exists) {
      res.status(404).json({ error: `datasets/${datasetId} not found` });
      return;
    }
    const existing = (snapshot.data()!.entries ?? []) as Entry[];
    const entries = [...existing.filter((e) => e.id !== entry.id), entry];
    await doc.update({ entries });
    res.status(201).json(entry);
  });

  return router;
}
