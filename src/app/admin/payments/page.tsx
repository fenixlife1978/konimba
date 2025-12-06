'use client';
import type { Payment, Publisher } from '@/lib/definitions';
import { PaymentClient } from './components/client';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ReportHeader } from '../reports/components/report-header';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Query all payments from the top-level 'payments' collection
  const paymentsRef = useMemoFirebase(() => firestore && user ? collection(firestore, 'payments') : null, [firestore, user]);
  const { data: payments, isLoading: paymentsLoading } = useCollection<Payment>(paymentsRef);
  
  const publishersRef = useMemoFirebase(() => firestore && user ? collection(firestore, 'publishers') : null, [firestore, user]);
  const { data: publishers, isLoading: publishersLoading } = useCollection<Publisher>(publishersRef);

  const enrichedPayments = useMemo(() => {
    if (!payments || !publishers) return [];
    return payments.map(payment => {
      const publisher = publishers.find(p => p.id === payment.publisherId);
      return {
        ...payment,
        publisherName: publisher?.name || payment.publisherName || 'Desconocido',
        publisherAvatarUrl: publisher?.avatarUrl || payment.publisherAvatarUrl || '',
      };
    });
  }, [payments, publishers]);

  const handleExport = async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    try {
        const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: null });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height],
            hotfixes: ['px_scaling']
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        const dateStr = format(new Date(), 'dd-MM-yyyy');
        pdf.save(`Reporte-Pagos-KonimPay-${dateStr}.pdf`);
    } catch (error) {
        console.error("Error exporting payments to PDF:", error);
        toast({
            variant: "destructive",
            title: "Error al Exportar",
            description: "No se pudo generar el archivo PDF."
        });
    } finally {
        setIsExporting(false);
    }
  };


  const isLoading = paymentsLoading || publishersLoading;

  if (isLoading) {
    return <div>Cargando pagos...</div>;
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Gestión de Pagos (Global)</h1>
       <div ref={printRef} className="bg-background p-4 rounded-lg">
        <ReportHeader />
        <PaymentClient 
            data={enrichedPayments || []} 
            onExport={handleExport} 
            isExporting={isExporting}
        />
       </div>
    </div>
  );
}
