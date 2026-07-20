import { create } from 'zustand';
import type {
  User, Project, Dataset, ModelSpec, Evaluation, TrainingRun, Flag,
  FlagInsight, EvaluationStatus, TrainingStatus, Entry,
  WeightSnapshot, TrainingEpoch, TrainingMetrics,
} from '../types';
import { USERS } from '../data/users';
import { PROJECTS } from '../data/projects';
import { DATASETS, TRAINING_DATASETS } from '../data/datasets';
import { MODEL_SPECS } from '../data/modelSpecs';
import { EVALUATIONS } from '../data/evaluations';
import { TRAINING_RUNS } from '../data/trainingRuns';
import { FLAGS } from '../data/flags';

interface AppState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  datasets: Dataset[];
  modelSpecs: ModelSpec[];
  evaluations: Evaluation[];
  trainingRuns: TrainingRun[];
  flags: Flag[];

  // Auth
  login: (userId: string) => void;
  logout: () => void;

  // Flag actions
  addFlag: (flag: Omit<Flag, 'id' | 'createdAt'>) => void;
  addInsight: (flagId: string, insight: FlagInsight) => void;
  dismissFlag: (flagId: string) => void;

  // Evaluation actions
  setEvaluationStatus: (evaluationId: string, status: EvaluationStatus) => void;

  // Training run actions
  addTrainingRun: (run: Omit<TrainingRun, 'id' | 'createdAt' | 'trainingHistory' | 'finalMetrics' | 'outputWeightsSnapshotId'>) => string;
  setTrainingRunStatus: (runId: string, status: TrainingStatus) => void;
  completeTrainingRun: (runId: string, history: TrainingEpoch[], metrics: TrainingMetrics, weightName: string) => void;

  // Entry actions
  updateEntry: (datasetId: string, entryId: string, updates: Partial<Entry>) => void;

  // Selectors
  getAccessibleProjects: () => Project[];
  getUserById: (userId: string) => User | undefined;
  getProjectById: (projectId: string) => Project | undefined;
  getDatasetById: (datasetId: string) => Dataset | undefined;
  getModelSpecById: (modelSpecId: string) => ModelSpec | undefined;
  getEvaluationById: (evaluationId: string) => Evaluation | undefined;
  getTrainingRunById: (runId: string) => TrainingRun | undefined;
  getFlagsForEvaluation: (evaluationId: string) => Flag[];
  getFlagsForProject: (projectId: string) => Flag[];
}

let _flagCounter = 100;
let _runCounter = 100;
let _weightCounter = 100;

