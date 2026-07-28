import { GoogleAuth, Impersonated } from 'google-auth-library';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const region = process.env.GCP_REGION;
const trainJobName = process.env.TRAIN_JOB_NAME;
const evaluateJobName = process.env.EVALUATE_JOB_NAME;
const signingServiceAccount = process.env.SIGNING_SERVICE_ACCOUNT;

if (!projectId || !region || !trainJobName || !evaluateJobName || !signingServiceAccount) {
  throw new Error(
    'GOOGLE_CLOUD_PROJECT, GCP_REGION, TRAIN_JOB_NAME, EVALUATE_JOB_NAME, SIGNING_SERVICE_ACCOUNT env vars are required (see server/.env.example)',
  );
}

// Calls the Cloud Run Admin REST API directly (rather than the
// @google-cloud/run client library) because that package pulls in
// google-auth-library@10.x while the rest of this project's dependencies
// (firestore, storage) are on 9.x - a real, incompatible-at-runtime version
// split (confirmed by "headers.forEach is not a function" when mixing
// them), not just a type-checking nuisance. One fewer heavy dependency,
// and reuses the same impersonation pattern as gcs.ts.
async function buildImpersonatedClient() {
  const sourceClient = await new GoogleAuth().getClient();
  return new Impersonated({
    sourceClient,
    targetPrincipal: signingServiceAccount,
    targetScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    lifetime: 3600,
  });
}

const clientPromise = buildImpersonatedClient();

/** Fire-and-forget: starts a Cloud Run Job execution with one env var override, does not await completion. */
async function runJob(jobName: string, envName: string, envValue: string): Promise<void> {
  const client = await clientPromise;
  const url = `https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/jobs/${jobName}:run`;
  await client.request({
    url,
    method: 'POST',
    data: {
      overrides: {
        containerOverrides: [{ env: [{ name: envName, value: envValue }] }],
      },
    },
  });
}

export const runTrainingJob = (trainingRunId: string) => runJob(trainJobName!, 'TRAINING_RUN_ID', trainingRunId);
export const runEvaluationJob = (evaluationId: string) => runJob(evaluateJobName!, 'EVALUATION_ID', evaluationId);
