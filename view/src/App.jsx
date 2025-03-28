import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import UserHome from './pages/UserHome.jsx';
import AdminHome from './pages/AdminHome.jsx';
import LogIn from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import UploadPage from './pages/UploadPage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import ViewPage from './pages/ViewPage.jsx';
import QueueAdminPage from './pages/QueueAdminPage.jsx';
import UserAdminPage from './pages/UserAdminPage.jsx';
import LoadingPage from './pages/LoadingPage.jsx';
import AuthProvider from './auth/AuthProvider.jsx';
import { useAuth } from './auth/authContext.js';

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