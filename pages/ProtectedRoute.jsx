import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Protège une route : redirige vers /signin si non connecté.
 *
 * Usage dans App.jsx :
 *   <Route path="/myspace" element={<ProtectedRoute><MySpace /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { currentUser } = useApp();
  // Double vérification : state React + token localStorage (survit au F5)
  const token = localStorage.getItem('access');

  if (!currentUser && !token) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
