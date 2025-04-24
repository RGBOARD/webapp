import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import UserHome from './pages/UserHome';
import AdminHome from './pages/AdminHome';
import LogIn from './pages/Login';
import SignUp from './pages/SignUp';
import UploadPage from './pages/UploadPage';
import CreatePage from './pages/CreatePage';
import ViewPage from './pages/ViewPage';
import QueueAdminPage from './pages/QueueAdminPage';
import UserAdminPage from './pages/UserAdminPage';
import LoadingPage from './pages/LoadingPage';
import AuthProvider from './auth/AuthProvider';
import { useAuth } from './auth/authContext';

function UploadHistoryPage() {
    return null;
}

function AppContent() {
  const { isLoading, isAuthenticated, hasRole, hasAnyRole } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  // Auth guard - checks if user is authenticated and has required role
  const RequireAuth = ({ children, allowedRoles = ['user', 'admin'] }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (!hasAnyRole(allowedRoles)) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  return (
    <div className="app-container">
      <Header />
      <main className="content">
        <Routes>
          <Route 
            path="/login" 
            element={ isAuthenticated ? <Navigate to="/" /> : <LogIn />} 
          />
          <Route 
            path="/" 
            element={
              !isAuthenticated ? <Navigate to="/login" /> :
              hasRole('admin') ? <AdminHome /> : <UserHome />
            } 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/" /> : <SignUp />}
          />
          <Route 
            path="/upload" 
            element={
              <RequireAuth>
                <UploadPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/create" 
            element={
              <RequireAuth>
                <CreatePage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/view" 
            element={
              <RequireAuth>
                <ViewPage />
              </RequireAuth>
            } 
          />
          <Route
            path="/upload-history"
            element={
              <RequireAuth>
                <UploadHistoryPage />
              </RequireAuth>
            }
          />
          <Route 
            path="/queue-admin" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <QueueAdminPage />
              </RequireAuth>
            } 
          />
          <Route 
            path="/user-admin" 
            element={
              <RequireAuth allowedRoles={['admin']}>
                <UserAdminPage />
              </RequireAuth>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;