import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { Plus, Upload, FileText, Loader2, ShoppingCart, Camera, AlertCircle, RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  usePurchases,
  useProducts,
  useCreatePurchase,
  useUpdatePurchase,
  useDeletePurchase
} from '../hooks/useApi';

interface Purchase {
  id: string;
  product_id: number;
  product?: Product;
  user_id: number;
  product_name?: string;
  supplier: string;
  manufacturer: string;
  cost_per_unit: number;
  amount: number;
  quantity: number;
  meta?: {
    name: string;
    description: string;
    color: string;
    image_url: string;
    price: number;
    storage_location: string;
    receipt_url: string;
  };
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
}

export function PurchaseManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route-based modal state
  const isAddModalOpen = searchParams?.get('modal') === 'add-purchase';
  const isReceiptModalOpen = searchParams?.get('modal') === 'upload-receipt';

  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // React Query hooks
  const {
    data: purchasesData,
    isLoading: purchasesLoading,
    error: purchasesError,
    refetch: refetchPurchases
  } = usePurchases();

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useProducts();

  const createPurchaseMutation = useCreatePurchase();
  const updatePurchaseMutation = useUpdatePurchase();
  const deletePurchaseMutation = useDeletePurchase();

  const purchases = purchasesData?.data || [];
  const products = productsData?.data || [];
  const isLoading = purchasesLoading || productsLoading;

  const [formData, setFormData] = useState({
    product_id: 0,
    supplier: '',
    manufacturer: '',
    cost_per_unit: 0,
    amount: 0,
    quantity: 0,
    meta: {
      name: '',
      description: '',
      color: '',
      image_url: '',
      price: 0,
      storage_location: '',
      receipt_url: ''
    },
  });

  const [isAddingNewProduct, setIsAddingNewProduct] = useState(false);

  // Receipt upload functions
  const handleReceiptUpload = () => {
    receiptFileInputRef.current?.click();
  };

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedReceipt(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setReceiptPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setSelectedReceipt(null);
    setReceiptPreview(null);
    if (receiptFileInputRef.current) {
      receiptFileInputRef.current.value = '';
    }
  };

  const processReceiptUpload = async () => {
    if (!selectedReceipt) {
      toast.error('Please select a receipt image first');
      return;
    }

    try {
      setIsUploadingReceipt(true);

      // Upload receipt image to backend
      const receiptUrl = await uploadImageToBackend(selectedReceipt);

      // Update form data with receipt URL
      setFormData(prev => ({
        ...prev,
        meta: {
          ...prev.meta,
          receipt_url: receiptUrl
        }
      }));

      toast.success('Receipt uploaded successfully!');

      // Clear the receipt after successful upload
      handleRemoveReceipt();

      // Close the modal
      router.push('/purchases');

    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to upload receipt. Please try again.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({
      product_id: 0,
      supplier: '',
      manufacturer: '',
      cost_per_unit: 0,
      amount: 0,
      quantity: 0,
      meta: {
        name: '',
        description: '',
        color: '',
        image_url: '',
        price: 0,
        storage_location: '',
        receipt_url: ''
      },
    });
    setIsAddingNewProduct(false);
    setSelectedReceipt(null);
    handleRemoveImage(); // Clean up image state
  };

  // Reset form when switching between new product and existing product
  useEffect(() => {
    if (isAddingNewProduct) {
      // Clear product_id when adding new product
      setFormData(prev => ({ ...prev, product_id: 0 }));
    } else {
      // Clear new product fields when selecting existing product
      setFormData(prev => ({
        ...prev,
        meta: {
          name: '',
          description: '',
          color: '',
          image_url: '',
          price: 0,
          storage_location: '',
          receipt_url: ''
        }
      }));
    }
  }, [isAddingNewProduct]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isAddModalOpen) {
      resetForm();
    }
  }, [isAddModalOpen]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image file size must be less than 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to backend and get short URL
  const uploadImageToBackend = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Validate that we got a URL back
      if (!result.url || typeof result.url !== 'string') {
        throw new Error('Invalid response: no URL received');
      }

      return result.url; // Backend returns the short URL
    } catch (error) {
      console.error('Error uploading image:', error);

      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('Upload failed: 401')) {
          toast.error('Authentication failed. Please log in again.');
        } else if (error.message.includes('Upload failed: 413')) {
          toast.error('Image file is too large. Please use a smaller image.');
        } else if (error.message.includes('Upload failed: 415')) {
          toast.error('Invalid image format. Please use PNG, JPG, or GIF.');
        } else {
          toast.error('Failed to upload image. Please try again.');
        }
      } else {
        toast.error('Failed to upload image. Please try again.');
      }

      throw error;
    }
  };



  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isAddingNewProduct && formData.product_id === 0) {
      toast.error('Please select an existing product');
      return;
    }

    if (isAddingNewProduct && (!formData.meta.name || !formData.meta.description)) {
      toast.error('Please fill in all required product fields');
      return;
    }

    try {
      setIsUploadingImage(true);

      let imageUrl = formData.meta.image_url;

      // If an image is selected, upload to backend and get URL
      if (selectedImage) {
        imageUrl = await uploadImageToBackend(selectedImage);
      }

      const purchaseData = {
        ...formData,
        user_id: parseInt(user?.id || '0'),
        product_name: isAddingNewProduct
          ? formData.meta.name
          : products.find((p: Product) => p.id === formData.product_id)?.name || 'Unknown Product',
        meta: {
          ...formData.meta,
          image_url: imageUrl
        }
      };

      await createPurchaseMutation.mutateAsync(purchaseData);
      toast.success('Purchase added successfully');
      router.push('/purchases'); // Close modal after adding
      resetForm();
      handleRemoveImage(); // Clean up image state
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast.error('Failed to add purchase');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Auto-calculate amount when cost per unit or quantity changes
  useEffect(() => {
    const amount = formData.cost_per_unit * formData.quantity;
    if (amount !== formData.amount) {
      setFormData(prev => ({ ...prev, amount }));
    }
  }, [formData.cost_per_unit, formData.quantity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading purchases...</span>
      </div>
    );
  }

  // Error states
  if (purchasesError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to load purchases</h3>
          <p className="text-muted-foreground">There was an error loading your purchases.</p>
        </div>
        <Button onClick={() => refetchPurchases()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to load products</h3>
          <p className="text-muted-foreground">There was an error loading products.</p>
        </div>
        <Button onClick={() => refetchProducts()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
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
              <Button onClick={() => router.push('/purchases?modal=upload-receipt')} variant="outline" className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Upload Receipt</span>
              </Button>
              <Button onClick={() => router.push('/purchases?modal=add-purchase')} className="flex items-center space-x-2">
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
                {purchases.map((purchase: Purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.product?.name}</TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>{purchase.manufacturer}</TableCell>
                    <TableCell>{purchase.quantity} units</TableCell>
                    <TableCell>${purchase.cost_per_unit}</TableCell>
                    <TableCell>${purchase.amount}</TableCell>
                    <TableCell>{new Date(purchase.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {purchase.meta?.receipt_url ? (
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
      <Dialog open={isAddModalOpen} onOpenChange={() => router.push('/purchases')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Purchase</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddPurchase} className="space-y-4">

            {/* Product Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="add-new-product"
                  checked={isAddingNewProduct}
                  onCheckedChange={(checked) => setIsAddingNewProduct(checked as boolean)}
                />
                <Label htmlFor="add-new-product" className="text-sm font-medium">
                  Add New Product
                </Label>
              </div>

              {isAddingNewProduct ? (
                /* New Product Fields */
                <div className="space-y-4 border-l-2 border-primary pl-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.meta.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, name: e.target.value } }))}
                      placeholder="Product name"
                      required={isAddingNewProduct}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={formData.meta.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, description: e.target.value } }))}
                      placeholder="Description"
                      required={isAddingNewProduct}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      value={formData.meta.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, color: e.target.value } }))}
                      placeholder="Color"
                      required={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Product Image</Label>

                    {/* Hidden file input */}
                    <Input
                      ref={fileInputRef}
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {/* Image upload area */}
                    {!imagePreview ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                          <img
                            src={imagePreview}
                            alt="Product preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click the X button to remove and upload a different image
                        </p>
                      </div>
                    )}

                    {/* Fallback URL input */}
                    <div className="mt-2">
                      <Label htmlFor="image_url" className="text-sm text-muted-foreground">
                        Or enter image URL manually
                      </Label>
                      <Input
                        id="image_url"
                        value={formData.meta.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, image_url: e.target.value } }))}
                        placeholder="Image URL"
                        required={false}
                        disabled={!!selectedImage}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.meta.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, price: parseFloat(e.target.value) || 0 } }))}
                      placeholder="Price"
                      required={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storage_location">Storage Location</Label>
                    <Input
                      id="storage_location"
                      value={formData.meta.storage_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, storage_location: e.target.value } }))}
                      placeholder="Storage Location"
                      required={false}
                    />
                  </div>
                </div>
              ) : (
                /* Existing Product Selection */
                <div className="space-y-2">
                  <Label htmlFor="existing-product">Select Existing Product *</Label>
                  <Select
                    value={formData.product_id.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: parseInt(value) }))}
                    defaultValue={'0'}
                    required={!isAddingNewProduct}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                Automatically calculated: {formData.quantity} × ${formData.cost_per_unit} = ${(formData.quantity * formData.cost_per_unit)}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => router.push('/purchases')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPurchaseMutation.isPending || isUploadingImage}>
                {(createPurchaseMutation.isPending || isUploadingImage) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploadingImage ? 'Uploading Image...' :
                  createPurchaseMutation.isPending ? 'Adding Purchase...' : 'Add Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for receipt upload */}
      <input
        ref={receiptFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleReceiptSelect}
        className="hidden"
      />

      {/* Receipt Upload Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={() => router.push('/purchases')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Upload Purchase Receipt</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Upload a receipt image for record keeping
              </p>
            </div>

            {!selectedReceipt ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">No receipt selected</p>
                <Button onClick={handleReceiptUpload} variant="outline">
                  Select Receipt Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={receiptPreview || undefined}
                    alt="Receipt preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveReceipt}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p><strong>File:</strong> {selectedReceipt.name}</p>
                  <p><strong>Size:</strong> {(selectedReceipt.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p><strong>Type:</strong> {selectedReceipt.type}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => router.push('/purchases')}>
                Cancel
              </Button>
              {selectedReceipt && (
                <Button
                  onClick={processReceiptUpload}
                  disabled={isUploadingReceipt}
                  className="flex items-center space-x-2"
                >
                  {isUploadingReceipt ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload Receipt</span>
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}