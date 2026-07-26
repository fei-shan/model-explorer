import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
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
