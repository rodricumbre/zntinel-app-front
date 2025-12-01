import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '@/components/layout/AppLayout';
import Login from '@/components/pages/Login';
import Dashboard from '@/components/pages/Dashboard';
import Clients from '@/components/pages/Clients';
import AccountUsage from '@/components/pages/AccountUsage';
import Members from '@/components/pages/Members';
import Metrics from '@/components/pages/Metrics';
import Logs from '@/components/pages/Logs';
import { useAuth } from '@/lib/auth';



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
