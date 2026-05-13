import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import AuthPage from "./pages/AuthPage";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Garage from "./pages/Garage";
import VehicleDetail from "./pages/VehicleDetail";
import MaintenancePage from "./pages/Maintenance";
import FuelPage from "./pages/Fuel";
import ExpensesPage from "./pages/Expenses";
import Profile from "./pages/Profile";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === null) {
    return (
      <div className="av-bg min-h-screen flex items-center justify-center text-eggshell/60">
        <div className="av-glass px-8 py-6 animate-pulse">Loading AutoVault…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<Protected><AppLayout /></Protected>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/garage" element={<Garage />} />
            <Route path="/garage/:id" element={<VehicleDetail />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/fuel" element={<FuelPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
