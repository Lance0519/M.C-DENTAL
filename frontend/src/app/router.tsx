import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

// Lazy load pages for code splitting
const AuthPage = lazy(() => import('@/features/auth/pages/AuthPage').then(module => ({ default: module.AuthPage })));
const HomePage = lazy(() => import('@/features/home/pages/HomePage').then(module => ({ default: module.HomePage })));
const ServicesPage = lazy(() => import('@/features/services/pages/ServicesPage').then(module => ({ default: module.ServicesPage })));
const AboutPage = lazy(() => import('@/features/about/pages/AboutPage').then(module => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import('@/features/contact/pages/ContactPage').then(module => ({ default: module.ContactPage })));
const BookPage = lazy(() => import('@/features/booking/pages/BookPage').then(module => ({ default: module.BookPage })));
const AdminDashboard = lazy(() => import('@/features/dashboard/pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const StaffDashboard = lazy(() => import('@/features/dashboard/pages/StaffDashboard').then(module => ({ default: module.StaffDashboard })));
const PatientDashboard = lazy(() => import('@/features/dashboard/pages/PatientDashboard').then(module => ({ default: module.PatientDashboard })));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Wrapper component for Suspense
const LazyPage = ({ Component }: { Component: React.LazyExoticComponent<React.ComponentType<any>> }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LazyPage Component={HomePage} /> },
      { path: 'about', element: <LazyPage Component={AboutPage} /> },
      { path: 'services', element: <LazyPage Component={ServicesPage} /> },
      { path: 'contact', element: <LazyPage Component={ContactPage} /> },
      { path: 'book', element: <LazyPage Component={BookPage} /> },
      { path: 'login', element: <LazyPage Component={AuthPage} /> },
      { path: 'login/login.html', element: <LazyPage Component={AuthPage} /> },
      { path: 'login.html', element: <LazyPage Component={AuthPage} /> },
      { path: 'dashboard/admin', element: <LazyPage Component={AdminDashboard} /> },
      { path: 'dashboard/admin.html', element: <LazyPage Component={AdminDashboard} /> },
      { path: 'dashboard/staff', element: <LazyPage Component={StaffDashboard} /> },
      { path: 'dashboard/staff.html', element: <LazyPage Component={StaffDashboard} /> },
      { path: 'dashboard/patient', element: <LazyPage Component={PatientDashboard} /> },
      { path: 'dashboard/patient.html', element: <LazyPage Component={PatientDashboard} /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
]);

