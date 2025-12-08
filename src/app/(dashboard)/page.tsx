'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// This page only exists to satisfy the Next.js router.
// The redirection logic is handled by the useEffect hook below,
// which will send the user to the correct dashboard page.
export default function DashboardRootRedirect() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // Redirect to the publisher dashboard page.
        redirect('/dashboard/dashboard');
      } else {
        // If for some reason the user is not authenticated, send them to login.
        redirect('/login');
      }
    }
  }, [user, isUserLoading]);

  // Display a loading message while the redirect is being prepared.
  return <div>Cargando...</div>;
}
