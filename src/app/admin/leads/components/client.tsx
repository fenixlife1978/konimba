'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lead, Publisher, GlobalOffer } from '@/lib/definitions';
import { DataTable } from './data-table';
import { columns } from './columns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LeadForm } from './lead-form';
import { useState } from 'react';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LeadClientProps {
  data: Lead[];
  publishers: Publisher[];
  offers: GlobalOffer[];
}

export const LeadClient: React.FC<LeadClientProps> = ({ data, publishers, offers }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <DateRangePicker />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline">Cerrar Periodo</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar Cierre de Periodo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción calculará los pagos para todos los publishers basados en los leads del periodo seleccionado. ¿Estás seguro de que quieres continuar?
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => alert('¡Periodo cerrado y pagos calculados! (Funcionalidad en desarrollo)')}
                        >
                            Confirmar Cierre
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <DialogTrigger asChild>
                <Button>
                <Plus className="mr-2 h-4 w-4" /> Cargar Leads
                </Button>
            </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Cargar Nuevos Leads</DialogTitle>
          </DialogHeader>
          <LeadForm
            publishers={publishers}
            offers={offers}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <DataTable 
        searchKey="publisherName" 
        columns={columns({ publishers, offers })} 
        data={data} 
      />
    </>
  );
};
