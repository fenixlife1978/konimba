'use client';
import { SettingsForm } from './components/settings-form';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">
            Configuración General
        </h1>
        <p className="text-muted-foreground">
            Gestiona la información principal y las tasas de cambio de tu empresa.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
