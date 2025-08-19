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
import { Plus, Receipt, Download, Loader2, ShoppingBag, Camera, X, Trash2, ShoppingCart } from 'lucide-react';

interface Sale {
  id: string;
  product_id: number;
  product_name?: string;
  quantity: number;
  action: string;
  customer_email: string;
  unit_price: number;
  total_amount: number;
  date: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface SalesReceipt {
  id: string;
  customer_email: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  date: string;
}

export function SalesManagement() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<SalesReceipt | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [customerEmail, setCustomerEmail] = useState('');

  const [formData, setFormData] = useState({
    product_id: 0,
    quantity: 0,
    action: 'sold',
    customer_email: ''
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data);
      } else {
        // Mock data for demonstration
        setSales([
          {
            id: '1',
            product_id: 1,
            product_name: 'Blue Pen',
            quantity: 5,
            action: 'sold',
            customer_email: 'customer@example.com',
            unit_price: 2.50,
            total_amount: 12.50,
            date: '2025-01-15'
          },
          {
            id: '2',
            product_id: 2,
            product_name: 'Red Marker',
            quantity: 3,
            action: 'sold',
            customer_email: 'john@example.com',
            unit_price: 3.75,
            total_amount: 11.25,
            date: '2025-01-14'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/search', {
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
        // Mock data with barcodes
        setProducts([
          { id: 1, name: 'Blue Pen', price: 2.50, quantity: 150, barcode: '1234567890' },
          { id: 2, name: 'Red Marker', price: 3.75, quantity: 45, barcode: '2345678901' },
          { id: 3, name: 'Green Notebook', price: 8.99, quantity: 80, barcode: '3456789012' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleBarcodeScanner = () => {
    setShowBarcodeScanner(true);

    // Simulate scanning a product
    setTimeout(() => {
      const mockBarcode = '1234567890';
      const foundProduct = products.find(product => product.barcode === mockBarcode || product.id === 1);

      if (foundProduct) {
        addToCart(foundProduct);
        toast.success(`Added ${foundProduct.name} to cart`);
      } else {
        toast.error('Product not found for barcode: ' + mockBarcode);
      }

      setShowBarcodeScanner(false);
    }, 2000);
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (quantity > product.quantity) {
      toast.error(`Insufficient stock. Only ${product.quantity} units available.`);
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.product_id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.quantity) {
          toast.error(`Insufficient stock. Only ${product.quantity} units available.`);
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
            : item
        );
      } else {
        return [...prev, {
          product_id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          total: product.price * quantity
        }];
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.quantity) {
      toast.error(`Insufficient stock. Only ${product.quantity} units available.`);
      return;
    }

    setCart(prev => prev.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const processCartSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      // Process each item in the cart
      const salesPromises = cart.map(async (item) => {
        const saleData = {
          product_id: item.product_id,
          quantity: item.quantity,
          action: 'sold',
          customer_email: customerEmail
        };

        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(saleData)
        });

        return { response, item, saleData };
      });

      // Wait for all sales to process
      const results = await Promise.all(salesPromises);

      // Create new sales records
      const newSales: Sale[] = results.map(({ item, saleData }, index) => ({
        id: (Date.now() + index).toString(),
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        action: 'sold',
        customer_email: customerEmail,
        unit_price: item.price,
        total_amount: item.total,
        date: new Date().toISOString().split('T')[0]
      }));

      setSales(prev => [...newSales, ...prev]);

      // Update product quantities
      setProducts(prev => prev.map(product => {
        const cartItem = cart.find(item => item.product_id === product.id);
        return cartItem
          ? { ...product, quantity: product.quantity - cartItem.quantity }
          : product;
      }));

      // Generate receipt
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.08; // 8% tax
      const total = subtotal + tax;

      const receipt: SalesReceipt = {
        id: Date.now().toString(),
        customer_email: customerEmail,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.total
        })),
        subtotal,
        tax,
        total,
        date: new Date().toISOString().split('T')[0]
      };

      setCurrentReceipt(receipt);
      setIsReceiptModalOpen(true);
      clearCart();
      setCustomerEmail('');

      toast.success(`Sale completed successfully! ${cart.length} items sold.`);
    } catch (error) {
      console.error('Error processing cart sale:', error);
      toast.error('Failed to process sale');
    }
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();

    const product = products.find(p => p.id === formData.product_id);
    if (!product) {
      toast.error('Please select a valid product');
      return;
    }

    addToCart(product, formData.quantity);
    setIsAddModalOpen(false);
    setFormData({
      product_id: 0,
      quantity: 0,
      action: 'sold',
      customer_email: ''
    });
  };

  const generateReceiptPDF = () => {
    if (!currentReceipt) return;

    const receiptText = `
SALES RECEIPT
Receipt ID: ${currentReceipt.id}
Date: ${new Date(currentReceipt.date).toLocaleDateString()}
Customer: ${currentReceipt.customer_email || 'Walk-in Customer'}

ITEMS:
${currentReceipt.items.map(item =>
      `${item.name} x${item.quantity} @ $${item.unit_price.toFixed(2)} = $${item.total.toFixed(2)}`
    ).join('\n')}

Subtotal: $${currentReceipt.subtotal.toFixed(2)}
Tax (8%): $${currentReceipt.tax.toFixed(2)}
Total: $${currentReceipt.total.toFixed(2)}

Thank you for your purchase!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${currentReceipt.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Receipt downloaded successfully');
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartTax = cartSubtotal * 0.08;
  const cartTotal = cartSubtotal + cartTax;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading sales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Point of Sale Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection & Barcode Scanner */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Point of Sale</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={handleBarcodeScanner}
                disabled={showBarcodeScanner}
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>{showBarcodeScanner ? 'Scanning...' : 'Scan Barcode'}</span>
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} variant="outline" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Manually</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.filter(p => p.quantity > 0).map((product) => (
                <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4" onClick={() => addToCart(product)}>
                    <div className="text-center">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.quantity} in stock</p>
                      <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5" />
                <span>Cart ({cart.length})</span>
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                <p>Cart is empty</p>
                <p className="text-sm">Scan or add products to start</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            -
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product_id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (8%):</span>
                    <span>${cartTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Customer email (optional)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                  <Button onClick={processCartSale} className="w-full">
                    Complete Sale
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Sales History</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.product_name}</TableCell>
                    <TableCell>{sale.quantity} units</TableCell>
                    <TableCell>${sale.unit_price.toFixed(2)}</TableCell>
                    <TableCell>${sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{sale.customer_email || 'Walk-in Customer'}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sale.action}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {sales.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No sales found. Make your first sale above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Sale Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Product to Cart</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSale} className="space-y-4">
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
                  {products.filter(p => p.quantity > 0).map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - ${product.price.toFixed(2)} ({product.quantity} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add to Cart
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sales Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Sales Receipt</span>
            </DialogTitle>
          </DialogHeader>

          {currentReceipt && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold">SALES RECEIPT</h3>
                <p className="text-sm text-muted-foreground">Receipt ID: {currentReceipt.id}</p>
                <p className="text-sm text-muted-foreground">Date: {new Date(currentReceipt.date).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm"><strong>Customer:</strong> {currentReceipt.customer_email || 'Walk-in Customer'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Items:</h4>
                {currentReceipt.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${currentReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%):</span>
                  <span>${currentReceipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>${currentReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Thank you for your purchase!
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>
              Close
            </Button>
            <Button onClick={generateReceiptPDF} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Download Receipt</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}