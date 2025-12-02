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

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/publishers', icon: Users, label: 'Publishers' },
  { href: '/offers', icon: Tag, label: 'Offers' },
  { href: '/payments', icon: CreditCard, label: 'Payments' },
  { href: '/reports', icon: LineChart, label: 'Reports' },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const pathname = usePathname();

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
            <Link href={item.href} passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <a>
                  <item.icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/login" passHref>
                <SidebarMenuButton tooltip="Logout">
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
