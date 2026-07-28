import { Storage } from '@google-cloud/storage';
import { GoogleAuth, Impersonated } from 'google-auth-library';

const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const dataBucketName = process.env.DATA_BUCKET;
const artifactsBucketName = process.env.ARTIFACTS_BUCKET;
const signingServiceAccount = process.env.SIGNING_SERVICE_ACCOUNT;

if (!projectId || !dataBucketName || !artifactsBucketName || !signingServiceAccount) {
  throw new Error(
    'GOOGLE_CLOUD_PROJECT, DATA_BUCKET, ARTIFACTS_BUCKET, SIGNING_SERVICE_ACCOUNT env vars are required (see server/.env.example)',
  );
}

/**
 * V4 signed URLs need a service account identity to sign with. We always
 * sign as SIGNING_SERVICE_ACCOUNT (api-runtime) via short-lived
 * impersonation, whether the ambient credentials already ARE that service
 * account (Cloud Run, where api-runtime is the attached identity — this is
 * effectively self-impersonation) or a user account with
 * roles/iam.serviceAccountTokenCreator on it (local dev). One code path,
 * both environments.
 */
async function buildImpersonatedAuthClient() {
  const sourceClient = await new GoogleAuth().getClient();
  return new Impersonated({
    sourceClient,
    targetPrincipal: signingServiceAccount,
    targetScopes: ['https://www.googleapis.com/auth/cloud-platform'],
    lifetime: 3600,
  });
}

const storagePromise = buildImpersonatedAuthClient().then(
  (authClient) => new Storage({ projectId, authClient }),
);

export async function getUploadUrl(objectPath: string, contentType: string) {
  const storage = await storagePromise;
  const [url] = await storage
    .bucket(dataBucketName!)
    .file(objectPath)
    .getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + 15 * 60 * 1000, contentType });
  return url;
}

export function gcsUri(bucket: 'data' | 'artifacts', objectPath: string) {
  const name = bucket === 'data' ? dataBucketName : artifactsBucketName;
  return `gs://${name}/${objectPath}`;
}
