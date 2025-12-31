import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import RegisterClient from './pages/RegisterClient';
import RegisterProvider from './pages/RegisterProvider';
import ClientHome from './pages/ClientHome';
import CreateRequest from './pages/CreateRequest';
import ProviderDashboard from './pages/ProviderDashboard';
import RequestDetails from './pages/RequestDetails';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register-client" element={<RegisterClient />} />
          <Route path="/register-provider" element={<RegisterProvider />} />

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
            path="/client/request/:id"
            element={
              <PrivateRoute role="client">
                <RequestDetails />
              </PrivateRoute>
            }
          />

          <Route
            path="/provider/dashboard"
            element={
              <PrivateRoute role="provider">
                <ProviderDashboard />
              </PrivateRoute>
            }
          />

          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