function generateTrainingHistory(epochs: number, finalValAcc: number): TrainingEpoch[] {
  return Array.from({ length: epochs }, (_, i) => {
    const t = (i + 1) / epochs;
    const trainLoss = +(1.8 * Math.exp(-3.5 * t) + 0.18).toFixed(3);
    const valLoss   = +(1.6 * Math.exp(-2.8 * t) + 0.28).toFixed(3);
    const valAccuracy = +Math.min(finalValAcc, finalValAcc * (1 - Math.exp(-5 * t))).toFixed(3);
    return { epoch: i + 1, trainLoss, valLoss, valAccuracy };
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: USERS,
  projects: PROJECTS,
  datasets: [...DATASETS, ...TRAINING_DATASETS],
  modelSpecs: MODEL_SPECS,
  evaluations: EVALUATIONS,
  trainingRuns: TRAINING_RUNS,
  flags: FLAGS,

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) set({ currentUser: user });
  },
  logout: () => set({ currentUser: null }),

  // ── Flag actions ──────────────────────────────────────────────────────────
  addFlag: (flagData) => {
    const newFlag: Flag = { ...flagData, id: `f-${++_flagCounter}`, createdAt: new Date().toISOString() };
    set((s) => ({ flags: [...s.flags, newFlag] }));
  },
  addInsight: (flagId, insight) => {
    set((s) => ({
      flags: s.flags.map((f) => f.id === flagId ? { ...f, status: 'commented' as const, insight } : f),
    }));
  },
  dismissFlag: (flagId) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set((s) => ({
      flags: s.flags.map((f) =>
        f.id === flagId
          ? { ...f, status: 'dismissed' as const, dismissedBy: currentUser.id, dismissedAt: new Date().toISOString() }
          : f,
      ),
    }));
  },

  // ── Evaluation actions ────────────────────────────────────────────────────
  setEvaluationStatus: (evaluationId, status) => {
    set((s) => ({
      evaluations: s.evaluations.map((e) =>
        e.id === evaluationId
          ? { ...e, status, completedAt: status === 'completed' ? new Date().toISOString() : e.completedAt }
          : e,
      ),
    }));
  },

  // ── Training run actions ──────────────────────────────────────────────────
  addTrainingRun: (runData) => {
    const id = `tr-${++_runCounter}`;
    const newRun: TrainingRun = {
      ...runData,
      id,
      createdAt: new Date().toISOString(),
      trainingHistory: [],
    };
    set((s) => ({
      trainingRuns: [...s.trainingRuns, newRun],
      projects: s.projects.map((p) =>
        p.id === runData.projectId ? { ...p, trainingRunIds: [...p.trainingRunIds, id] } : p,
      ),
    }));
    return id;
  },

  setTrainingRunStatus: (runId, status) => {
    set((s) => ({
      trainingRuns: s.trainingRuns.map((r) =>
        r.id === runId ? { ...r, status } : r,
      ),
    }));
  },

  completeTrainingRun: (runId, history, metrics, weightName) => {
    const run = get().trainingRuns.find((r) => r.id === runId);
    if (!run) return;
    const weightId = `w-new-${++_weightCounter}`;
    const newSnapshot: WeightSnapshot = {
      id: weightId,
      modelSpecId: run.modelSpecId,
      name: weightName,
      description: `Produced by training run ${runId}`,
      savedAt: new Date().toISOString(),
      filePath: `/weights/auto_${runId}.pth`,
      sourceTrainingRunId: runId,
    };
    set((s) => ({
      trainingRuns: s.trainingRuns.map((r) =>
        r.id === runId
          ? { ...r, status: 'completed' as const, completedAt: new Date().toISOString(), trainingHistory: history, finalMetrics: metrics, outputWeightsSnapshotId: weightId }
          : r,
      ),
      modelSpecs: s.modelSpecs.map((m) =>
        m.id === run.modelSpecId ? { ...m, savedWeights: [...m.savedWeights, newSnapshot] } : m,
      ),
    }));
  },

  // ── Entry actions ─────────────────────────────────────────────────────────
  updateEntry: (datasetId, entryId, updates) => {
    set((s) => ({
      datasets: s.datasets.map((d) =>
        d.id === datasetId
          ? { ...d, entries: d.entries.map((e) => (e.id === entryId ? { ...e, ...updates } : e)) }
          : d,
      ),
    }));
  },

  // ── Selectors ─────────────────────────────────────────────────────────────
  getAccessibleProjects: () => {
    const { currentUser, projects } = get();
    if (!currentUser) return [];
    return projects.filter((p) => p.members.some((m) => m.userId === currentUser.id));
  },
  getUserById: (userId) => get().users.find((u) => u.id === userId),
  getProjectById: (projectId) => get().projects.find((p) => p.id === projectId),
  getDatasetById: (datasetId) => get().datasets.find((d) => d.id === datasetId),
  getModelSpecById: (modelSpecId) => get().modelSpecs.find((m) => m.id === modelSpecId),
  getEvaluationById: (evaluationId) => get().evaluations.find((e) => e.id === evaluationId),
  getTrainingRunById: (runId) => get().trainingRuns.find((r) => r.id === runId),
  getFlagsForEvaluation: (evaluationId) => get().flags.filter((f) => f.evaluationId === evaluationId),
  getFlagsForProject: (projectId) => {
    const { evaluations, flags } = get();
    const evalIds = new Set(evaluations.filter((e) => e.projectId === projectId).map((e) => e.id));
    return flags.filter((f) => evalIds.has(f.evaluationId));
  },
}));

export { generateTrainingHistory };
