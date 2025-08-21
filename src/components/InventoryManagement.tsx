import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Search, Download, Filter, Loader2, Package, BarChart3 } from 'lucide-react';
import { Image } from './ui/image';
import { useInventorySearch } from '../hooks/useApi';
import { useAuth } from './AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  color: string;
  image_url: string;
  price: number;
  quantity: number;
  last_updated: string;
}

export function InventoryManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Route-based state
  const searchTerm = searchParams?.get('search') || '';
  const quantityFilter = searchParams?.get('quantity') || 'all';
  const priceFilter = searchParams?.get('price') || 'all';

  const [exporting, setExporting] = useState(false);

  // React Query hook
  const {
    data: inventoryData,
    isLoading: loading,
    error,
    refetch: refetchInventory
  } = useInventorySearch(searchTerm);

  const inventory: InventoryItem[] = inventoryData?.data || [];

  // Update URL when filters change
  const updateFilters = (newSearchTerm: string, newQuantityFilter: string, newPriceFilter: string) => {
    const params = new URLSearchParams();
    if (newSearchTerm) params.set('search', newSearchTerm);
    if (newQuantityFilter !== 'all') params.set('quantity', newQuantityFilter);
    if (newPriceFilter !== 'all') params.set('price', newPriceFilter);

    const queryString = params.toString();
    const newUrl = queryString ? `/inventory?${queryString}` : '/inventory';
    router.push(newUrl);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    updateFilters(value, quantityFilter, priceFilter);
  };

  // Handle filter changes
  const handleQuantityFilterChange = (value: string) => {
    updateFilters(searchTerm, value, priceFilter);
  };

  const handlePriceFilterChange = (value: string) => {
    updateFilters(searchTerm, quantityFilter, value);
  };

  // Client-side CSV generation function
  const generateCSVExport = (data: InventoryItem[]) => {
    const csvContent = [
      ['Name', 'Description', 'Color', 'Price', 'Quantity', 'Last Updated'],
      ...data.map(item => [
        item.name,
        item.description,
        item.color,
        item.price.toString(),
        item.quantity.toString(),
        item.last_updated
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Use the current filters from URL for export
      const exportFilters = {
        search: searchTerm,
        quantityFilter: quantityFilter,
        priceFilter: priceFilter
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(exportFilters)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Inventory exported successfully');
      } else {
        // Fallback to client-side CSV generation using current filtered data
        const filteredData = getFilteredInventory();
        generateCSVExport(filteredData);
        toast.success('Inventory exported successfully (client-side)');
      }
    } catch (error) {
      console.error('Error exporting inventory:', error);
      // Fallback to client-side export
      const filteredData = getFilteredInventory();
      generateCSVExport(filteredData);
      toast.success('Inventory exported successfully (client-side)');
    } finally {
      setExporting(false);
    }
  };

  const getFilteredInventory = () => {
    return inventory.filter(item => {
      // Search filter
      const matchesSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase());

      // Quantity filter
      const matchesQuantity = quantityFilter === 'all' ||
        (quantityFilter === 'low' && item.quantity <= 10 && item.quantity > 0) ||
        (quantityFilter === 'out' && item.quantity === 0) ||
        (quantityFilter === 'in-stock' && item.quantity > 10);

      // Price filter
      const matchesPrice = priceFilter === 'all' ||
        (priceFilter === 'under-5' && item.price < 5) ||
        (priceFilter === '5-20' && item.price >= 5 && item.price <= 20) ||
        (priceFilter === 'over-20' && item.price > 20);

      return matchesSearch && matchesQuantity && matchesPrice;
    });
  };

  const filteredInventory = getFilteredInventory();

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (item.quantity <= 10) return { label: 'Low Stock', variant: 'destructive' as const };
    return { label: 'In Stock', variant: 'secondary' as const };
  };

  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const lowStockCount = filteredInventory.filter(item => item.quantity <= 10 && item.quantity > 0).length;
  const outOfStockCount = filteredInventory.filter(item => item.quantity === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Inventory Management</span>
            </CardTitle>
            <Button onClick={handleExport} disabled={exporting} className="flex items-center space-x-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Export Filtered Data</span>
            </Button>
          </div>

          {/* Unified Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={quantityFilter} onValueChange={handleQuantityFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="in-stock">In Stock (11+)</SelectItem>
                <SelectItem value="low">Low Stock (1-10)</SelectItem>
                <SelectItem value="out">Out of Stock (0)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={handlePriceFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-5">Under $5</SelectItem>
                <SelectItem value="5-20">$5 - $20</SelectItem>
                <SelectItem value="over-20">Over $20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <TableRow key={item.id} id={`product-${item.id}`} className="transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ backgroundColor: item.color + '20', color: item.color }}>
                          {item.color}
                        </Badge>
                      </TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>{item.quantity} units</TableCell>
                      <TableCell>${(item.quantity * item.price)}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                      </TableCell>
                      <TableCell>{new Date(item.last_updated).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredInventory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No inventory items found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}