import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/app/store/authStore';

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  return <Outlet />;
}