import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import SameerDashboard from '../pages/sameer/SameerDashboard';

/** Render dashboard at / without redirect — keeps browser history clean */
export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'owner') return <OwnerDashboard />;
  return <SameerDashboard />;
}

function FallbackRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'owner' ? '/owner' : '/sameer'} replace />;
}

export { FallbackRedirect };
