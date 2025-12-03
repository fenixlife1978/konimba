import React from 'react';
import { KonimPayLogo } from '@/components/icons';
import { FirebaseClientProvider } from '@/firebase';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center text-primary">
            <KonimPayLogo className="h-auto w-40" />
          </div>
          {children}
        </div>
      </div>
    </FirebaseClientProvider>
  );
}
