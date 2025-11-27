import React, { useState } from 'react';
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
        className={`flex-1 overflow-y-auto transition-all duration-300 pt-14 md:pt-0 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}

