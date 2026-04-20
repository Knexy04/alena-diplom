import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ManagerRoutes from './ManagerRoutes';
import ParentRoutes from './ParentRoutes';
import ManagerLayout from '../layouts/ManagerLayout';
import ParentLayout from '../layouts/ParentLayout';

import LoginPage from '../pages/auth/LoginPage';
import ManagerDashboard from '../pages/manager/DashboardPage';
import ApplicationsPage from '../pages/manager/ApplicationsPage';
import ApplicationDetailPage from '../pages/manager/ApplicationDetailPage';
import ClientsPage from '../pages/manager/ClientsPage';
import ClientDetailPage from '../pages/manager/ClientDetailPage';
import ManagerChatPage from '../pages/manager/ChatPage';
import BroadcastPage from '../pages/manager/BroadcastPage';

import ParentDashboard from '../pages/parent/DashboardPage';
import ApplicationStatusPage from '../pages/parent/ApplicationStatusPage';
import DocumentsPage from '../pages/parent/DocumentsPage';
import ParentChatPage from '../pages/parent/ChatPage';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ManagerRoutes />}>
          <Route element={<ManagerLayout />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/applications" element={<ApplicationsPage />} />
            <Route path="/manager/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/manager/clients" element={<ClientsPage />} />
            <Route path="/manager/clients/:id" element={<ClientDetailPage />} />
            <Route path="/manager/chat" element={<ManagerChatPage />} />
            <Route path="/manager/broadcast" element={<BroadcastPage />} />
          </Route>
        </Route>

        <Route element={<ParentRoutes />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/applications/:id" element={<ApplicationStatusPage />} />
            <Route path="/parent/documents" element={<DocumentsPage />} />
            <Route path="/parent/chat" element={<ParentChatPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
