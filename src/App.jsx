import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Library from './pages/Library';
import SeriesDetails from './pages/SeriesDetails';
import Reader from './pages/Reader';
import Browse from './pages/Browse';
import { clearAuthSession, isAuthenticated } from './authSession';

function PrivateRoute({ children }) {
  if (!isAuthenticated()) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function HomeRedirect() {
  return <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/library" element={<PrivateRoute><Library /></PrivateRoute>} />
        <Route path="/library/:seriesId" element={<PrivateRoute><SeriesDetails /></PrivateRoute>} />
        <Route path="/reader/:seriesId/:chapterId" element={<PrivateRoute><Reader /></PrivateRoute>} />
        <Route path="/browse" element={<PrivateRoute><Browse /></PrivateRoute>} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
