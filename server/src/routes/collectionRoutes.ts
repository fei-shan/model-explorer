import { Router } from 'express';
import { firestore, type CollectionName } from '../firestore.js';

type Transform = (record: Record<string, unknown>) => Record<string, unknown>;

interface CollectionRoutesOptions {
  /** Applied to a record right before it's written to Firestore. */
  toFirestore?: Transform;
  /** Applied to a record right after it's read from Firestore, before it's sent as JSON. */
  fromFirestore?: Transform;
}

/**
 * Generic REST CRUD for a top-level Firestore collection. Phase 1 intentionally
 * has no per-resource logic (no joins, no validation beyond "has an id") — it
 * exists to prove the deploy/Firestore/CORS plumbing works before any real
 * training/eval behavior is added. Filtering (e.g. datasets by projectId) is
 * done client-side against these flat lists for now, matching what the
 * Zustand store already does against the mock arrays.
 *
 * The optional toFirestore/fromFirestore hooks exist for the one exception:
 * Firestore rejects arrays nested directly inside arrays, so fields shaped
 * like that (e.g. Evaluation.metrics.confusionMatrix.matrix) need a
 * reshape at the storage boundary. See serialize/evaluationMatrix.ts.
 */
export function collectionRoutes(name: CollectionName, options: CollectionRoutesOptions = {}): Router {
  const router = Router();
  const collection = firestore.collection(name);
  const toFirestore = options.toFirestore ?? ((r: Record<string, unknown>) => r);
  const fromFirestore = options.fromFirestore ?? ((r: Record<string, unknown>) => r);

  router.get('/', async (_req, res) => {
    const snapshot = await collection.get();
    res.json(snapshot.docs.map((doc) => fromFirestore(doc.data()!)));
  });

  router.get('/:id', async (req, res) => {
    const doc = await collection.doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: `${name}/${req.params.id} not found` });
      return;
    }
    res.json(fromFirestore(doc.data()!));
  });

  router.post('/', async (req, res) => {
    const body = req.body as { id?: string };
    if (!body.id) {
      res.status(400).json({ error: 'body.id is required' });
      return;
    }
    await collection.doc(body.id).set(toFirestore(body));
    res.status(201).json(body);
  });

  router.put('/:id', async (req, res) => {
    await collection.doc(req.params.id).set(toFirestore(req.body), { merge: true });
    const doc = await collection.doc(req.params.id).get();
    res.json(fromFirestore(doc.data()!));
  });

  router.delete('/:id', async (req, res) => {
    await collection.doc(req.params.id).delete();
    res.status(204).end();
  });

  return router;
}
