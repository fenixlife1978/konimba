'use client';
import { SVGProps } from "react";
import Image from "next/image";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import type { CompanyProfile } from "@/lib/definitions";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export function KonimPayLogo(props: SVGProps<SVGSVGElement> & { className?: string }) {
  const { className, ...rest } = props;
  const firestore = useFirestore();
  const { isUserLoading } = useUser();
  
  const settingsRef = useMemoFirebase(() => {
    if (firestore) {
      return doc(firestore, 'company_profile', 'settings');
    }
    return null;
  }, [firestore]);

  const { data: companyProfile, isLoading: isProfileLoading } = useDoc<CompanyProfile>(settingsRef);
  
  const logoUrl = !isUserLoading && !isProfileLoading ? companyProfile?.logoUrl : null;

  if (logoUrl) {
    return (
      <div className={cn("relative rounded-full overflow-hidden", className)}>
         <Image
          src={logoUrl}
          alt={companyProfile?.name || "Company Logo"}
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
    );
  }

  // Fallback to the default SVG logo
  return (
    <div className={cn("relative rounded-full overflow-hidden flex items-center justify-center bg-background", className)}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 160 30"
            width="80%"
            height="80%"
            {...rest}
            >
            <g fill="currentColor">
                <path d="M14.3,16.5c-2.3,2.2-5.3,3.4-8.7,3.4C2.5,19.9,0,17.4,0,14.3v-0.1c0-3,2.4-5.5,5.5-5.6c3.4,0,6.4,1.3,8.7,3.4l-2,2.1 c-1.6-1.5-3.6-2.3-5.8-2.3c-1.8,0-3.3,0.7-4.5,1.9C1,15,1,16.8,2,18c1.1,1.1,2.7,1.8,4.5,1.8c2.2,0,4.2-0.8,5.8-2.3L14.3,16.5z" />
                <path d="M32.8,19.7V9h-3.4v10.7H32.8z" />
                <path d="M43,19.7l-7.3-10.7h3.7l5.4,7.9l5.4-7.9h3.7L46.6,19.7H43z" />
                <path d="M72.1,19.7V9h-3.4v10.7H72.1z" />
                <path d="M84.1,19.7l-5.3-7.2v7.2h-3.4V9h3.4l5.3,7.2V9h3.4v10.7H84.1z" />
                <path d="M103.1,19.9c-2.2,0-4-0.8-5.3-2.1l2.2-2.3c0.8,0.7,1.6,1.1,2.9,1.1c1.4,0,2.3-0.5,2.3-1.4c0-0.8-0.7-1.2-2.5-1.7 c-2.4-0.7-4-1.6-4-4.2c0-2.3,1.9-4,4.7-4c1.9,0,3.3,0.6,4.4,1.6L105.7,9C105,8.3,104,7.9,103,7.9c-1.2,0-1.9,0.5-1.9,1.2 c0,0.8,0.7,1.1,2.6,1.7c2.5,0.7,3.9,1.8,3.9,4.3C107.6,18.1,105.7,19.9,103.1,19.9z" />
                <path d="M118.8,14.6c0,3,2.4,5.4,5.4,5.4c3,0,5.4-2.4,5.4-5.4s-2.4-5.4-5.4-5.4C121.2,9.2,118.8,11.6,118.8,14.6z M126.1,14.6 c0,1.5-1.2,2.8-2.8,2.8c-1.5,0-2.8-1.2-2.8-2.8s1.2-2.8,2.8-2.8C124.9,11.8,126.1,13.1,126.1,14.6z" />
                <path d="M137.9,19.3v-6.9l-3.5,6.9h-1.6l-3.5-6.9v6.9h-3.1V9h4.3l3.9,7.6l3.9-7.6h4.3v10.3H137.9z" />
            </g>
        </svg>
    </div>
  );
}
