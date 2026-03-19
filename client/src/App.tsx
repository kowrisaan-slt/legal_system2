import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AddUser from './pages/AddUser';
import ModuleSelection from './pages/ModuleSelection';
import CaseDashboard from './pages/CaseDashboard';
import CreateCase from './pages/CreateCase';
import CaseDetail from './pages/CaseDetail';
import AgreementDashboard from './pages/AgreementDashboard';
import CreateAgreement from './pages/CreateAgreement';
import AgreementsList from './pages/AgreementsList';
import AgreementDetail from './pages/AgreementDetail';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/users" element={
        <ProtectedRoute>
          <AddUser />
        </ProtectedRoute>
      } />
      <Route path="/modules" element={
        <ProtectedRoute>
          <ModuleSelection />
        </ProtectedRoute>
      } />

      {/* Legal Case Management Routes */}
      <Route path="/cases" element={<ProtectedRoute><Layout module="cases" /></ProtectedRoute>}>
        <Route index element={<CaseDashboard />} />
        <Route path="new" element={<CreateCase />} />
        <Route path=":id" element={<CaseDetail />} />
      </Route>

      {/* Agreement Management Routes */}
      <Route path="/" element={<ProtectedRoute><Layout module="agreements" /></ProtectedRoute>}>
        <Route index element={<AgreementDashboard />} />
        <Route path="agreements" element={<AgreementsList />} />
        <Route path="agreements/:id" element={<AgreementDetail />} />
        <Route path="create" element={<CreateAgreement />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
