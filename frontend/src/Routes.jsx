import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import NotFound from "pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ComplianceReports from './pages/compliance-reports';
import ComplianceResultsViolations from './pages/compliance-results-violations';
import RegulatoryGuidelinesDatabase from './pages/regulatory-guidelines-database';
import RegulatoryUpdatesNotifications from './pages/regulatory-updates-notifications';
import Dashboard from './pages/dashboard';
import ContentUploadScanning from './pages/content-upload-scanning';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes - redirect to login if not authenticated */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/compliance-reports" 
          element={
            <ProtectedRoute>
              <ComplianceReports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/compliance-results-violations" 
          element={
            <ProtectedRoute>
              <ComplianceResultsViolations />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/regulatory-guidelines-database" 
          element={
            <ProtectedRoute>
              <RegulatoryGuidelinesDatabase />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/regulatory-updates-notifications" 
          element={
            <ProtectedRoute>
              <RegulatoryUpdatesNotifications />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/content-upload-scanning" 
          element={
            <ProtectedRoute>
              <ContentUploadScanning />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
