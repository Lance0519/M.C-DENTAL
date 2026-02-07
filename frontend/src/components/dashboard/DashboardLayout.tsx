import React, { useState, useEffect, useRef } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import type { StaffProfile } from '@/types/user';

interface DashboardLayoutProps {
  role: 'admin' | 'staff' | 'patient';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  user?: StaffProfile | null;
  children: React.ReactNode;
}

export function DashboardLayout({
  role,
  activeTab,
  onTabChange,
  user,
  children,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      setShowScrollTop(mainElement.scrollTop > 300);
    };

    mainElement.addEventListener('scroll', handleScroll);
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black-950 overflow-hidden">
      <DashboardSidebar
        role={role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        user={user}
        onCollapseChange={setIsSidebarCollapsed}
      />
      <main 
        ref={mainRef}
        className={`flex-1 overflow-y-auto transition-all duration-300 pt-14 md:pt-0 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-7xl">
          {children}
        </div>
      </main>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-gold-500 to-gold-400 text-black shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}

