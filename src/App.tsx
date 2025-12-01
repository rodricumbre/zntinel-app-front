import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuth } from "/src/lib/auth";

import AppLayout from "/src/components/layout/AppLayout";
import Login from "/src/components/pages/Login";
import Dashboard from "/src/components/pages/Dashboard";
import Clients from "/src/components/pages/Clients";
import AccountUsage from "/src/components/pages/AccountUsage";
import Members from "/src/components/pages/Members";
import Metrics from "/src/components/pages/Metrics";
import Logs from "/src/components/pages/Logs";


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
