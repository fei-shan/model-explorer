import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/useAppStore';

export function Layout() {
  const { currentUser } = useAppStore();

  if (!currentUser) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
