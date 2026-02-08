import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Lazy load pages for better stability and error handling
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const VehiclesPage = React.lazy(() => import('./pages/VehiclesPage'));
const DiagnosisPage = React.lazy(() => import('./pages/DiagnosisPage'));
const CommonFaultsPage = React.lazy(() => import('./pages/CommonFaultsPage'));
const CommonFaultDetailsPage = React.lazy(() => import('./pages/CommonFaultDetailsPage'));
const SystemTestingPage = React.lazy(() => import('./pages/SystemTestingPage'));
const DiagnosisProceduresPage = React.lazy(() => import('./pages/DiagnosisProceduresPage'));
const WorkPackagePage = React.lazy(() => import('./pages/WorkPackagePage'));
const RepairExecutionPage = React.lazy(() => import('./pages/RepairExecutionPage'));
const RepairWorkPackagePage = React.lazy(() => import('./pages/RepairWorkPackagePage'));
const MaintenanceExecutionPage = React.lazy(() => import('./pages/MaintenanceExecutionPage'));
const MaintenanceWorkPackagePage = React.lazy(() => import('./pages/MaintenanceWorkPackagePage'));
const SelectEquipmentPage = React.lazy(() => import('./pages/SelectEquipmentPage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const AssistantPage = React.lazy(() => import('./pages/AssistantPage'));
const DiagnosticSimulatorPage = React.lazy(() => import('./pages/DiagnosticSimulatorPage'));
const OJTPage = React.lazy(() => import('./pages/OJTPage'));
const ManualsPage = React.lazy(() => import('./pages/ManualsPage'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'admin' && user.role !== 'supervisor') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const LoadingFallback = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060f', color: 'white' }}>
    <div className="spinner" />
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-wrapper" dir="rtl">
        <Toaster position="top-center" reverseOrder={false} />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/select-equipment" element={<ProtectedRoute><SelectEquipmentPage /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><AdminRoute><UsersPage /></AdminRoute></ProtectedRoute>} />
            <Route path="/diagnosis" element={<ProtectedRoute><DiagnosisPage /></ProtectedRoute>} />
            <Route path="/diagnosis/common" element={<ProtectedRoute><CommonFaultsPage /></ProtectedRoute>} />
            <Route path="/diagnosis/common/:id" element={<ProtectedRoute><CommonFaultDetailsPage /></ProtectedRoute>} />
            <Route path="/diagnosis/system" element={<ProtectedRoute><SystemTestingPage /></ProtectedRoute>} />
            <Route path="/diagnosis/system/:systemId" element={<ProtectedRoute><DiagnosisProceduresPage /></ProtectedRoute>} />
            <Route path="/diagnosis/work-package/:itemId" element={<ProtectedRoute><WorkPackagePage /></ProtectedRoute>} />
            <Route path="/repair" element={<ProtectedRoute><RepairExecutionPage /></ProtectedRoute>} />
            <Route path="/repair/work-package/:taskId" element={<ProtectedRoute><RepairWorkPackagePage /></ProtectedRoute>} />

            {/* Maintenance Execution Routes */}
            <Route path="/maintenance" element={<ProtectedRoute><MaintenanceExecutionPage /></ProtectedRoute>} />
            <Route path="/maintenance/work-package/:taskId" element={<ProtectedRoute><MaintenanceWorkPackagePage /></ProtectedRoute>} />

            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/simulator" element={<ProtectedRoute><DiagnosticSimulatorPage /></ProtectedRoute>} />
            <Route path="/ojt" element={<ProtectedRoute><OJTPage /></ProtectedRoute>} />
            <Route path="/manuals" element={<ProtectedRoute><ManualsPage /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
