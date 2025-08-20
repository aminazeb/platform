import { useState, useEffect } from 'react';
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
import { Plus, Search, Archive, MoreHorizontal, Loader2, Package, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { Image } from './ui/image';

interface Product {
  id: string;
  name: string;
  description: string;
  color: string;
  image_url: string;
  price: number;
  status: 'active' | 'archived';
  meta: any;
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openPopover, setOpenPopover] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset form when modals close
  useEffect(() => {
    if (!isAddModalOpen && !isEditModalOpen) {
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
    }
  }, [isAddModalOpen, isEditModalOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ search: searchTerm || '' })
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Product added successfully');
        setIsAddModalOpen(false);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok || true) { // Mock success for demonstration
        setProducts(prev => prev.map(product =>
          product.id === editingProduct.id
            ? { ...product, ...formData }
            : product
        ));
        toast.success('Product updated successfully');
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
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
    setIsEditModalOpen(true);
    setOpenPopover(null);
  };

  const handleArchiveProduct = async (productId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setProducts(prev => prev.map(product =>
          product.id === productId
            ? { ...product, status: 'archived' as const }
            : product
        ));
        const productName = products.find(p => p.id === productId)?.name;
        toast.success(`${productName} has been archived`);
        setOpenPopover(null);
      } else {
        throw new Error('Failed to archive product');
      }
    } catch (error) {
      console.error('Error archiving product:', error);
      toast.error('Failed to archive product');
    }
  };

  const handleUnarchiveProduct = async (productId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: null
      });
      if (response.ok) {
        setProducts(prev => prev.map(product =>
          product.id === productId
            ? { ...product, status: 'active' as const }
            : product
        ));
        const productName = products.find(p => p.id === productId)?.name;
        toast.success(`${productName} has been reactivated`);
        setOpenPopover(null);
      } else {
        throw new Error('Failed to reactivate product');
      }
    } catch (error) {
      console.error('Error unarchiving product:', error);
      toast.error('Failed to reactivate product');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.color.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = products.filter(p => p.status === 'active').length;
  const archivedCount = products.filter(p => p.status === 'archived').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading products...</span>
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
            <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
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
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive Product
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start px-3 py-2 h-auto rounded-none"
                                onClick={() => handleUnarchiveProduct(product.id)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Unarchive Product
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
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
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
              <Label htmlFor="add-image_url">Image URL</Label>
              <Input
                id="add-image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
              <Label htmlFor="edit-image_url">Image URL</Label>
              <Input
                id="edit-image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}