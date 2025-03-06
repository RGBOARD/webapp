import React from 'react';
import { useState, useEffect } from 'react';
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

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, []);

  const handleLogin = (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('userRole');
  };

  // Auth guard - checks if user is authenticated and has required role
  const RequireAuth = ({ children, allowedRoles = ['user', 'admin'] }) => {
    if (!userRole) {
      return <Navigate to="/login" replace />;
    }
    
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Header onLogout={handleLogout} />
        <main className="content">
          <Routes>
            <Route 
              path="/login" 
              element={userRole ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/" 
              element={
                !userRole ? <Navigate to="/login" /> :
                userRole === 'admin' ? <AdminHome /> : <UserHome />
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
    </BrowserRouter>
  );
}

export default App;