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
      <Routes>
        {/* pública */}
        <Route path="/login" element={<Login />} />

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

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
