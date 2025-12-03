'use client';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Tag,
  CreditCard,
  LineChart,
  Settings,
  LogOut,
  ChevronsRight,
  ChevronsLeft
} from 'lucide-react';
import { KonimPayLogo } from '../icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const publisherNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { href: '/offers', icon: Tag, label: 'Ofertas' },
  { href: '/payments', icon: CreditCard, label: 'Pagos' },
];

const adminNavItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { href: '/admin/publishers', icon: Users, label: 'Editores' },
  { href: '/admin/offers', icon: Tag, label: 'Ofertas Globales' },
  { href: '/admin/payments', icon: CreditCard, label: 'Pagos Globales' },
  { href: '/admin/reports', icon: LineChart, label: 'Informes' },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const isAdmin = user?.email === 'faubriciosanchez1@gmail.com';
  const navItems = isAdmin ? adminNavItems : publisherNavItems;

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50 shadow-lg">
      <SidebarHeader>
        <div className="flex w-full items-center justify-between p-2">
            <div className="text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                <KonimPayLogo />
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground" onClick={toggleSidebar}>
                {state === 'expanded' ? <ChevronsLeft /> : <ChevronsRight />}
            </Button>
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                as="a"
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                  <item.icon />
                  <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Configuración">
              <Settings />
              <span>Configuración</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión">
                <LogOut />
                <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
