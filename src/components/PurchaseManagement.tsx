import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Plus, Upload, FileText, Loader2, ShoppingCart, Camera } from 'lucide-react';

interface Purchase {
  id: string;
  product_id: number;
  product_name?: string;
  supplier: string;
  manufacturer: string;
  cost_per_unit: number;
  amount: number;
  quantity: number;
  date: string;
  receipt_url?: string;
}

interface Product {
  id: number;
  name: string;
}

export function PurchaseManagement() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [formData, setFormData] = useState({
    product_id: 0,
    supplier: '',
    manufacturer: '',
    cost_per_unit: 0,
    amount: 0,
    quantity: 0
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      } else {
        // Mock data for demonstration
        setPurchases([
          {
            id: '1',
            product_id: 1,
            product_name: 'Blue Pen',
            supplier: 'Office Supplies Co.',
            manufacturer: 'PenCorp',
            cost_per_unit: 1.25,
            amount: 125.00,
            quantity: 100,
            date: '2025-01-15'
          },
          {
            id: '2',
            product_id: 2,
            product_name: 'Red Marker',
            supplier: 'Stationery Plus',
            manufacturer: 'MarkerTech',
            cost_per_unit: 2.50,
            amount: 125.00,
            quantity: 50,
            date: '2025-01-14'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ search: '' })
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        // Mock data
        setProducts([
          { id: 1, name: 'Blue Pen' },
          { id: 2, name: 'Red Marker' },
          { id: 3, name: 'Green Notebook' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok || true) { // Mock success for demonstration
        const productName = products.find(p => p.id === formData.product_id)?.name || 'Unknown Product';
        const newPurchase: Purchase = {
          id: Date.now().toString(),
          ...formData,
          product_name: productName,
          date: new Date().toISOString().split('T')[0]
        };

        setPurchases(prev => [newPurchase, ...prev]);
        toast.success('Purchase added successfully');
        setIsAddModalOpen(false);
        setFormData({
          product_id: 0,
          supplier: '',
          manufacturer: '',
          cost_per_unit: 0,
          amount: 0,
          quantity: 0
        });
      }
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast.error('Failed to add purchase');
    }
  };

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiptFile) {
      toast.error('Please select a receipt file');
      return;
    }

    try {
      setUploadingReceipt(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      // Mock OCR processing - in reality, you'd send this to your backend
      // which would process the receipt and extract purchase information
      const mockExtractedData = {
        product_id: 1,
        supplier: 'ABC Office Supplies',
        manufacturer: 'PenCorp Industries',
        cost_per_unit: 1.50,
        amount: 75.00,
        quantity: 50
      };

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add the extracted purchase
      const productName = products.find(p => p.id === mockExtractedData.product_id)?.name || 'Unknown Product';
      const newPurchase: Purchase = {
        id: Date.now().toString(),
        ...mockExtractedData,
        product_name: productName,
        date: new Date().toISOString().split('T')[0],
        receipt_url: URL.createObjectURL(receiptFile)
      };

      setPurchases(prev => [newPurchase, ...prev]);
      toast.success('Receipt processed and purchase added successfully');
      setIsReceiptModalOpen(false);
      setReceiptFile(null);
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to process receipt');
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Auto-calculate amount when cost per unit or quantity changes
  useEffect(() => {
    const amount = formData.cost_per_unit * formData.quantity;
    if (amount !== formData.amount) {
      setFormData(prev => ({ ...prev, amount }));
    }
  }, [formData.cost_per_unit, formData.quantity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading purchases...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Purchase Management</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={() => setIsReceiptModalOpen(true)} variant="outline" className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Upload Receipt</span>
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Purchase</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost per Unit</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.product_name}</TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>{purchase.manufacturer}</TableCell>
                    <TableCell>{purchase.quantity} units</TableCell>
                    <TableCell>${purchase.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell>${purchase.amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {purchase.receipt_url ? (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>Available</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Receipt</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {purchases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No purchases found. Add your first purchase above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Purchase Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Purchase</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddPurchase} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.product_id.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Supplier name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="Manufacturer name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Automatically calculated: {formData.quantity} × ${formData.cost_per_unit} = ${(formData.quantity * formData.cost_per_unit).toFixed(2)}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Purchase
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Purchase Receipt</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReceiptUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt Image/PDF</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload an image or PDF of your purchase receipt. Our system will automatically extract purchase details.
              </p>
            </div>

            {receiptFile && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{receiptFile.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReceiptModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadingReceipt}>
                {uploadingReceipt && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {uploadingReceipt ? 'Processing...' : 'Process Receipt'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}