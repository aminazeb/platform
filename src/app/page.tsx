"use client";
import { AuthProvider, useAuth } from '../components/AuthContext';
import { AuthForm } from '../components/AuthForm';
import { Router } from '../components/Router';
import { Toaster } from '../components/ui/sonner';
import { Package } from 'lucide-react';

function AuthWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <Router />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
      <Toaster />
    </AuthProvider>
  );
}
// "use client";

// import { useState } from 'react';
// import { AuthProvider, useAuth } from '../components/AuthContext';
// import { AuthForm } from '../components/AuthForm';
// import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
// import { ProductManagement } from '../components/ProductManagement';
// import { PurchaseManagement } from '../components/PurchaseManagement';
// import { SalesManagement } from '../components/SalesManagement';
// import { InventoryManagement } from '../components/InventoryManagement';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
// import { Button } from '../components/ui/button';
// import { Toaster } from '../components/ui/sonner';
// import { Avatar, AvatarFallback } from '../components/ui/avatar';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
// import { BarChart3, Package, ShoppingCart, ShoppingBag, User, LogOut, Settings } from 'lucide-react';

// function AppContent() {
//   const { user, logout } = useAuth();
//   const [activeTab, setActiveTab] = useState('dashboard');

//   const handleLogout = () => {
//     logout();
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="border-b bg-card">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-2">
//                 <Package className="h-8 w-8 text-primary" />
//                 <h1 className="text-xl font-bold">Platform</h1>
//               </div>
//             </div>

//             <div className="flex items-center space-x-4">
//               <span className="text-sm text-muted-foreground">
//                 Welcome, {user?.name || user?.email}
//               </span>

//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
//                     <Avatar className="h-8 w-8">
//                       <AvatarFallback>
//                         {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
//                       </AvatarFallback>
//                     </Avatar>
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   <DropdownMenuItem>
//                     <User className="h-4 w-4 mr-2" />
//                     <span>Profile</span>
//                   </DropdownMenuItem>
//                   <DropdownMenuItem>
//                     <Settings className="h-4 w-4 mr-2" />
//                     <span>Settings</span>
//                   </DropdownMenuItem>
//                   <DropdownMenuSeparator />
//                   <DropdownMenuItem onClick={handleLogout}>
//                     <LogOut className="h-4 w-4 mr-2" />
//                     <span>Logout</span>
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8">
//         <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//           <TabsList className="grid w-full grid-cols-5">
//             <TabsTrigger value="dashboard" className="flex items-center space-x-2">
//               <BarChart3 className="h-4 w-4" />
//               <span className="hidden sm:inline">Dashboard</span>
//             </TabsTrigger>
//             <TabsTrigger value="inventory" className="flex items-center space-x-2">
//               <Package className="h-4 w-4" />
//               <span className="hidden sm:inline">Inventory</span>
//             </TabsTrigger>
//             <TabsTrigger value="products" className="flex items-center space-x-2">
//               <Package className="h-4 w-4" />
//               <span className="hidden sm:inline">Products</span>
//             </TabsTrigger>
//             <TabsTrigger value="purchases" className="flex items-center space-x-2">
//               <ShoppingCart className="h-4 w-4" />
//               <span className="hidden sm:inline">Purchases</span>
//             </TabsTrigger>
//             <TabsTrigger value="sales" className="flex items-center space-x-2">
//               <ShoppingBag className="h-4 w-4" />
//               <span className="hidden sm:inline">Sales</span>
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="dashboard">
//             <AnalyticsDashboard />
//           </TabsContent>

//           <TabsContent value="inventory">
//             <InventoryManagement />
//           </TabsContent>

//           <TabsContent value="products">
//             <ProductManagement />
//           </TabsContent>

//           <TabsContent value="purchases">
//             <PurchaseManagement />
//           </TabsContent>

//           <TabsContent value="sales">
//             <SalesManagement />
//           </TabsContent>
//         </Tabs>
//       </div>

//       <Toaster />
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <AuthWrapper />
//     </AuthProvider>
//   );
// }

// function AuthWrapper() {
//   const { user, loading } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <Package className="h-12 w-12 text-primary mx-auto mb-4" />
//           <p className="text-muted-foreground">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <AuthForm />;
//   }

//   return <AppContent />;
// }