import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from './Router';

const routeLabels: Record<string, string> = {
    '/': 'Dashboard',
    '/inventory': 'Inventory',
    '/products': 'Products',
    '/purchases': 'Purchases',
    '/sales': 'Sales'
};

export function Breadcrumbs() {
    const location = useLocation();

    // Don't show breadcrumbs for the home page
    if (location.pathname === '/') {
        return null;
    }

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Link
                to="/"
                className="flex items-center space-x-1 hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
            </Link>

            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
                {routeLabels[location.pathname] || 'Page'}
            </span>
        </nav>
    );
}