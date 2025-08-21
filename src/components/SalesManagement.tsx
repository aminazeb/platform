import { useState, useEffect, useRef } from 'react';
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
import { useSales, useCreateSalesBatch, useInventorySearch } from '../hooks/useApi';
import { useAuth } from './AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

// Import QuaggaJS
import Quagga from 'quagga';

interface Sale {
  id: string;
  product_id: number;
  product?: Product;
  quantity: number;
  action: string;
  customer_email?: string;
  unit_price: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  price: string; // API returns price as string
  color?: string;
  image_url?: string;
  quantity: number; // Inventory has quantity field
  last_updated?: string;
  created_at?: string;
  updated_at?: string;
  meta?: {
    barcode?: string;
  };
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
  customer_email?: string;
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  created_at: string;
  date?: string; // Add date for backward compatibility
}

export function SalesManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route-based modal state
  const isAddModalOpen = searchParams?.get('modal') === 'add-to-cart';
  const isReceiptModalOpen = searchParams?.get('modal') === 'sales-receipt';
  const showBarcodeScanner = searchParams?.get('modal') === 'barcode-scanner';

  const { data: salesData, isLoading: salesLoading } = useSales();
  const { data: productsData, isLoading: productsLoading } = useInventorySearch();
  const createSalesBatchMutation = useCreateSalesBatch();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentReceipt, setCurrentReceipt] = useState<SalesReceipt | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    product_id: 0,
    quantity: 0,
    action: 'sold',
    customer_email: ''
  });

  // Extract data from React Query responses
  const sales = salesData?.data || [];
  const products = productsData?.data || [];
  const loading = salesLoading || productsLoading;

  useEffect(() => {
    // No need to fetch sales and products here as they are now managed by React Query
  }, []);

  const handleBarcodeScanner = () => {
    router.push('?modal=barcode-scanner');
  };

  const startScanner = () => {
    if (!scannerContainerRef.current) return;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerContainerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment" // Use back camera
        },
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ]
      }
    }, (err: any) => {
      if (err) {
        console.error('Scanner initialization failed:', err);
        toast.error('Failed to initialize barcode scanner');
        return;
      }

      Quagga.start();
      toast.success('Barcode scanner started');
    });

    Quagga.onDetected((result: any) => {
      const code = result.codeResult.code;
      setScannedBarcode(code);

      // Find product by barcode
      const foundProduct = products.find((product: Product) =>
        product.meta?.barcode === code || product.id.toString() === code
      );

      if (foundProduct) {
        addToCart(foundProduct, 1);
        toast.success(`Product found: ${foundProduct.name}`);
        setScannedBarcode(''); // Clear scanned barcode after successful scan
        Quagga.stop();
        router.push('/sales'); // Close scanner after successful scan
      } else {
        toast.error(`No product found for barcode: ${code}`);
      }
    });

    Quagga.onProcessed((result: any) => {
      if (result) {
        // Optional: Handle processed frames
      }
    });
  };

  const stopScanner = () => {
    Quagga.stop();
    setScannedBarcode('');
  };

  useEffect(() => {
    if (showBarcodeScanner) {
      // Start scanner after a short delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 100);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [showBarcodeScanner]);

  const addToCart = (product: Product, quantity: number) => {
    const existingItem = cart.find((item: CartItem) => item.product_id === product.id);

    if (existingItem) {
      setCart(prev => prev.map((item: CartItem) =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + quantity, total: (item.quantity + quantity) * item.price }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity,
        total: parseFloat(product.price) * quantity
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter((item: CartItem) => item.product_id !== productId));
  };

  const updateCartItemQuantity = (productId: number, quantity: number) => {
    setCart(prev => prev.map((item: CartItem) => {
      if (item.product_id === productId) {
        return { ...item, quantity, total: item.price * quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalQuantity = () => cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  const getTotalAmount = () => cart.reduce((sum: number, item: CartItem) => sum + item.total, 0);

  const processCartSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      // Prepare sales data for batch creation with correct format
      const salesData = cart.map(item => ({
        product_id: item.product_id,
        user_id: parseInt(user?.id || '0'),
        quantity: item.quantity,
        amount: item.total,
        action: 'sale',
        customer_email: customerEmail || 'walk-in',
        meta: {
          notes: `POS sale - Customer: ${customerEmail || 'Walk-in Customer'}`
        }
      }));

      // Create sales via API call
      await createSalesBatchMutation.mutateAsync(salesData);

      // Generate receipt
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1; // 10% tax
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
        created_at: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0] // For backward compatibility
      };

      setCurrentReceipt(receipt);
      router.push('?modal=sales-receipt');
      setCart([]);
      setCustomerEmail('');
      toast.success('Sale completed successfully!');
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Failed to process sale. Please try again.');
    }
  };

  const generateReceiptPDF = () => {
    if (!currentReceipt) return;

    const receiptText = `
SALES RECEIPT
Receipt ID: ${currentReceipt.id}
Date: ${new Date(currentReceipt.created_at).toLocaleDateString()}
Customer: ${currentReceipt.customer_email || 'Walk-in Customer'}

ITEMS:
${currentReceipt.items.map(item =>
      `${item.name} x${item.quantity} @ $${item.unit_price.toFixed(2)} = $${item.total.toFixed(2)}`
    ).join('\n')}

Subtotal: $${currentReceipt.subtotal.toFixed(2)}
Tax: $${(currentReceipt.tax || 0).toFixed(2)}
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
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();

    const product = products.find((p: Product) => p.id === formData.product_id);
    if (!product) {
      toast.error('Please select a valid product');
      return;
    }

    addToCart(product, formData.quantity);
    router.push('/sales'); // Close modal after adding to cart
    setFormData({
      product_id: 0,
      quantity: 0,
      action: 'sold',
      customer_email: ''
    });
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
                onClick={() => handleBarcodeScanner()}
                disabled={showBarcodeScanner}
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>{showBarcodeScanner ? 'Scanning...' : 'Scan Barcode'}</span>
              </Button>
              <Button onClick={() => router.push('?modal=add-to-cart')} variant="outline" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Manually</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading products...</span>
                  </div>
                ) : (
                  <div>
                    <p>No products available</p>
                    <p className="text-sm">Please check your API connection or add some products first.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.filter((p: Product) => p.quantity > 0).map((product: Product) => {
                  return (
                    <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4" onClick={() => addToCart(product, 1)}>
                        <div className="text-center">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-lg font-bold text-primary">${parseFloat(product.price).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">Stock: {product.quantity}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
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
                            onClick={() => updateCartItemQuantity(item.product_id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            -
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartItemQuantity(item.product_id, item.quantity + 1)}
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
                {sales.map((sale: Sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.product_id}</TableCell>
                    <TableCell>{sale.product?.name || 'Unknown Product'}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={sale.action === 'sold' ? 'default' : 'secondary'}>
                        {sale.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.customer_email || 'Walk-in'}</TableCell>
                    <TableCell>${sale.unit_price}</TableCell>
                    <TableCell>${sale.total_amount}</TableCell>
                    <TableCell>{new Date(sale.created_at).toLocaleDateString()}</TableCell>
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
      <Dialog open={isAddModalOpen} onOpenChange={() => router.push('/sales')}>
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
                  {products.length === 0 ? (
                    <SelectItem value="" disabled>
                      No products available
                    </SelectItem>
                  ) : (
                    products
                      .filter((p: Product) => p.quantity > 0)
                      .map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - ${parseFloat(product.price).toFixed(2)} ({product.color}) - Stock: {product.quantity}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading products...' : 'No products found. Please check your API connection.'}
                </p>
              )}
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
              <Button type="button" variant="outline" onClick={() => router.push('/sales')}>
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
      <Dialog open={isReceiptModalOpen} onOpenChange={() => router.push('/sales')}>
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
                <div className="text-sm text-muted-foreground">
                  <p>Receipt ID: {currentReceipt.id}</p>
                  <p>Date: {new Date(currentReceipt.created_at).toLocaleDateString()}</p>
                  <p>Customer: {currentReceipt.customer_email || 'Walk-in Customer'}</p>
                </div>
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
                  <span>Tax:</span>
                  <span>${(currentReceipt.tax || 0).toFixed(2)}</span>
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
            <Button variant="outline" onClick={() => router.push('/sales')}>
              Close
            </Button>
            <Button onClick={generateReceiptPDF} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Download Receipt</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Modal */}
      <Dialog open={showBarcodeScanner} onOpenChange={() => router.push('/sales')}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Barcode Scanner</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Point your camera at a barcode to scan
              </p>
              {scannedBarcode && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm font-medium text-green-800">
                    Scanned: {scannedBarcode}
                  </p>
                </div>
              )}
            </div>

            <div
              ref={scannerContainerRef}
              className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            >
              <div className="text-center text-gray-500">
                <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p>Camera initializing...</p>
              </div>
            </div>

            <div className="flex justify-center space-x-2">
              <Button variant="outline" onClick={stopScanner}>
                Stop Scanner
              </Button>
              <Button onClick={() => router.push('/sales')}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}