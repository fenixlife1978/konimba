'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KonimPayLogo } from '@/components/icons';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';

function WelcomeContent() {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email === 'faubriciosanchez1@gmail.com') {
        redirect('/admin/dashboard');
      } else {
        redirect('/dashboard');
      }
    }
  }, [user, isUserLoading]);


  if (isUserLoading) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <h1 className="text-xl font-semibold">Cargando...</h1>
        </div>
    );
  }

  if (user) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
        <div className="mb-12 h-24 w-24 text-primary">
          <KonimPayLogo className="h-full w-full" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 font-headline">
            BIENVENID@ A KONIMPAY
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground mb-12">
            Ya has iniciado sesión. Serás redirigido en un momento.
        </p>
         <Button asChild size="lg" className="font-bold text-base">
            <Link href={user.email === 'faubriciosanchez1@gmail.com' ? '/admin/dashboard' : '/dashboard'}>Ir al Panel</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
      <div className="mb-12 h-24 w-24 text-primary">
        <KonimPayLogo className="h-full w-full" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 font-headline">
        BIENVENID@ A KONIMPAY
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground mb-12">
        INGRESA Y GESTIONA TUS GANANCIAS DESDE TU CUENTA
      </p>
      <Button asChild size="lg" className="font-bold text-base">
        <Link href="/login">Ingresar</Link>
      </Button>
    </div>
  );
}


export default function WelcomePage() {
  return (
    <FirebaseClientProvider>
      <WelcomeContent />
    </FirebaseClientProvider>
  );
}
