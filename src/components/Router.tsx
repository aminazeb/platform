"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Layout } from './Layout';

// Import components directly
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { InventoryManagement } from './InventoryManagement';
import { ProductManagement } from './ProductManagement';
import { PurchaseManagement } from './PurchaseManagement';
import { SalesManagement } from './SalesManagement';

// Router Context
interface RouterContextType {
    currentPath: string;
    navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter() {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useRouter must be used within a Router');
    }
    return context;
}

// Custom components to replace React Router components
export function Link({ to, children, className, onClick }: {
    to: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    const { navigate } = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(to);
        onClick?.();
    };

    return (
        <a href={`#${to}`} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}

export function useLocation() {
    const { currentPath } = useRouter();
    return { pathname: currentPath };
}

export function useNavigate() {
    const { navigate } = useRouter();
    return navigate;
}

// Page components defined inline for desktop-focused application
function DashboardPage() {
    return <AnalyticsDashboard />;
}

function InventoryPage() {
    return <InventoryManagement />;
}

function ProductsPage() {
    return <ProductManagement />;
}

function PurchasesPage() {
    return <PurchaseManagement />;
}

function SalesPage() {
    return <SalesManagement />;
}

function NotFoundPage() {
    const { navigate } = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <span className="text-4xl font-bold text-muted-foreground">404</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
                <p className="text-muted-foreground mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}

// Route mapping
const routes = {
    '/': DashboardPage,
    '/inventory': InventoryPage,
    '/products': ProductsPage,
    '/purchases': PurchasesPage,
    '/sales': SalesPage,
} as const;

export function Router() {
    const [currentPath, setCurrentPath] = useState(() => {
        // Get initial path from hash or default to '/'
        const hash = window.location.hash.slice(1);
        return hash || '/';
    });

    const navigate = (path: string) => {
        setCurrentPath(path);
        window.location.hash = path;
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            setCurrentPath(hash || '/');
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const routerValue = {
        currentPath,
        navigate
    };

    return (
        <RouterContext.Provider value={routerValue}>
            <Layout />
        </RouterContext.Provider>
    );
}

// Outlet component
export function Outlet() {
    const { currentPath } = useRouter();

    const RouteComponent = routes[currentPath as keyof typeof routes];

    if (RouteComponent) {
        return <RouteComponent />;
    }

    return <NotFoundPage />;
}