import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesEntry from './pages/SalesEntry';
import AdminUsers from './pages/AdminUsers';
import Layout from './components/Layout';
import './App.css';

const Private = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Private><Layout /></Private>}>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<SalesEntry />} />
            <Route path="users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
