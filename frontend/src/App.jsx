import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layout & Pages
import Layout from './components/layout/Layout';
import Dashboard from './components/pages/Dashboard';
import Deals from './components/pages/Deals';
import Contacts from './components/pages/Contacts';
import Tasks from './components/pages/Task';
import Analytics from './components/pages/Analytics';
import Team from './components/pages/Team';
import Login from './components/pages/Login';

// Hooks
import { AuthProvider, useAuth } from "./hooks/useAuth";
// Create a client
const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Login route - accessible without authentication */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/deals" element={<Deals />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/analytics" element={<Analytics />} />
                    {/*<Route path="/team" element={<Team />} />*/}
                    
                    {/* Redirect any unknown routes to dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;