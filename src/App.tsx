import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "@/lib/auth";

import AppLayout from "@/components/layout/AppLayout";
import Login from "@/components/pages/Login";
import Dashboard from "@/components/pages/Dashboard";
import Clients from "@/components/pages/Clients";
import AccountUsage from "@/components/pages/AccountUsage";
import Members from "@/components/pages/Members";
import Metrics from "@/components/pages/Metrics";
import Logs from "@/components/pages/Logs";
import SettingsPage from "@/components/pages/SettingsPage";
import LogoutOverlay from "@/components/layout/LogoutOverlay";

// NUEVOS
import Register from "@/components/pages/Register";
import AcceptInvite from "@/components/pages/AcceptInvite";

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* overlay global: siempre montado, escucha isLoggingOut del contexto */}
      <LogoutOverlay />

      <Routes>
        {/* públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* privadas */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <PrivateRoute>
              <AppLayout>
                <Clients />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/account-usage"
          element={
            <PrivateRoute>
              <AppLayout>
                <AccountUsage />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/members"
          element={
            <PrivateRoute>
              <AppLayout>
                <Members />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/metrics"
          element={
            <PrivateRoute>
              <AppLayout>
                <Metrics />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <PrivateRoute>
              <AppLayout>
                <Logs />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* redirecciones */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
