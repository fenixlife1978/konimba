import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/sidebar';
import { AppHeader } from '@/components/dashboard/header';
import { FirebaseClientProvider } from '@/firebase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Get sidebar state from cookie
  // const layout = cookies().get('react-resizable-panels:layout');
  // const defaultLayout = layout ? JSON.parse(layout.value) : undefined;

  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex h-screen flex-col">
          <AppHeader />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
