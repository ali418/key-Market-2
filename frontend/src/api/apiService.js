import axios from 'axios';
import { getToken, getRefreshToken, saveAuthData, clearAuthData } from '../services/authService';

// Configure axios with defaults
axios.defaults.timeout = 15000; // 15 seconds timeout
axios.defaults.timeoutErrorMessage = 'Server request timed out. Please try again later.';

const API_URL = process.env.REACT_APP_API_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3002');

// Simple cache implementation with improved performance
const apiCache = {
  data: {},
  timeouts: {},
  pendingRequests: {}, // Track pending requests to avoid duplicates
  
  // Get cached data if available and not expired
  get(key) {
    if (this.data[key] && this.data[key].expiry > Date.now()) {
      console.log(`Using cached data for: ${key}`);
      return this.data[key].value;
    }
    return null;
  },
  
  // Set data in cache with expiry
  set(key, value, ttlMs = 300000) { // Increased default to 5 minutes TTL
    // Clear any existing timeout for this key
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
    }
    
    this.data[key] = {
      value,
      expiry: Date.now() + ttlMs
    };
    
    // Set timeout to clean up expired cache
    this.timeouts[key] = setTimeout(() => {
      delete this.data[key];
      delete this.timeouts[key];
    }, ttlMs + 1000); // Add 1 second buffer
  },
  
  // Check if request is already pending
  isPending(key) {
    return !!this.pendingRequests[key];
  },
  
  // Set pending request
  setPending(key, promise) {
    this.pendingRequests[key] = promise;
    promise.finally(() => {
      delete this.pendingRequests[key];
    });
    return promise;
  },
  
  // Get pending request
  getPending(key) {
    return this.pendingRequests[key];
  },
  
  // Invalidate specific cache entry
  invalidate(key) {
    delete this.data[key];
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
      delete this.timeouts[key];
    }
  },
  
  // Invalidate all cache entries
  clear() {
    Object.keys(this.timeouts).forEach(key => {
      clearTimeout(this.timeouts[key]);
    });
    this.data = {};
    this.timeouts = {};
    this.pendingRequests = {};
  }
};

// Create axios instance with retry logic
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to create cached API requests
const createCachedRequest = async (cacheKey, requestFn, ttl = 300000) => {
  // Check cache first
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Check if request is already pending
  if (apiCache.isPending(cacheKey)) {
    console.log(`Request already pending for: ${cacheKey}`);
    return apiCache.getPending(cacheKey);
  }
  
  // Create new request
  const requestPromise = requestFn().then(response => {
    // Cache the response
    apiCache.set(cacheKey, response, ttl);
    return response;
  }).catch(error => {
    // Don't cache errors
    throw error;
  });
  
  // Track pending request
  return apiCache.setPending(cacheKey, requestPromise);
};

// Debounce function to limit rapid API calls
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Add request interceptor for authentication and logging
axiosInstance.interceptors.request.use(
  (config) => {
    // Add authentication token to request if available
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  },
);

// Add response interceptor for error handling and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized error (token expired) — skip for auth endpoints
    const isAuthRequest =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/refresh-token') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response && error.response.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // No refresh token available, clear auth data and reject
          clearAuthData();
          return Promise.reject(error);
        }

        // Call the refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        // Save the new tokens
        if (response.data.token && response.data.refreshToken) {
          saveAuthData(response.data.token, response.data.refreshToken, response.data.user);

          // Update the failed request with the new token and retry
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, clear auth data and reject
        console.error('Token refresh failed:', refreshError);
        clearAuthData();
        return Promise.reject(error);
      }
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network Error: Unable to connect to the server. Please check your internet connection or the server status.');
      error.friendlyMessage = 'Unable to connect to the server. Please check your internet connection or try again later.';
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Timeout Error: The request took too long to complete.');
      error.friendlyMessage = 'The request took too long to complete. Please try again later.';
    }

    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error(`Server Error: ${error.response.status} ${error.response.statusText}`);
      error.friendlyMessage = 'The server encountered an error. Please try again later.';
    }

    // Handle client errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      console.error(`Client Error: ${error.response.status} ${error.response.statusText}`);
      error.friendlyMessage = (error.response.data && (error.response.data.error?.message || error.response.data.message)) || 'An error occurred with your request. Please check your inputs and try again.';
    }

    return Promise.reject(error);
  },
);

