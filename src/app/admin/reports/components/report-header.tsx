'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { CompanyProfile } from '@/lib/definitions';
import { doc } from 'firebase/firestore';
import { KonimPayLogo } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

export const ReportHeader = () => {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'company_profile', 'settings') : null, [firestore]);
    const { data: companyProfile } = useDoc<CompanyProfile>(settingsRef);
    
    return (
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-t-lg">
                <div className="h-16 w-16 relative text-primary">
                    <KonimPayLogo className="w-full h-full" />
                </div>
                {companyProfile && (
                    <div className="text-right text-sm text-muted-foreground">
                        <p className="font-bold text-lg text-foreground">{companyProfile.name}</p>
                        <p>{companyProfile.address}</p>
                        <p>Tel: {companyProfile.phone} - {companyProfile.country}</p>
                    </div>
                )}
            </div>
            <Separator />
        </div>
    )
}
