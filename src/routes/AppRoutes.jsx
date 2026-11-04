import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Home from "../pages/home/Home";
import Dashboard from "../pages/dashboard/Dashboard";
import Cooperatives from "../pages/cooperatives/Cooperatives";
import CooperativeForm from "../pages/cooperatives/CooperativeForm";
import CooperativeDetails from "../pages/cooperatives/CooperativeDetails";
import Farmers from "../pages/farmers/Farmers";
import FarmerForm from "../pages/farmers/FarmerForm";
import FarmerDetails from "../pages/farmers/FarmerDetails";
import Parcels from "../pages/parcels/Parcels";
import ParcelForm from "../pages/parcels/ParcelForm";
import ParcelDetails from "../pages/parcels/ParcelDetails";
import FireTest from "../pages/fire/FireTest";
import FireMonitoring from "../pages/fire/FireMonitoring";
import FireAlerts from "../pages/fire/FireAlerts";
import Audits from "../pages/audits/Audits";
import AuditForm from "../pages/audits/AuditForm";
import AuditDetails from "../pages/audits/AuditDetails";
import AuditEdit from "../pages/audits/AuditEdit";
import AuditReport from "../pages/audits/AuditReport";
import Surveys from "../pages/surveys/Surveys";
import SurveyFormBuilder from "../pages/surveys/SurveyFormBuilder";
import SurveyFill from "../pages/surveys/SurveyFill";
import SurveyResponses from "../pages/surveys/SurveyResponses";
import Profile from "../pages/profile/Profile";
import UsersManagement from "../pages/admin/UsersManagement";
import AdminSettings from "../pages/admin/AdminSettings";

import DashboardLayout from "../layouts/DashboardLayout";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-green-700 dark:border-t-emerald-500" />
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-purple-700 dark:border-t-purple-500" />
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Vérification des droits d'accès...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const NonAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-green-700 dark:border-t-emerald-500" />
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ManagerOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-green-700 dark:border-t-emerald-500" />
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // L'auditeur bio a un accès en lecture seule, pas de formulaires de création/édition
  if (user.role === "bio_auditor") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const OperationalNonAuditorRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-green-700 dark:border-t-emerald-500" />
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Ni admin ni auditeur bio n'ont accès aux alertes feux opérationnelles
  if (user.role === "admin" || user.role === "bio_auditor") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>

      {/* ========================= */}
      {/* Routes publiques */}
      {/* ========================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />


      {/* ========================= */}
      {/* Routes protégées */}
      {/* ========================= */}

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/cooperatives"
          element={<Cooperatives />}
        />
        <Route
          path="/cooperatives/new"
          element={
            <ManagerOnlyRoute>
              <CooperativeForm />
            </ManagerOnlyRoute>
          }
        />
        <Route
          path="/cooperatives/:uuid/edit"
          element={
            <ManagerOnlyRoute>
              <CooperativeForm />
            </ManagerOnlyRoute>
          }
        />
        <Route
          path="/cooperatives/:uuid"
          element={<CooperativeDetails />}
        />

        <Route
          path="/farmers"
          element={<Farmers />}
        />
        <Route
          path="/farmers/new"
          element={
            <ManagerOnlyRoute>
              <FarmerForm />
            </ManagerOnlyRoute>
          }
        />
        <Route
          path="/farmers/:uuid/edit"
          element={
            <ManagerOnlyRoute>
              <FarmerForm />
            </ManagerOnlyRoute>
          }
        />
        <Route
          path="/farmers/:uuid"
          element={<FarmerDetails />}
        />

        <Route
          path="/parcels"
          element={<Parcels />}
        />
        <Route
          path="/parcels/new"
          element={
            <ManagerOnlyRoute>
              <ParcelForm />
            </ManagerOnlyRoute>
          }
        />
        <Route
          path="/parcels/:uuid/edit"
          element={
            <ManagerOnlyRoute>
              <ParcelForm />
            </ManagerOnlyRoute>
          }
        />
        <Route
          path="/parcels/:uuid"
          element={<ParcelDetails />}
        />

        <Route
          path="/fire-test"
          element={
            <OperationalNonAuditorRoute>
              <FireTest />
            </OperationalNonAuditorRoute>
          }
        />
        <Route
          path="/fire-alerts"
          element={
            <OperationalNonAuditorRoute>
              <FireAlerts />
            </OperationalNonAuditorRoute>
          }
        />
        <Route
          path="/fires"
          element={
            <OperationalNonAuditorRoute>
              <FireMonitoring />
            </OperationalNonAuditorRoute>
          }
        />

        <Route
          path="/audits"
          element={
            <NonAdminRoute>
              <Audits />
            </NonAdminRoute>
          }
        />
        <Route
          path="/audits/new"
          element={
            <NonAdminRoute>
              <AuditForm />
            </NonAdminRoute>
          }
        />
        <Route
          path="/audits/:auditId"
          element={
            <NonAdminRoute>
              <AuditDetails />
            </NonAdminRoute>
          }
        />
        <Route
          path="/audits/:auditId/edit"
          element={
            <NonAdminRoute>
              <AuditEdit />
            </NonAdminRoute>
          }
        />
        <Route
          path="/audits/report"
          element={
            <NonAdminRoute>
              <AuditReport />
            </NonAdminRoute>
          }
        />

        {/* ========================= */}
        {/* Formulaires d'enquêtes */}
        {/* ========================= */}
        <Route
          path="/surveys"
          element={<Surveys />}
        />
        <Route
          path="/surveys/new"
          element={<SurveyFormBuilder />}
        />
        <Route
          path="/surveys/:id/edit"
          element={<SurveyFormBuilder />}
        />
        <Route
          path="/surveys/:id/fill"
          element={<SurveyFill />}
        />
        <Route
          path="/surveys/:id/responses"
          element={<SurveyResponses />}
        />

        {/* ========================= */}
        {/* Profil utilisateur */}
        {/* ========================= */}
        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* ========================= */}
        {/* Administration Système    */}
        {/* ========================= */}
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UsersManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />

      </Route>


      {/* ========================= */}
      {/* Route Accueil / Vitrine   */}
      {/* ========================= */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
};

export default AppRoutes;