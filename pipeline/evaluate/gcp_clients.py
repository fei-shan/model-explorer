"""
Shared Firestore/GCS clients, authenticated as training-job-runtime via
short-lived impersonation - the same pattern server/src/gcs.ts uses for
api-runtime, and identical to pipeline/train/gcp_clients.py (duplicated
rather than shared as a package so each of pipeline/train and
pipeline/evaluate stays an independently buildable/deployable container;
this file is small enough that the duplication is cheaper than the
cross-container import plumbing). training-job-runtime is reused for both
the training and evaluation jobs - same trust boundary ("can read datasets,
write results"), no need for a third service account. One code path works
whether the ambient credentials already ARE training-job-runtime (Cloud Run
Job, prod - effectively self-impersonation) or a user account with
roles/iam.serviceAccountTokenCreator on it (local dev, this machine).

Required env vars (see pipeline/evaluate/.env.example):
  GOOGLE_CLOUD_PROJECT, DATA_BUCKET, ARTIFACTS_BUCKET, TRAINING_SERVICE_ACCOUNT
"""

import os

import google.auth
from google.auth.impersonated_credentials import Credentials as ImpersonatedCredentials
from google.cloud import firestore, storage

PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
DATA_BUCKET_NAME = os.environ["DATA_BUCKET"]
ARTIFACTS_BUCKET_NAME = os.environ["ARTIFACTS_BUCKET"]
TRAINING_SERVICE_ACCOUNT = os.environ["TRAINING_SERVICE_ACCOUNT"]


def _impersonated_credentials():
    source_credentials, _ = google.auth.default()
    return ImpersonatedCredentials(
        source_credentials=source_credentials,
        target_principal=TRAINING_SERVICE_ACCOUNT,
        target_scopes=["https://www.googleapis.com/auth/cloud-platform"],
        lifetime=3600,
    )


_credentials = _impersonated_credentials()

firestore_client = firestore.Client(project=PROJECT_ID, credentials=_credentials)
storage_client = storage.Client(project=PROJECT_ID, credentials=_credentials)
data_bucket = storage_client.bucket(DATA_BUCKET_NAME)
artifacts_bucket = storage_client.bucket(ARTIFACTS_BUCKET_NAME)


def gcs_uri(bucket: str, object_path: str) -> str:
    name = DATA_BUCKET_NAME if bucket == "data" else ARTIFACTS_BUCKET_NAME
    return f"gs://{name}/{object_path}"


def parse_gcs_uri(uri: str) -> tuple[str, str]:
    assert uri.startswith("gs://"), f"not a gs:// uri: {uri}"
    without_scheme = uri[len("gs://") :]
    bucket_name, _, object_path = without_scheme.partition("/")
    return bucket_name, object_path
