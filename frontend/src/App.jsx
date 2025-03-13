import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useUserRoles, hasAnyRole, hasRole } from './auth/auth-utils';
import Auth0ProviderWithHistory from './auth/Auth0Provider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import UserHome from './pages/UserHome.jsx';
import AdminHome from './pages/AdminHome.jsx';
import Login from './pages/Login.jsx';
import UploadPage from './pages/UploadPage.jsx';
import CreatePage from './pages/CreatePage.jsx';
import ViewPage from './pages/ViewPage.jsx';
import QueueAdminPage from './pages/QueueAdminPage.jsx';
import UserAdminPage from './pages/UserAdminPage.jsx';
import LoadingPage from './pages/LoadingPage.jsx';

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth0();
  const userRoles = useUserRoles();

  if (isLoading) {
    return <LoadingPage />;
  }

  // Auth guard - checks if user is authenticated and has required role
  const RequireAuth = ({ children, allowedRoles = ['user', 'admin'] }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (!hasAnyRole(userRoles, allowedRoles)) {
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
            element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/" 
            element={
              !isAuthenticated ? <Navigate to="/login" /> :
              hasRole(userRoles, 'admin') ? <AdminHome /> : <UserHome />
            } 
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
    <Auth0ProviderWithHistory>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Auth0ProviderWithHistory>
  );
}

export default App;