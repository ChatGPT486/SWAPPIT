import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import Explorer from './pages/Explorer';
import MySpace from './pages/MySpace';
import ItemDetail from './pages/ItemDetail';
import CreateItem from './pages/CreateItem';
import About from './pages/About';
import ProposerTroc from './pages/ProposerTroc';

export default function App() {
  return (
    <Router>
      {/*
        AppProvider enveloppe toute l'application :
        - currentUser disponible partout via useApp()
        - login() / logout() accessibles dans Signin et Navbar
      */}
      <AppProvider>
        <Routes>
          {/* ── Pages publiques ── */}
          <Route path="/"       element={<Landing />} />
          <Route path="/about"  element={<About />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signin" element={<Signin />} />

          {/* ── Pages protégées ── */}
          <Route path="/explorer"
            element={<ProtectedRoute><Explorer /></ProtectedRoute>} />
          <Route path="/myspace"
            element={<ProtectedRoute><MySpace /></ProtectedRoute>} />
          <Route path="/item/:id"
            element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
          <Route path="/explorer/:id"
            element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
          <Route path="/publier"
            element={<ProtectedRoute><CreateItem /></ProtectedRoute>} />
          <Route path="/proposer-troc/:targetItemId"
            element={<ProtectedRoute><ProposerTroc /></ProtectedRoute>} />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </Router>
  );
}
