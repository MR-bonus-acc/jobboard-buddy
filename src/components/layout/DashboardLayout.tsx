import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { 
  Briefcase, 
  Users, 
  LayoutDashboard, 
  LogOut,
  UserPlus
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const customerItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Jobs', url: '/dashboard/jobs', icon: Briefcase },
    { title: 'Candidates', url: '/dashboard/candidates', icon: Users },
  ];

  const adminItems = [
    { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    { title: 'Manage Users', url: '/admin/users', icon: Users },
    { title: 'Create Customer', url: '/admin/create-customer', icon: UserPlus },
  ];

  const items = role === 'admin' ? adminItems : customerItems;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r border-sidebar-border">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-sidebar-foreground">TalentFlow</h2>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{role} Portal</p>
              </div>
            </div>
          </div>

          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sidebar-foreground/60">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          end={item.url === '/dashboard' || item.url === '/admin'}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                          activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{role}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-foreground">
              {items.find(i => location.pathname === i.url)?.title || 'Dashboard'}
            </h1>
          </header>
          <div className="flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
