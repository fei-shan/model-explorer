import { Firestore } from '@google-cloud/firestore';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
if (!projectId) {
  throw new Error('GOOGLE_CLOUD_PROJECT env var is required (see server/.env.example)');
}

export const firestore = new Firestore({ projectId, ignoreUndefinedProperties: true });

export const COLLECTIONS = [
  'users',
  'projects',
  'datasets',
  'modelSpecs',
  'trainingRuns',
  'evaluations',
  'flags',
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];
