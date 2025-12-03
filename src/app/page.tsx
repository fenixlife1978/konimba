import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KonimPayLogo } from '@/components/icons';

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
      <div className="mb-12">
        <KonimPayLogo className="h-auto w-48 text-primary" />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4 font-headline">
        BIENVENID@ A KONIMBA
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
