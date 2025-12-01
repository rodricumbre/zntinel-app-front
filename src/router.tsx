import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '/src/components/layout/AppLayout';
import Login from '/src/components/pages/Login';
import Dashboard from '/src/components/pages/Dashboard';
import Clients from '/src/components/pages/Clients';
import AccountUsage from '/src/components/pages/AccountUsage';
import Members from '/src/components/pages/Members';
import Metrics from '/src/components/pages/Metrics';
import Logs from '/src/components/pages/Logs';
import { useAuth } from '/src/lib/auth';



const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/clients',
    element: (
      <PrivateRoute>
        <AppLayout>
          <Clients />
        </AppLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/account-usage',
    element: (
      <PrivateRoute>
        <AppLayout>
          <AccountUsage />
        </AppLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/members',
    element: (
      <PrivateRoute>
        <AppLayout>
          <Members />
        </AppLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/metrics',
    element: (
      <PrivateRoute>
        <AppLayout>
          <Metrics />
        </AppLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/logs',
    element: (
      <PrivateRoute>
        <AppLayout>
          <Logs />
        </AppLayout>
      </PrivateRoute>
    ),
  },
]);
