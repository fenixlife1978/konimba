'use client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';

export default function DashboardRootPage() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) {
      // Wait until user status is resolved
      return;
    }

    if (user) {
      if (user.email === 'faubriciosanchez1@gmail.com') {
        redirect('/admin/dashboard');
      } else {
        redirect('/dashboard');
      }
    } else {
      // If no user, redirect to login
      redirect('/login');
    }
  }, [user, isUserLoading]);

  // Render a loading state while checking auth
  return <div>Cargando...</div>;
}
