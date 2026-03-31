'use client';

import { useState, useSyncExternalStore } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

const emptySubscribe = () => () => {};

export function Layout({ children, hideSidebar = false }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sidebarCollapsed } = useAppStore();
  
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Sidebar */}
      {!hideSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          !hideSidebar && (sidebarCollapsed ? "mr-[72px]" : "mr-[260px]")
        )}
      >
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="h-[calc(100vh-4rem)] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
