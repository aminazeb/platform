import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { toast } from 'sonner';
import { Plus, Search, Archive, MoreHorizontal, Loader2, Package, RotateCcw, Edit, Trash2, AlertCircle, RefreshCw, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Image } from './ui/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useArchiveProduct,
  useUnarchiveProduct
} from '../hooks/useApi';

interface Product {
  id: string;
  name: string;
  description: string;
  color: string;
  image_url: string;
  price: number;
  status: 'active' | 'archived';
  meta: any;
  created_at: string;
  updated_at: string;
}

export function ProductManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route-based modal state
  const isAddModalOpen = searchParams?.get('modal') === 'add-product';
  const isEditModalOpen = searchParams?.get('modal') === 'edit-product';

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '',
    image_url: '',
    price: 0,
    meta: {
      quantity: 0,
      storage_location: ''
    }
  });

  // React Query hooks
  const {
    data: productsData,
    isLoading,
    error,
    refetch: refetchProducts
  } = useProducts(debouncedSearchTerm);

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const archiveProductMutation = useArchiveProduct();
  const unarchiveProductMutation = useUnarchiveProduct();

  const products: Product[] = productsData?.data || [];

  // Reset form when modals close
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '',
      image_url: '',
      price: 0,
      meta: {
        quantity: 0,
        storage_location: ''
      }
    });
    setEditingProduct(null);
    handleRemoveImage(); // Clean up image state
  };

  // Reset form when modals close
  if (!isAddModalOpen && !isEditModalOpen && (formData.name || editingProduct)) {
    resetForm();
  }

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUploadingImage(true);

      let imageUrl = formData.image_url;

      // If an image is selected, upload to backend and get URL
      if (selectedImage) {
        imageUrl = await uploadImageToBackend(selectedImage);
      }

      const productData = {
        ...formData,
        image_url: imageUrl
      };

      await createProductMutation.mutateAsync(productData);
      toast.success('Product added successfully');
      router.push('/products'); // Close modal after adding
      resetForm();
      handleRemoveImage(); // Clean up image state
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      setIsUploadingImage(true);

      let imageUrl = formData.image_url;

      // If an image is selected, upload to backend and get URL
      if (selectedImage) {
        imageUrl = await uploadImageToBackend(selectedImage);
      }

      const productData = {
        ...formData,
        image_url: imageUrl
      };

      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        data: productData
      });
      toast.success('Product updated successfully');
      router.push('/products'); // Close modal after updating
      resetForm();
      handleRemoveImage(); // Clean up image state
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      color: product.color,
      image_url: product.image_url,
      price: product.price,
      meta: {
        quantity: product.meta?.quantity || 0,
        storage_location: product.meta?.storage_location || ''
      }
    });
    router.push('/products?modal=edit-product'); // Open edit modal
    setOpenPopover(null);
  };

  const handleArchiveProduct = async (productId: string) => {
    try {
      const productName = products.find(p => p.id === productId)?.name;
      await archiveProductMutation.mutateAsync(productId);
      toast.success(`${productName} has been archived`);
      setOpenPopover(null);
    } catch (error) {
      console.error('Error archiving product:', error);
      toast.error('Failed to archive product');
    }
  };

  const handleUnarchiveProduct = async (productId: string) => {
    try {
      const productName = products.find(p => p.id === productId)?.name;
      await unarchiveProductMutation.mutateAsync(productId);
      toast.success(`${productName} has been reactivated`);
      setOpenPopover(null);
    } catch (error) {
      console.error('Error unarchiving product:', error);
      toast.error('Failed to reactivate product');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // If we have a debounced search term, the API already filtered by search
      // So we only need to filter by status locally
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

      // If no debounced search term, also apply local search filtering
      if (!debouncedSearchTerm) {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.color.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && matchesStatus;
      }

      return matchesStatus;
    });
  }, [products, searchTerm, debouncedSearchTerm, statusFilter]);

  const { activeCount, archivedCount } = useMemo(() => ({
    activeCount: products.filter(p => p.status === 'active').length,
    archivedCount: products.filter(p => p.status === 'archived').length,
  }), [products]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to load products</h3>
          <p className="text-muted-foreground">There was an error loading your products.</p>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived Products</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{archivedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Product Management</span>
            </CardTitle>
            <Button onClick={() => router.push('/products?modal=add-product')} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </div>

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, description, or color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="archived">Archived Only</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className={product.status === 'archived' ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" style={{ backgroundColor: product.color + '20', color: product.color }}>
                        {product.color}
                      </Badge>
                    </TableCell>
                    <TableCell>${product.price}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? 'secondary' : 'destructive'}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Popover
                        open={openPopover === product.id}
                        onOpenChange={(open) => setOpenPopover(open ? product.id : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-0" align="end">
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start px-3 py-2 h-auto rounded-none"
                              onClick={() => handleEditClick(product)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Product
                            </Button>

                            {product.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start px-3 py-2 h-auto rounded-none"
                                onClick={() => handleArchiveProduct(product.id)}
                                disabled={archiveProductMutation.isPending}
                              >
                                {archiveProductMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Archive className="h-4 w-4 mr-2" />
                                )}
                                {archiveProductMutation.isPending ? 'Archiving...' : 'Archive Product'}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start px-3 py-2 h-auto rounded-none"
                                onClick={() => handleUnarchiveProduct(product.id)}
                                disabled={unarchiveProductMutation.isPending}
                              >
                                {unarchiveProductMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                )}
                                {unarchiveProductMutation.isPending ? 'Unarchiving...' : 'Unarchive Product'}
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No products found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={() => router.push('/products')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Product Name</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-color">Color</Label>
                <Input
                  id="add-color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g. blue, red"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-price">Price ($)</Label>
              <Input
                id="add-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-quantity">Quantity</Label>
              <Input
                id="add-quantity"
                type="number"
                min="0"
                step="1"
                value={formData.meta.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, quantity: parseInt(e.target.value) || 0 } }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-storage-location">Storage Location</Label>
              <Input
                id="add-storage-location"
                value={formData.meta.storage_location}
                onChange={(e) => setFormData(prev => ({ ...prev, meta: { ...prev.meta, storage_location: e.target.value } }))}
                placeholder="e.g. Aisle 3, Warehouse A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-image">Product Image</Label>

              {/* Hidden file input */}
              <Input
                ref={fileInputRef}
                id="add-image"
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
                <Label htmlFor="add-image_url" className="text-sm text-muted-foreground">
                  Or enter image URL manually
                </Label>
                <Input
                  id="add-image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  disabled={!!selectedImage}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => router.push('/products')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProductMutation.isPending || isUploadingImage}>
                {(createProductMutation.isPending || isUploadingImage) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploadingImage ? 'Uploading Image...' :
                  createProductMutation.isPending ? 'Adding Product...' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={() => router.push('/products')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g. blue, red"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Product Image</Label>

              {/* Hidden file input for edit */}
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Image upload area for edit */}
              {!imagePreview && !formData.image_url ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-image')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview || formData.image_url}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                    {(imagePreview || formData.image_url) && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click the X button to remove and upload a different image
                  </p>
                </div>
              )}

              {/* Fallback URL input for edit */}
              <div className="mt-2">
                <Label htmlFor="edit-image_url" className="text-sm text-muted-foreground">
                  Or enter image URL manually
                </Label>
                <Input
                  id="edit-image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  disabled={!!selectedImage}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => router.push('/products')}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProductMutation.isPending || isUploadingImage}>
                {(updateProductMutation.isPending || isUploadingImage) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isUploadingImage ? 'Uploading Image...' :
                  updateProductMutation.isPending ? 'Updating Product...' : 'Update Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}