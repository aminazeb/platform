import { Link, useNavigate } from '../../components/Router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
    const navigate = useNavigate();

    const handleGoBack = () => {
        // Simple go back functionality
        window.history.back();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <span className="text-4xl font-bold text-muted-foreground">404</span>
                    </div>
                    <CardTitle>Page Not Found</CardTitle>
                    <CardDescription>
                        The page you're looking for doesn't exist or has been moved.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Button onClick={handleGoBack} variant="outline" className="flex-1">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                        <Link to="/" className="flex-1">
                            <Button className="w-full flex items-center justify-center space-x-2">
                                <Home className="h-4 w-4" />
                                <span>Dashboard</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}