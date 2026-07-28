import type {
  User,
  Project,
  Dataset,
  ModelSpec,
  TrainingRun,
  Evaluation,
  Flag,
} from '../types';
import { API_BASE_URL } from './config';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function collectionClient<T extends { id: string }>(name: string) {
  return {
    list: () => request<T[]>(`/${name}`),
    get: (id: string) => request<T>(`/${name}/${id}`),
    create: (record: T) =>
      request<T>(`/${name}`, { method: 'POST', body: JSON.stringify(record) }),
    update: (id: string, patch: Partial<T>) =>
      request<T>(`/${name}/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
    remove: (id: string) => request<void>(`/${name}/${id}`, { method: 'DELETE' }),
  };
}

export interface StartTrainingRunInput {
  modelSpecId: string;
  trainDatasetId: string;
  baseWeightsSnapshotId?: string;
  runBy: string;
  parameterOverrides: Record<string, string | number | boolean>;
}

export interface StartEvaluationInput {
  modelSpecId: string;
  weightsSnapshotId: string;
  datasetId: string;
  runBy: string;
}

export const api = {
  users: collectionClient<User>('users'),
  projects: {
    ...collectionClient<Project>('projects'),
    startTrainingRun: (projectId: string, input: StartTrainingRunInput) =>
      request<TrainingRun>(`/projects/${projectId}/training-runs`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    startEvaluation: (projectId: string, input: StartEvaluationInput) =>
      request<Evaluation>(`/projects/${projectId}/evaluations`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },
  datasets: collectionClient<Dataset>('datasets'),
  modelSpecs: collectionClient<ModelSpec>('modelSpecs'),
  trainingRuns: collectionClient<TrainingRun>('trainingRuns'),
  evaluations: collectionClient<Evaluation>('evaluations'),
  flags: collectionClient<Flag>('flags'),
};
