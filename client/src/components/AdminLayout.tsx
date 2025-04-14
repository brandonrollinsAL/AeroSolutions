import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  Flag, 
  LogOut, 
  Menu, 
  X, 
  Home,
  CreditCard
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAdmin();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home, current: location === '/admin' },
    { name: 'Users', href: '/admin/users', icon: Users, current: location === '/admin/users' },
    { name: 'Content Moderation', href: '/admin/content', icon: Flag, current: location === '/admin/content' },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, current: location === '/admin/subscriptions' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, current: location === '/admin/analytics' },
    { name: 'Settings', href: '/admin/settings', icon: Settings, current: location === '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-primary text-primary-foreground flex items-center">
              <Shield className="h-6 w-6 mr-2" />
              <span className="font-semibold">Elevion Admin</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={item.current ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-full flex-col border-r bg-white dark:bg-gray-800">
          <div className="h-16 flex items-center border-b px-6">
            <Shield className="h-6 w-6 text-primary mr-2" />
            <span className="text-xl font-semibold">Elevion Admin</span>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-4 py-4">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={item.current ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start mb-1"
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full justify-start" 
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 hidden lg:block">
              {title}
            </h1>
            <div className="ml-auto flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <span>{user?.firstName || user?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 py-6 px-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;