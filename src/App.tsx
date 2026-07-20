import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetsPage, ModelsPage, EvaluationsListPage, TrainingListPage, ReviewPage, MembersPage } from './pages/ProjectPages';
import { EvaluationPage } from './pages/EvaluationPage';
import { TrainingDetailPage } from './pages/TrainingDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects/:projectId/datasets"                            element={<DatasetsPage />} />
          <Route path="/projects/:projectId/models"                              element={<ModelsPage />} />
          <Route path="/projects/:projectId/training"                            element={<TrainingListPage />} />
          <Route path="/projects/:projectId/training/:runId"                     element={<TrainingDetailPage />} />
          <Route path="/projects/:projectId/evaluations"                         element={<EvaluationsListPage />} />
          <Route path="/projects/:projectId/evaluations/:evaluationId"           element={<EvaluationPage />} />
          <Route path="/projects/:projectId/review"                              element={<ReviewPage />} />
          <Route path="/projects/:projectId/members"                             element={<MembersPage />} />
          <Route path="/projects/:projectId"                                     element={<Navigate to="evaluations" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
