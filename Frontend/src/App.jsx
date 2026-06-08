import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing    from './pages/Landing'
import Signup     from './pages/Signup'
import Signin     from './pages/Signin'
import Explorer   from './pages/Explorer'
import MySpace    from './pages/MySpace'
import ItemDetail from './pages/ItemDetail'
import About      from './pages/About'
import UserProfile from './pages/UserProfile'
import ProtectedRoute from './components/ProtectedRoute'


export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/about"    element={<About />} />
          <Route path="/signup"   element={<Signup />} />
          <Route path="/signin"   element={<Signin />} />
          <Route path="/explorer" element={<ProtectedRoute><Explorer /></ProtectedRoute>} />
          <Route path="/my-space" element={<ProtectedRoute><MySpace /></ProtectedRoute>} />
          <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
          <Route path="/user/:id"  element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="*"         element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AppProvider>
  )
}