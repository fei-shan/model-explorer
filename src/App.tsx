import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { useAppStore } from './store/useAppStore';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetListPage } from './pages/DatasetListPage';
import { DatasetDetailPage } from './pages/DatasetDetailPage';
import { ModelListPage } from './pages/ModelListPage';
import { EvaluationListPage } from './pages/EvaluationListPage';
import { TrainingListPage } from './pages/TrainingListPage';
import { ReviewListPage } from './pages/ReviewListPage';
import { MemberListPage } from './pages/MemberListPage';
import { EvaluationDetailPage } from './pages/EvaluationDetailPage';
import { TrainingDetailPage } from './pages/TrainingDetailPage';
import { ModelDetailPage } from './pages/ModelDetailPage';

export default function App() {
  const isInitialized = useAppStore((s) => s.isInitialized);
  const initError = useAppStore((s) => s.initError);
  const initFromApi = useAppStore((s) => s.initFromApi);

  useEffect(() => {
    initFromApi();
  }, [initFromApi]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-sm text-red-400">Failed to load data from API: {initError}</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects/:projectId/datasets"                            element={<DatasetListPage />} />
          <Route path="/projects/:projectId/datasets/:datasetId"                 element={<DatasetDetailPage />} />
          <Route path="/projects/:projectId/models"                              element={<ModelListPage />} />
          <Route path="/projects/:projectId/models/:modelId"                    element={<ModelDetailPage />} />
          <Route path="/projects/:projectId/training"                            element={<TrainingListPage />} />
          <Route path="/projects/:projectId/training/:runId"                     element={<TrainingDetailPage />} />
          <Route path="/projects/:projectId/evaluations"                         element={<EvaluationListPage />} />
          <Route path="/projects/:projectId/evaluations/:evaluationId"           element={<EvaluationDetailPage />} />
          <Route path="/projects/:projectId/review"                              element={<ReviewListPage />} />
          <Route path="/projects/:projectId/members"                             element={<MemberListPage />} />
          <Route path="/projects/:projectId"                                     element={<Navigate to="evaluations" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
