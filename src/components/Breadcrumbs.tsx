import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthContext';

const routeLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/inventory': 'Inventory',
    '/dashboard/products': 'Products',
    '/dashboard/purchases': 'Purchases',
    '/dashboard/sales': 'Sales',
    '/products': 'Products',
    '/purchases': 'Purchase Management',
    '/sales': 'Sales'
};

const modalLabels: Record<string, string> = {
    'add-product': 'Add Product',
    'edit-product': 'Edit Product',
    'add-purchase': 'Add Purchase',
    'upload-receipt': 'Upload Receipt',
    'add-to-cart': 'Add to Cart',
    'sales-receipt': 'Sales Receipt',
    'barcode-scanner': 'Barcode Scanner'
};

export function Breadcrumbs() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    // Don't show breadcrumbs on login page or root redirector
    if (pathname === '/login' || pathname === '/') {
        return null;
    }

    // Get the current page label
    const currentPage = routeLabels[pathname ?? '/'] || 'Page';

    // Get modal label if present
    const modal = searchParams?.get('modal');
    const modalLabel = modal ? modalLabels[modal] : null;

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Link
                href="/dashboard"
                className="flex items-center space-x-1 hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
            </Link>

            <ChevronRight className="h-4 w-4" />

            <Link
                href={pathname || '/'}
                className="hover:text-foreground transition-colors"
            >
                <span className="text-foreground font-medium">
                    {currentPage}
                </span>
            </Link>

            {modalLabel && (
                <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-muted-foreground">
                        {modalLabel}
                    </span>
                </>
            )}
        </nav>
    );
}