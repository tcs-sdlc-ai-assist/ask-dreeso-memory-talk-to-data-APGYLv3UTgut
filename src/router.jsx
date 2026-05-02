/**
 * Application route definitions for Ask Dreeso Memory.
 * Defines all application routes with layout wrappers and
 * protected route guards for authenticated screens.
 *
 * @module router
 * @see SCRUM-7894
 */

import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

import AuthLayout from './components/layout/AuthLayout';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import QueryPage from './pages/QueryPage';
import LukasFlowPage from './pages/personas/LukasFlowPage';
import ElenaFlowPage from './pages/personas/ElenaFlowPage';
import SophieFlowPage from './pages/personas/SophieFlowPage';
import JamesFlowPage from './pages/personas/JamesFlowPage';
import FinalSummaryPage from './pages/FinalSummaryPage';
import NotFoundPage from './pages/NotFoundPage';

/**
 * Application router configuration.
 * Defines all routes with their respective layouts and guards.
 *
 * Public routes (AuthLayout):
 * - / (login)
 * - /signup
 *
 * Protected routes (MainLayout + ProtectedRoute):
 * - /persona-select (onboarding)
 * - /dashboard (home)
 * - /query
 * - /cluster/project (Lukas)
 * - /cluster/workforce (Lukas)
 * - /system/procore (Lukas)
 * - /system/primavera (Lukas)
 * - /cluster/commercial (Elena)
 * - /cluster/finance (Sophie)
 * - /system/sap (Sophie)
 * - /cluster/sales (James)
 * - /system/salesforce (James)
 * - /cluster/knowledge
 * - /audit-log (summary)
 * - /settings
 *
 * Catch-all:
 * - * (404)
 *
 * @type {import('react-router-dom').Router}
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: 'dashboard',
            element: <HomePage />,
          },
          {
            path: 'query',
            element: <QueryPage />,
          },
          {
            path: 'query/loading',
            element: <QueryPage />,
          },
          {
            path: 'query/result',
            element: <QueryPage />,
          },
          {
            path: 'cta',
            element: <QueryPage />,
          },
          {
            path: 'action',
            element: <QueryPage />,
          },
          {
            path: 'confirmation',
            element: <QueryPage />,
          },
          {
            path: 'cluster/project',
            element: <LukasFlowPage />,
          },
          {
            path: 'cluster/workforce',
            element: <LukasFlowPage />,
          },
          {
            path: 'system/procore',
            element: <LukasFlowPage />,
          },
          {
            path: 'system/primavera',
            element: <LukasFlowPage />,
          },
          {
            path: 'cluster/commercial',
            element: <ElenaFlowPage />,
          },
          {
            path: 'cluster/finance',
            element: <SophieFlowPage />,
          },
          {
            path: 'system/sap',
            element: <SophieFlowPage />,
          },
          {
            path: 'cluster/sales',
            element: <JamesFlowPage />,
          },
          {
            path: 'system/salesforce',
            element: <JamesFlowPage />,
          },
          {
            path: 'cluster/knowledge',
            element: <QueryPage />,
          },
          {
            path: 'audit-log',
            element: <FinalSummaryPage />,
          },
          {
            path: 'settings',
            element: <FinalSummaryPage />,
          },
        ],
      },
      {
        path: 'persona-select',
        element: <OnboardingPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;