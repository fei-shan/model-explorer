import {
  USERS,
  PROJECTS,
  DATASETS,
  TRAINING_DATASETS,
  MODEL_SPECS,
  EVALUATIONS,
  TRAINING_RUNS,
  FLAGS,
} from '../../../src/mocks/index.js';
import { firestore } from '../firestore.js';
import { toFirestore as evaluationToFirestore } from '../serialize/evaluationMatrix.js';

/**
 * One-off Phase 1 seed: import the existing src/mocks/* arrays into Firestore
 * verbatim, doc id = record.id. Re-runnable (upserts via .set), not additive.
 */
async function seedCollection(
  name: string,
  records: { id: string }[],
  toFirestore: (r: Record<string, unknown>) => Record<string, unknown> = (r) => r,
) {
  const batch = firestore.batch();
  for (const record of records) {
    batch.set(firestore.collection(name).doc(record.id), toFirestore(record));
  }
  await batch.commit();
  console.log(`seeded ${records.length} docs into ${name}`);
}

async function main() {
  await seedCollection('users', USERS);
  await seedCollection('projects', PROJECTS);
  await seedCollection('datasets', [...DATASETS, ...TRAINING_DATASETS]);
  await seedCollection('modelSpecs', MODEL_SPECS);
  await seedCollection('evaluations', EVALUATIONS, evaluationToFirestore);
  await seedCollection('trainingRuns', TRAINING_RUNS);
  await seedCollection('flags', FLAGS);
  console.log('seed complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