const apiService = {
  // Auth
  async login(username, password) {
    try {
      console.log('Attempting login with:', { username });
      // تصحيح المسار ليتطابق مع الواجهة الخلفية - تم إزالة /api/v1 لتجنب التكرار
      console.log('Login URL:', `${API_URL}/auth/login`); // إضافة سجل للتحقق من عنوان URL
      const response = await axiosInstance.post('/auth/login', { username, password });
      console.log('Login successful:', response.data);
      return {
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      };
    } catch (error) {
      console.error('Error logging in:', error.message || error);
      console.error('Full error details:', error.response?.data || error);
      throw new Error(error.friendlyMessage || error.response?.data?.error?.message || error.response?.data?.message || 'Login failed. Please try again.');
    }
  },

  // Products
  getProducts: async () => {
    return createCachedRequest('products', async () => {
      try {
        const response = await axiosInstance.get('/products');
        console.log('Raw API response:', response);
        console.log('Response data structure:', response.data);
        // Ensure we're returning the array of products
        // The backend returns { success: true, count: X, data: [...products] }
        const products = response.data.data || [];
        console.log('Processed products:', products);
        return products;
      } catch (error) {
        console.error('Error fetching products:', error);
        // Add friendly message to the error
        error.userMessage = error.friendlyMessage || 'Failed to load products. Please try again later.';
        throw error;
      }
    }, 180000); // Cache for 3 minutes
  },

  // Search products with optional filters
  searchProducts: async ({ q, barcode, is_online } = {}) => {
    try {
      const response = await axiosInstance.get('/products', {
        params: {
          q,
          barcode,
          is_online,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      error.userMessage = error.friendlyMessage || 'Failed to search products. Please try again later.';
      throw error;
    }
  },

  // Check if barcode exists
  checkBarcodeExists: async (barcode, excludeId = null) => {
    try {
      const response = await axiosInstance.get('/products', { params: { barcode } });
      const list = response.data?.data || [];
      return list.some((p) => String(p.id) !== String(excludeId));
    } catch (error) {
      console.error('Error checking barcode existence:', error);
      error.userMessage = error.friendlyMessage || 'Failed to check barcode. Please try again later.';
      throw error;
    }
  },

  // Generate unique barcode
  generateUniqueBarcode: async () => {
    try {
      // Get all products to check against existing barcodes
      const products = await apiService.getProducts();
      const existingBarcodes = products.map((product) => product.barcode).filter(Boolean);

      // Generate a new barcode and check if it already exists
      let newBarcode;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10; // Prevent infinite loop

      while (!isUnique && attempts < maxAttempts) {
        // Generate a random 12-digit barcode
        newBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
        isUnique = !existingBarcodes.includes(newBarcode);
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Could not generate a unique barcode after multiple attempts');
      }

      return newBarcode;
    } catch (error) {
      console.error('Error generating unique barcode:', error);
      error.userMessage = error.friendlyMessage || 'Failed to generate unique barcode. Please try again later.';
      throw error;
    }
  },

  getProductById: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      // The backend returns { success: true, data: {...product} }
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load product details. Please try again later.';
      throw error;
    }
  },

  // Upload a file to the backend uploads endpoint
  uploadFile: async (file) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await axiosInstance.post('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data || {};
    } catch (error) {
      console.error('Error uploading file:', error);
      error.userMessage = error.friendlyMessage || 'Failed to upload file. Please try again later.';
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      // The backend returns { success: true, data: {...product} }
      return response.data.data || {};
    } catch (error) {
      console.error('Error creating product:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create product. Please check your inputs and try again.';
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, productData);
      // The backend returns { success: true, data: {...product} }
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update product. Please check your inputs and try again.';
      throw error;
    }
  },

  // Toggle product online visibility
  setProductOnline: async (id, isOnline) => {
    try {
      const response = await axiosInstance.put(`/products/${id}`, { is_online: !!isOnline });
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating product online status ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update product online status. Please try again later.';
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await axiosInstance.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete product. Please try again later.';
      throw error;
    }
  },

  // Categories
  getCategories: async () => {
    return createCachedRequest('categories', async () => {
      try {
        const response = await axiosInstance.get('/categories');
        return response.data.data || response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        error.userMessage = error.friendlyMessage || 'Failed to load categories. Please try again later.';
        throw error;
      }
    }, 300000); // Cache for 5 minutes
  },

  getCategoryById: async (id) => {
    try {
      const response = await axiosInstance.get(`/categories/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load category details. Please try again later.';
      throw error;
    }
  },

  createCategory: async (categoryData) => {
    try {
      const response = await axiosInstance.post('/categories', categoryData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create category. Please check your inputs and try again.';
      throw error;
    }
  },

  updateCategory: async (id, categoryData) => {
    try {
      const response = await axiosInstance.put(`/categories/${id}`, categoryData);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update category. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axiosInstance.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete category. Please try again later.';
      throw error;
    }
  },

  // Sales API methods
  getSales: async () => {
    return createCachedRequest('sales', async () => {
      try {
        const response = await axiosInstance.get('/sales');
        console.log('Raw sales API response:', response);
        // The backend returns { success: true, count: X, data: [...sales] }
        const sales = response.data.data || [];
        console.log('Processed sales:', sales);
        return sales;
      } catch (error) {
        console.error('Error fetching sales:', error);
        error.userMessage = error.friendlyMessage || 'Failed to load sales. Please try again later.';
        throw error;
      }
    }, 120000); // Cache for 2 minutes
  },

  getSaleById: async (id) => {
    try {
      const response = await axiosInstance.get(`/sales/${id}`);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching sale ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load sale details. Please try again later.';
      throw error;
    }
  },

  createSale: async (saleData) => {
    try {
      const response = await axiosInstance.post('/sales', saleData);
      return response.data.data || {};
    } catch (error) {
      console.error('Error creating sale:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create sale. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteSale: async (id) => {
    try {
      const response = await axiosInstance.delete(`/sales/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting sale ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete sale. Please try again later.';
      throw error;
    }
  },

  updateSale: async (id, saleData) => {
    try {
      const response = await axiosInstance.put(`/sales/${id}`, saleData);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating sale ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update sale. Please check your inputs and try again.';
      throw error;
    }
  },

  // Customers API methods
  getCustomers: async () => {
    return createCachedRequest('customers', async () => {
      try {
        const response = await axiosInstance.get('/customers');
        return response.data.data || response.data;
      } catch (error) {
        console.error('Error fetching customers:', error);
        error.userMessage = error.friendlyMessage || 'Failed to load customers. Please try again later.';
        throw error;
      }
    }, 240000); // Cache for 4 minutes
  },

  getCustomerById: async (id) => {
    try {
      const response = await axiosInstance.get(`/customers/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching customer ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load customer. Please try again later.';
      throw error;
    }
  },

  createCustomer: async (customerData) => {
    try {
      const response = await axiosInstance.post('/customers', customerData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating customer:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create customer. Please check your inputs and try again.';
      throw error;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      const response = await axiosInstance.put(`/customers/${id}`, customerData);
      return response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating customer ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update customer. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const response = await axiosInstance.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting customer ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete customer. Please try again later.';
      throw error;
    }
  },

  // Get customer sales history
  getCustomerSales: async (id) => {
    try {
      const response = await axiosInstance.get(`/customers/${id}/sales`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching customer sales ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load customer sales history. Please try again later.';
      throw error;
    }
  },

  // File Upload API methods
  uploadFile: async (file) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Set headers for file upload
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axiosInstance.post('/uploads', formData, config);
      return response.data.data || {};
    } catch (error) {
      console.error('Error uploading file:', error);
      error.userMessage = error.friendlyMessage || 'Failed to upload file. Please try again later.';
      throw error;
    }
  },

  deleteFile: async (fileName) => {
    try {
      const response = await axiosInstance.delete(`/uploads/${fileName}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete file. Please try again later.';
      throw error;
    }
  },

  // Helper methods
  isServerRunning: async () => {
    try {
      await axiosInstance.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  },

  // Inventory API methods
  getInventory: async () => {
    return createCachedRequest('inventory', async () => {
      try {
        const response = await axiosInstance.get('/inventory');
        console.log('Raw inventory API response:', response);
        // The backend returns { success: true, count: X, data: [...inventory] }
        const inventory = response.data.data || [];
        console.log('Processed inventory:', inventory);
        return inventory;
      } catch (error) {
        console.error('Error fetching inventory:', error);
        error.userMessage = error.friendlyMessage || 'Failed to load inventory. Please try again later.';
        throw error;
      }
    }, 150000); // Cache for 2.5 minutes
  },

  getInventoryById: async (id) => {
    try {
      const response = await axiosInstance.get(`/inventory/${id}`);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error fetching inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load inventory details. Please try again later.';
      throw error;
    }
  },

  createInventory: async (inventoryData) => {
    try {
      const response = await axiosInstance.post('/inventory', inventoryData);
      return response.data.data || {};
    } catch (error) {
      console.error('Error creating inventory:', error);
      error.userMessage = error.friendlyMessage || 'Failed to create inventory. Please check your inputs and try again.';
      throw error;
    }
  },

  updateInventory: async (id, inventoryData) => {
    try {
      const response = await axiosInstance.put(`/inventory/${id}`, inventoryData);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error updating inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to update inventory. Please check your inputs and try again.';
      throw error;
    }
  },

  adjustInventory: async (id, adjustmentData) => {
    try {
      const response = await axiosInstance.patch(`/inventory/${id}/adjust`, adjustmentData);
      return response.data.data || {};
    } catch (error) {
      console.error(`Error adjusting inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to adjust inventory. Please check your inputs and try again.';
      throw error;
    }
  },

  deleteInventory: async (id) => {
    try {
      const response = await axiosInstance.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting inventory ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete inventory. Please try again later.';
      throw error;
    }
  },

  getInventoryTransactions: async (id) => {
    try {
      const response = await axiosInstance.get(`/inventory/${id}/transactions`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Error fetching inventory transactions for ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to load inventory transactions. Please try again later.';
      throw error;
    }
  },

  // Fallback data methods
  getFallbackProducts: () => [
    // Empty array as fallback
  ],

  getFallbackCategories: () => [
    { id: 1, name: 'All' },
  ],
  // Reports API methods
  getLowStockProducts: async () => {
    try {
      const response = await axiosInstance.get('/reports/low-stock');
      console.log('Raw low stock API response:', response);
      // The backend returns { success: true, count: X, data: [...items] }
      const lowStockItems = response.data.data || [];
      console.log('Processed low stock items:', lowStockItems);
      return lowStockItems;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load low stock products. Please try again later.';
      throw error;
    }
  },

  getSalesReport: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axiosInstance.get(`/reports/sales?${params.toString()}`);
      console.log('Raw sales report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching sales report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load sales report. Please try again later.';
      throw error;
    }
  },

  getRevenueReport: async (startDate, endDate, groupBy = 'day') => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('groupBy', groupBy);

      const response = await axiosInstance.get(`/reports/revenue?${params.toString()}`);
      console.log('Raw revenue report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load revenue report. Please try again later.';
      throw error;
    }
  },

  getInventoryReport: async () => {
    try {
      const response = await axiosInstance.get('/reports/inventory');
      console.log('Raw inventory report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load inventory report. Please try again later.';
      throw error;
    }
  },

  getTopSellingProducts: async (startDate, endDate, limit = 10) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', limit.toString());

      const response = await axiosInstance.get(`/reports/top-products?${params.toString()}`);
      console.log('Raw top products API response:', response);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load top selling products. Please try again later.';
      throw error;
    }
  },

  getSalesByCategory: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axiosInstance.get(`/reports/sales-by-category?${params.toString()}`);
      console.log('Raw sales by category API response:', response);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching sales by category:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load sales by category. Please try again later.';
      throw error;
    }
  },

  getCustomerReport: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axiosInstance.get(`/reports/customers?${params.toString()}`);
      console.log('Raw customer report API response:', response);
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching customer report:', error);
      error.userMessage = error.friendlyMessage || 'Failed to load customer report. Please try again later.';
      throw error;
    }
  },

  // Notifications API methods
  getNotifications: async () => {
    return createCachedRequest('notifications', async () => {
      try {
        const response = await axiosInstance.get('/notifications');
        console.log('Raw notifications API response:', response);
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        error.userMessage = error.friendlyMessage || 'Failed to load notifications. Please try again later.';
        throw error;
      }
    }, 60000); // Cache for 1 minute (notifications need to be fresh)
  },

  markNotificationAsRead: async (id) => {
    try {
      const response = await axiosInstance.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to mark notification as read.';
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await axiosInstance.patch('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      error.userMessage = error.friendlyMessage || 'Failed to mark all notifications as read.';
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await axiosInstance.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      error.userMessage = error.friendlyMessage || 'Failed to delete notification.';
      throw error;
    }
  },

  getUnreadNotificationsCount: async () => {
    return createCachedRequest('unread-notifications-count', async () => {
      try {
        console.log('API Request: GET /notifications/unread-count');
        const response = await axiosInstance.get('/notifications/unread-count');
        console.log('Raw unread notifications count API response:', response);
        
        // The backend returns { success: true, count: X }
        const count = response.data.count || 0;
        console.log('Processed unread notifications count:', count);
        return count;
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
        error.userMessage = error.friendlyMessage || 'Failed to load unread notifications count. Please try again later.';
        throw error;
      }
    }, 30000); // Cache for 30 seconds (count needs to be very fresh)
  },

  // Settings
  getSettings: async () => {
    return createCachedRequest('settings', async () => {
      try {
        console.log('API Request: GET /settings');
        const response = await axiosInstance.get('/settings');
        console.log('Raw settings API response:', response);
        
        // The backend returns { success: true, data: {...settings} }
        const settings = response.data.data || {};
        console.log('Processed settings:', settings);
        return settings;
      } catch (error) {
        console.error('Error fetching settings:', error);
        error.userMessage = error.friendlyMessage || 'Failed to load settings. Please try again later.';
        throw error;
      }
    }, 600000); // Cache for 10 minutes (settings don't change often)
  },

  updateSettings: async (settings) => {
    try {
      const response = await axiosInstance.put('/settings', settings);
      // Invalidate settings cache after update
      apiCache.invalidate('settings');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      error.userMessage = error.friendlyMessage || 'Failed to save settings.';
      throw error;
    }
  },
  async getProfile() {
    try {
      const response = await axiosInstance.get('/users/profile');
      return response.data.data || {};
    } catch (error) {
      console.error('Error fetching profile:', error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch profile. Please try again.');
    }
  },

  // New: Login history for current user
  async getMyLoginHistory({ page = 1, limit = 20 } = {}) {
    try {
      const response = await axiosInstance.get('/users/profile/login-history', { params: { page, limit } });
      // backend returns { success, data: [], pagination }
      return response.data;
    } catch (error) {
      console.error('Error fetching my login history:', error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch login history.');
    }
  },

  // New: Login history for a specific user (admin/self)
  async getUserLoginHistory(userId, { page = 1, limit = 20 } = {}) {
    try {
      const response = await axiosInstance.get(`/users/${userId}/login-history`, { params: { page, limit } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching login history for user ${userId}:`, error.message || error);
      throw new Error(error.userMessage || 'Failed to fetch user login history.');
    }
  },

  async updateProfile(id, profileData) {
    try {
      const response = await axiosInstance.put(`/users/${id}`, profileData);
      return response.data.data || {};
    } catch (error) {
      console.error('Error updating profile:', error.message || error);
      throw new Error(error.userMessage || 'Failed to update profile. Please try again.');
    }
  },

  async changePassword(id, passwordData) {
    try {
      const response = await axiosInstance.patch(`/users/${id}/change-password`, passwordData);
      return response.data || {};
    } catch (error) {
      console.error('Error changing password:', error.message || error);
      throw new Error(error.userMessage || 'Failed to change password. Please try again.');
    }
  },

  // User Management APIs
  async getUsers() {
    try {
      const response = await axiosInstance.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUserById(id) {
    try {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const response = await axiosInstance.post('/users', userData);
      // Invalidate users cache
      apiCache.invalidate('users');
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await axiosInstance.put(`/users/${id}`, userData);
      // Invalidate users cache
      apiCache.invalidate('users');
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id) {
    try {
      const response = await axiosInstance.delete(`/users/${id}`);
      // Invalidate users cache
      apiCache.invalidate('users');
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },
};

export default apiService;