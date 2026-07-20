import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../ui/Badge';

export function Header() {
  const { currentUser, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!currentUser) return null;

  return (
    <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <Badge variant={currentUser.role === 'researcher' ? 'researcher' : 'practitioner'}>
          {currentUser.role === 'researcher' ? 'ML Researcher' : 'Practitioner'}
        </Badge>
        <div className="flex items-center gap-1.5 text-sm text-slate-700">
          <User size={14} className="text-slate-400" />
          <span className="font-medium">{currentUser.name}</span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  );
}
