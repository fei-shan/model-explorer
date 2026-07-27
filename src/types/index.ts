export type UserRole = 'researcher' | 'practitioner';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  affiliation: string;
}

export interface ProjectMember {
  userId: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  domain: string;
  createdBy: string;
  members: ProjectMember[];
  datasetIds: string[];
  modelSpecIds: string[];
  evaluationIds: string[];
  trainingRunIds: string[];
  createdAt: string;
}

export type ModalityType = 'MRI' | 'ECG' | 'CT' | 'Pathology' | 'Clinical Note' | 'X-Ray';
export type DatasetRole = 'training' | 'evaluation';
export type EntrySplit = 'train' | 'val';

export interface Entry {
  id: string;
  datasetId: string;
  subjectId: string;
  sessionId: string;
  date: string;
  age: number;
  sex: 'M' | 'F';
  diagnosis: string;
  modalityType: ModalityType;
  imagePath: string;
  split?: EntrySplit;
}

export interface Dataset {
  id: string;
  projectId: string;
  name: string;
  description: string;
  modalities: ModalityType[];
  labelSet: string[];
  entries: Entry[];
  createdAt: string;
  role: DatasetRole;
}

export interface WeightSnapshot {
  id: string;
  modelSpecId: string;
  name: string;
  description: string;
  savedAt: string;
  filePath: string;
  sourceTrainingRunId?: string;
}

export type ModelType = 'classification' | 'regression' | 'detection' | 'segmentation' | 'clustering' | 'llm-finetuning';

export interface ModelSpec {
  id: string;
  projectId: string;
  name: string;
  description: string;
  type: ModelType;
  architecture: string;
  parameters: Record<string, string | number | boolean>;
  savedWeights: WeightSnapshot[];
  uploadedAt: string;
  uploadedBy: string;
}

// ── Evaluation (formerly Experiment) ─────────────────────────────────────────
export type EvaluationStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface EntryResult {
  entryId: string;
  subjectId: string;
  sessionId: string;
  predictedLabel: string;
  trueLabel: string;
  confidence: number;
}

export interface ClusteringEntryResult {
  entryId: string;
  subjectId: string;
  sessionId: string;
  clusterId: number;
  distanceToCentroid: number;
  silhouetteScore: number;
}

export interface LLMEntryResult {
  entryId: string;
  subjectId: string;
  sessionId: string;
  prompt: string;
  referenceCompletion: string;
  generatedCompletion: string;
  rougeL: number;
  bleu: number;
}

export type AnyEntryResult = EntryResult | ClusteringEntryResult | LLMEntryResult;

export interface ConfusionMatrixData {
  labels: string[];
  matrix: number[][];
}

export interface EvaluationMetrics {
  // classification / regression
  accuracy?: number;
  auc?: number;
  f1?: number;
  sensitivity?: number;
  specificity?: number;
  confusionMatrix?: ConfusionMatrixData;
  rmse?: number;
  mae?: number;
  r2?: number;
  // clustering
  silhouetteScore?: number;
  daviesBouldinIndex?: number;
  calinskiHarabaszIndex?: number;
  numClusters?: number;
  clusterSizes?: number[];
  // llm-finetuning
  perplexity?: number;
  rougeL?: number;
  bleu?: number;
  bertScore?: number;
  benchmarks?: Record<string, number>;
}

export interface Evaluation {
  id: string;
  projectId: string;
  modelSpecId: string;
  weightsSnapshotId: string;
  datasetId: string;
  runBy: string;
  status: EvaluationStatus;
  createdAt: string;
  completedAt?: string;
  metrics: EvaluationMetrics;
  entryResults: AnyEntryResult[];
}

// ── Training Run ─────────────────────────────────────────────────────────────
export type TrainingStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TrainingEpoch {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  valAccuracy: number;
}

export interface TrainingMetrics {
  finalTrainLoss: number;
  finalValLoss: number;
  finalValAccuracy: number;
  epochs: number;
}

export interface TrainingRun {
  id: string;
  projectId: string;
  modelSpecId: string;
  baseWeightsSnapshotId?: string;
  trainDatasetId: string;
  runBy: string;
  status: TrainingStatus;
  parameterOverrides: Record<string, string | number | boolean>;
  createdAt: string;
  completedAt?: string;
  outputWeightsSnapshotId?: string;
  trainingHistory: TrainingEpoch[];
  finalMetrics?: TrainingMetrics;
}

export type FlagStatus = 'open' | 'commented' | 'dismissed';

export interface FlagInsight {
  providedBy: string;
  comment: string;
  createdAt: string;
}

export interface Flag {
  id: string;
  entryId: string;
  subjectId: string;
  sessionId: string;
  evaluationId?: string;
  datasetId?: string;
  raisedBy: string;
  reason: string;
  status: FlagStatus;
  insights: FlagInsight[];
  dismissedBy?: string;
  dismissedAt?: string;
  createdAt: string;
}
