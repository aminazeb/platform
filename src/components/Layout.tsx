"use client";

import { useAuth } from './AuthContext';
import { Breadcrumbs } from './Breadcrumbs';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    BarChart3,
    Package,
    ShoppingCart,
    ShoppingBag,
    User,
    LogOut,
    Settings,
    Package2
} from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: BarChart3,
            current: pathname === '/dashboard'
        },
        {
            name: 'Inventory',
            href: '/inventory',
            icon: Package,
            current: pathname === '/inventory'
        },
        {
            name: 'Products',
            href: '/products',
            icon: Package2,
            current: pathname === '/products'
        },
        {
            name: 'Purchases',
            href: '/purchases',
            icon: ShoppingCart,
            current: pathname === '/purchases'
        },
        {
            name: 'Sales',
            href: '/sales',
            icon: ShoppingBag,
            current: pathname === '/sales'
        }
    ];

    const activeTab = navigationItems.find(item => item.current)?.href || '/dashboard';

    const handleTabChange = (value: string) => {
        router.push(value);
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-80 bg-card border-r border-border flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-border">
                    <Link href="/" className="flex items-center space-x-3">
                        <Package className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold">Inventory Pro</h1>
                            <p className="text-sm text-muted-foreground">Management System</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation Tabs */}
                <div className="p-4 border-b border-border">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-1 h-auto bg-muted/50">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <TabsTrigger
                                        key={item.name}
                                        value={item.href}
                                        className="w-full justify-start space-x-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{item.name}</span>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>
                </div>

                {/* User Info */}
                <div className="mt-auto p-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="text-sm">
                                    {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                    <User className="h-4 w-4 mr-2" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="h-4 w-4 mr-2" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Breadcrumbs />
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>Welcome back, {user?.name || user?.email}</span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}