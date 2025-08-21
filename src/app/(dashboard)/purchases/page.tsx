"use client";
import { PurchaseManagement } from '../../../components/PurchaseManagement';
import { useAuth } from '../../../components/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PurchasesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return <PurchaseManagement />;
}
