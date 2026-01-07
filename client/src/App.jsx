import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import RegisterClient from './pages/RegisterClient';
import RegisterProvider from './pages/RegisterProvider';
import ClientHome from './pages/ClientHome';
import CreateRequest from './pages/CreateRequest';
import ProviderDashboard from './pages/ProviderDashboard';
import RequestDetails from './pages/RequestDetails';
import ClientProfile from './pages/ClientProfile';
import AdminDashboard from './pages/AdminDashboard';
import Transactions from './pages/Transactions';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/layouts/AdminLayout';

import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public User/Provider Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register-client" element={<RegisterClient />} />
          <Route path="/register-provider" element={<RegisterProvider />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <PrivateRoute role="admin">
              <AdminLayout />
            </PrivateRoute>
          }>
            <Route index element={<AdminDashboard />} />
            {/* Future Admin Routes can be nested here */}
          </Route>

          {/* Protected Client Routes */}
          <Route
            path="/client/home"
            element={
              <PrivateRoute role="client">
                <ClientHome />
              </PrivateRoute>
            }
          />
          <Route
            path="/client/create-request"
            element={
              <PrivateRoute role="client">
                <CreateRequest />
              </PrivateRoute>
            }
          />
          <Route
            path="/client/requests/:id"
            element={
              <PrivateRoute role="client">
                <RequestDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/client/transactions"
            element={
              <PrivateRoute role="client">
                <Transactions />
              </PrivateRoute>
            }
          />
          <Route
            path="/client/profile"
            element={
              <PrivateRoute role="client">
                <ClientProfile />
              </PrivateRoute>
            }
          />

          {/* Protected Provider Routes */}
          <Route
            path="/provider/dashboard"
            element={
              <PrivateRoute role="provider">
                <ProviderDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/provider/transactions"
            element={
              <PrivateRoute role="provider">
                <Transactions />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
