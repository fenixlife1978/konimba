'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardRoot() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        redirect('/login');
      } else if (user?.email === 'faubriciosanchez1@gmail.com') {
        redirect('/admin/dashboard');
      } else {
        redirect('/dashboard');
      }
    }
  }, [user, isUserLoading]);

  // You can show a loading spinner here while checking the user role
  return <div>Cargando...</div>;
}
