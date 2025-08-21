import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../components/AuthContext';

// Base API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

// Generic API functions
export const api = {
    get: async (endpoint: string) => {
        const url = `${API_BASE}${endpoint}`;
        const response = await fetch(url, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${errorText}`);
        }

        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const url = `${API_BASE}${endpoint}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${errorText}`);
        }

        return response.json();
    },

    put: async (endpoint: string, data: any) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    },

    delete: async (endpoint: string) => {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    },
};

// Custom hooks for specific data
export const useInventory = () => {
    return useQuery({
        queryKey: ['inventory'],
        queryFn: () => api.get('/inventory'),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useProducts = (searchTerm?: string) => {
    return useQuery({
        queryKey: ['products', { search: searchTerm || '' }],
        queryFn: () => api.post('/products/search', { search: searchTerm || '' }),
        staleTime: 5 * 60 * 1000,
    });
};

export const useInventorySearch = (searchTerm?: string) => {
    return useQuery({
        queryKey: ['inventory', { search: searchTerm || '' }],
        queryFn: () => api.post('/inventory/search', { search: searchTerm || '' }),
        staleTime: 5 * 60 * 1000,
    });
};

export const useSales = () => {
    return useQuery({
        queryKey: ['sales'],
        queryFn: () => api.get('/sales'),
        staleTime: 5 * 60 * 1000,
    });
};

// Sales mutation hooks
export const useCreateSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => api.post('/sales', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
        },
    });
};

export const useCreateSalesBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (salesData: any[]) => api.post('/sales/batch', { resources: salesData }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

export const usePurchases = () => {
    return useQuery({
        queryKey: ['purchases'],
        queryFn: () => api.get('/purchases'),
        staleTime: 5 * 60 * 1000,
    });
};

// Mutation hooks
export const useCreateInventory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => api.post('/inventory', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

export const useUpdateInventory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            api.put(`/inventory/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

export const useDeleteInventory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/inventory/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

// Product mutation hooks
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => api.post('/products', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            api.put(`/products/${id}`, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });

            const previousProducts = queryClient.getQueriesData({ queryKey: ['products'] });

            queryClient.setQueriesData({ queryKey: ['products'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((product: any) =>
                        product.id === id
                            ? { ...product, ...data }
                            : product
                    ),
                };
            });

            return { previousProducts };
        },
        onError: (err, variables, context) => {
            if (context?.previousProducts) {
                context.previousProducts.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

export const useArchiveProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/products/${id}`),
        onMutate: async (productId) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });

            const previousProducts = queryClient.getQueriesData({ queryKey: ['products'] });

            queryClient.setQueriesData({ queryKey: ['products'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((product: any) =>
                        product.id === productId
                            ? { ...product, status: 'archived' }
                            : product
                    ),
                };
            });

            return { previousProducts };
        },
        onError: (err, productId, context) => {
            if (context?.previousProducts) {
                context.previousProducts.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

export const useUnarchiveProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.post(`/products/${id}/restore`, null),
        onMutate: async (productId) => {
            await queryClient.cancelQueries({ queryKey: ['products'] });

            const previousProducts = queryClient.getQueriesData({ queryKey: ['products'] });

            queryClient.setQueriesData({ queryKey: ['products'] }, (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((product: any) =>
                        product.id === productId
                            ? { ...product, status: 'active' }
                            : product
                    ),
                };
            });

            return { previousProducts };
        },
        onError: (err, productId, context) => {
            if (context?.previousProducts) {
                context.previousProducts.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

// Purchase mutation hooks
export const useCreatePurchase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => api.post('/purchases', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
        },
    });
};

export const useUpdatePurchase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            api.put(`/purchases/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
        },
    });
};

export const useDeletePurchase = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete(`/purchases/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
        },
    });
};