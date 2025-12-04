// This is a new file
'use client';
import { SettingsForm } from './components/settings-form';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">
        Configuración de la Empresa
      </h1>
      <p className="text-muted-foreground mb-8">
        Gestiona la información principal de tu empresa que se mostrará en la aplicación.
      </p>
      <SettingsForm />
    </div>
  );
}
