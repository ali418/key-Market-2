import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrency, selectStoreSettings } from '../../redux/slices/settingsSlice';
import { selectUser } from '../../redux/slices/authSlice';
import apiService from '../../api/apiService';
import { useCurrencyFormatter } from '../../utils/currencyFormatter';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Person,
  Receipt,
  LocalOffer,
  Payment,
  Print,
  Save,
  Cancel,
  Email,
  Sms,
  Category,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import A4InvoiceGenerator from '../../components/invoice/A4InvoiceGenerator';
import SimpleInvoiceButton from '../../components/invoice/SimpleInvoiceButton';

// Placeholder image for products without images
const placeholderImage = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>
  <rect width='100%' height='100%' fill='%23f5f5f5'/>
  <g fill='none' stroke='%23cccccc' stroke-width='4'>
    <rect x='50' y='40' width='300' height='220' rx='12' ry='12'/>
    <circle cx='200' cy='150' r='50'/>
  </g>
  <text x='200' y='260' font-family='Arial' font-size='18' fill='%23999999' text-anchor='middle'>No Image</text>
</svg>`;

// Helper to build a usable image URL for products
const getProductImageUrl = (product) => {
  // Prefer database field image_url
  const raw = product?.image_url || product?.image || product?.imageUrl || '';
  const img = typeof raw === 'string' ? raw.trim() : '';
  if (!img) return placeholderImage;

  // Absolute URL
  if (/^https?:\/\//i.test(img)) return img;

  // Normalize uploads path and use relative URL (works with proxy in dev and backend in prod)
  if (img.startsWith('/uploads/')) return img;
  if (img.startsWith('uploads/')) return '/' + img;

  // Likely a filename
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(img)) {
    return `/uploads/${img}`;
  }

  return placeholderImage;
};

// Demo data for categories
const demoCategories = [
  { id: 1, name: 'all' },
  { id: 2, name: 'fruits' },
  { id: 3, name: 'vegetables' },
  { id: 4, name: 'dairy' },
  { id: 5, name: 'bakery' },
  { id: 6, name: 'meat' },
  { id: 7, name: 'grains' },
];

// Demo data for customers
const demoCustomers = [
  { id: 1, name: 'walkInCustomer', phone: '', email: '' },
  { id: 2, name: 'Ahmed Ali', phone: '0123456789', email: 'ahmed@example.com' },
  { id: 3, name: 'Sara Mohamed', phone: '0123456788', email: 'sara@example.com' },
  { id: 4, name: 'Khaled Ibrahim', phone: '0123456787', email: 'khaled@example.com' },
];

// Demo data for payment methods
const paymentMethods = [
  { id: 1, name: 'cash' },
  { id: 2, name: 'card' },
  { id: 3, name: 'bankTransfer' },
];

const POS = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currency = useSelector(selectCurrency);
  const storeSettings = useSelector(selectStoreSettings);
  const currentUser = useSelector(selectUser);
  const { formatCurrency, getCurrencySymbol } = useCurrencyFormatter();

  // Set document title
  useEffect(() => {
    document.title = t('pageTitle.pos');
  }, [i18n.language, t]);

  // State for cart items
  const [cartItems, setCartItems] = useState([]);
  
  // State for products and categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([{ id: 1, name: 'all' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for product filtering and barcode scanning
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(1); // Default to 'All'
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  // State for customer selection
  const [selectedCustomer, setSelectedCustomer] = useState({ id: null, name: 'walkInCustomer', phone: '', email: '' });
  const [customerOptions, setCustomerOptions] = useState([{ id: null, name: 'walkInCustomer', phone: '', email: '' }]);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // State for payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(1); // Default to 'Cash'
  const [amountPaid, setAmountPaid] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // State for receipt dialog
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  
  // State for receipt data to show server receipt number
  const [receiptData, setReceiptData] = useState(null);

  // Toggle applying tax in totals
  const [applyTax, setApplyTax] = useState(true);

  // Auto-print receipt when dialog opens if enabled in settings
  useEffect(() => {
    if (receiptDialogOpen && storeSettings?.receiptPrintAutomatically) {
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.error('Auto print failed:', e);
        }
        // close/complete after printing
        setTimeout(() => {
          completeSale();
        }, 500);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [receiptDialogOpen, storeSettings?.receiptPrintAutomatically]);

  // Helper function to ensure number conversion
  const parsePrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? 0 : numPrice;
  };
  
  // Calculate totals with safe number conversion
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = parsePrice(item.price);
    return sum + (itemPrice * item.quantity);
  }, 0);
  const taxRatePercent = Number(storeSettings?.taxRate) || 0;
  const tax = applyTax ? subtotal * (taxRatePercent / 100) : 0;
  const discount = discountAmount ? parseFloat(discountAmount) || 0 : 0;
  const total = subtotal + tax - discount;
  const change = amountPaid ? parseFloat(amountPaid) - total : 0;
  
  // Fetch products and categories from API
  useEffect(() => {
    // Function to fetch products and categories
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch products directly
        const productsData = await apiService.getProducts();
        console.log('Products data:', productsData);
        const safeProducts = Array.isArray(productsData) ? productsData.map(product => ({
          ...product,
          price: parsePrice(product.price), // Ensure price is a number
          stock: parseInt(product.stock) || 0 // Ensure stock is a number
        })) : [];
        setProducts(safeProducts);
        
        // Fetch categories (gracefully fallback to just 'All' if it fails)
        let allCategories = [{ id: 1, name: t('all') }];
        try {
          const categoriesData = await apiService.getCategories();
          console.log('Categories data:', categoriesData);
          allCategories = allCategories.concat(categoriesData || []);
        } catch (catErr) {
          console.warn('Fetching categories failed, using default only', catErr);
        }
        setCategories(allCategories);

        // Fetch customers
        try {
          setCustomersLoading(true);
          const customers = await apiService.getCustomers();
          const normalized = (Array.isArray(customers) ? customers : []).map((c) => ({
            id: c.id || c.customerId || null,
            name: c.name || c.fullName || t('notAvailable'),
            phone: c.phone || c.phoneNumber || '',
            email: c.email || '',
          })).filter(c => c.id);
          setCustomerOptions([{ id: null, name: t('sales:walkInCustomer') }, ...normalized]);
        } catch (custErr) {
          console.warn('Fetching customers failed, using demo list', custErr);
        } finally {
          setCustomersLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.userMessage || t('error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter products based on search query and selected category
  useEffect(() => {
    let filtered = products;
    
    // Filter by search query (name, description, or barcode)
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id?.toString().includes(searchQuery) // Use ID as barcode for now
      );
    }
    
    // Filter by category
    if (selectedCategory !== 1) { // If not 'All'
      const categoryName = categories.find(cat => cat.id === selectedCategory)?.name;
      filtered = filtered.filter(product => 
        product.category?.name === categoryName || 
        product.category === categoryName
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products, categories]);
  
  // State for barcode scanning throttling
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanCooldown, setScanCooldown] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [blockedScans, setBlockedScans] = useState(0);
  const SCAN_COOLDOWN_MS = 500; // 500ms cooldown between scans

  // Handle barcode scanning with throttling
  const handleBarcodeSearch = (barcode) => {
    if (!barcode || barcode.trim() === '') {
      console.log('Empty barcode input, ignoring');
      return;
    }

    // Check if we're in cooldown period
    const currentTime = Date.now();
    if (scanCooldown || (currentTime - lastScanTime < SCAN_COOLDOWN_MS)) {
      console.log('Scan blocked due to cooldown period');
      setBlockedScans(prev => prev + 1);
      toast.warning('يرجى الانتظار قليلاً بين المسحات');
      return;
    }

    // Set cooldown and increment scan count
    setScanCooldown(true);
    setLastScanTime(currentTime);
    setScanCount(prev => prev + 1);
    
    console.log('Searching for barcode:', barcode);
    console.log('Available products:', products);
    
    // Try to find product by barcode, ID, SKU or name
    let product = null;
    
    // First try exact matches
    product = products.find(p => {
      // Convert values to string for comparison and handle null/undefined
      const productBarcode = p.barcode?.toString() || '';
      const productId = p.id?.toString() || '';
      const productSku = p.sku?.toString() || '';
      
      return (
        (productBarcode && productBarcode === barcode) ||
        (productId && productId === barcode) ||
        (productSku && productSku === barcode)
      );
    });
    
    // If not found, try case-insensitive matches
    if (!product) {
      const lowerBarcode = barcode.toLowerCase();
      product = products.find(p => {
        const productBarcode = (p.barcode?.toString() || '').toLowerCase();
        const productId = (p.id?.toString() || '').toLowerCase();
        const productSku = (p.sku?.toString() || '').toLowerCase();
        const productName = (p.name?.toString() || '').toLowerCase();
        
        return (
          productBarcode === lowerBarcode ||
          productId === lowerBarcode ||
          productSku === lowerBarcode ||
          // Then check if barcode is contained in the name (less reliable)
          productName.includes(lowerBarcode)
        );
      });
    }
    
    if (product) {
      console.log('Product found:', product);
      addToCart(product);
      setBarcodeInput(''); // Clear barcode input after successful scan
      // Show success toast
      toast.success(`${product.name} تم إضافته للسلة`);
    } else {
      console.error('Product not found for barcode:', barcode);
      toast.error('المنتج غير موجود');
      setBarcodeInput('');
      
      // Suggest running debug
      if (process.env.NODE_ENV === 'development') {
        toast.info('اضغط Ctrl+Shift+B لتشخيص الباركود');
      }
    }

    // Clear cooldown after delay
    setTimeout(() => {
      setScanCooldown(false);
    }, SCAN_COOLDOWN_MS);
  };
  
  // Helper function to normalize barcode input
  const normalizeBarcode = (input) => {
    // Remove any non-alphanumeric characters that might be added by scanner
    return input.replace(/[^a-zA-Z0-9]/g, '');
  };
  
  // Handle Enter key for barcode input
  const handleBarcodeKeyPress = (event) => {
    if (event.key === 'Enter') {
      const normalizedBarcode = normalizeBarcode(barcodeInput);
      console.log('Manual barcode input:', normalizedBarcode);
      handleBarcodeSearch(normalizedBarcode);
    }
  };
  
  // Auto-detect barcode scanner input with improved throttling
  // Most barcode scanners act as keyboard input devices and append Enter key after scan
  const [lastInputTime, setLastInputTime] = useState(0);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [lastProcessedBarcode, setLastProcessedBarcode] = useState('');
  
  // Setup barcode scanner detection
  useEffect(() => {
    // Barcode scanners typically input characters rapidly
    const BARCODE_INPUT_TIMEOUT = 150; // milliseconds between inputs (increased for more reliability)
    
    const handleKeyDown = (event) => {
      const currentTime = new Date().getTime();
      const keyChar = event.key;
      
      // If it's a printable character
      if (keyChar.length === 1 || keyChar === 'Enter') {
        // Check if this is likely from a scanner (inputs come very quickly)
        if (currentTime - lastInputTime <= BARCODE_INPUT_TIMEOUT || barcodeBuffer === '') {
          // This is part of a barcode scan
          if (keyChar === 'Enter') {
            // End of barcode input - process the barcode
            if (barcodeBuffer && barcodeBuffer !== lastProcessedBarcode) {
              console.log('Barcode scan complete:', barcodeBuffer);
              setScannerActive(false);
              // Normalize and process the barcode
              const normalizedBarcode = normalizeBarcode(barcodeBuffer);
              console.log('Normalized barcode:', normalizedBarcode);
              
              // Check if this is the same barcode as last processed (avoid duplicates)
              if (normalizedBarcode !== lastProcessedBarcode) {
                setLastProcessedBarcode(normalizedBarcode);
                handleBarcodeSearch(normalizedBarcode);
                
                // Clear the last processed barcode after a delay to allow re-scanning
                setTimeout(() => {
                  setLastProcessedBarcode('');
                }, 2000); // 2 seconds
              } else {
                console.log('Duplicate barcode ignored:', normalizedBarcode);
                toast.info('تم مسح نفس الباركود مؤخراً');
              }
              
              setBarcodeBuffer('');
              // Prevent default to avoid form submissions
              event.preventDefault();
            }
          } else {
            // Add character to buffer
            if (!scannerActive && barcodeBuffer === '') {
              console.log('Barcode scanner detected, starting to capture');
              setScannerActive(true);
            }
            setBarcodeBuffer(prev => prev + keyChar);
          }
          setLastInputTime(currentTime);
        } else {
          // Too much time passed, reset the buffer
          if (keyChar === 'Enter') {
            // Just an Enter key press
            setBarcodeBuffer('');
            setScannerActive(false);
          } else {
            // Start a new potential barcode
            console.log('Starting new barcode capture');
            setBarcodeBuffer(keyChar);
            setLastInputTime(currentTime);
            setScannerActive(true);
          }
        }
      }
    };
    
    // Add event listener to the whole document to catch barcode scanner input
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [lastInputTime, barcodeBuffer, handleBarcodeSearch, scannerActive, lastProcessedBarcode]);
  
  // Debug function to help troubleshoot barcode scanning issues
  const debugBarcode = () => {
    console.log('=== Barcode Scanner Debug Info ===');
    console.log('Products loaded:', products.length);
    console.log('Sample product data:', products.length > 0 ? products[0] : 'No products');
    console.log('Product fields available:', products.length > 0 ? Object.keys(products[0]) : 'No products');
    console.log('Scanner active:', scannerActive);
    console.log('Current barcode buffer:', barcodeBuffer);
    console.log('Current manual input:', barcodeInput);
    
    // Show first 5 products for debugging
    console.log('First 5 products:');
    products.slice(0, 5).forEach((p, index) => {
      console.log(`Product ${index + 1}:`, {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        sku: p.sku
      });
    });
    
    // Test a few sample barcodes against the products
    if (products.length > 0) {
      const testBarcodes = [
        products[0].id?.toString(),
        products[0].barcode?.toString(),
        products[0].sku?.toString(),
        barcodeInput, // Current manual input
        '12345' // Random test barcode
      ].filter(Boolean); // Remove null/undefined values
      
      console.log('Testing sample barcodes:');
      testBarcodes.forEach(code => {
        if (!code) return;
        
        // Test with exact match
        const foundExact = products.find(p => 
          (p.barcode && p.barcode.toString() === code) ||
          (p.id && p.id.toString() === code) ||
          (p.sku && p.sku.toString() === code)
        );
        
        // Test with normalized barcode
        const normalizedCode = normalizeBarcode(code);
        const foundNormalized = normalizedCode !== code ? 
          products.find(p => 
            (p.barcode && normalizeBarcode(p.barcode.toString()) === normalizedCode) ||
            (p.id && normalizeBarcode(p.id.toString()) === normalizedCode) ||
            (p.sku && normalizeBarcode(p.sku.toString()) === normalizedCode)
          ) : null;
        
        console.log(`Test barcode ${code}:`);
        console.log(`  - Exact match: ${foundExact ? 'FOUND (' + foundExact.name + ')' : 'NOT FOUND'}`);
        if (normalizedCode !== code) {
          console.log(`  - Normalized (${normalizedCode}): ${foundNormalized ? 'FOUND (' + foundNormalized.name + ')' : 'NOT FOUND'}`);
        }
      });
    }
    
    // Display toast message to user indicating debug info is in console
    toast.info(t('Debug info in console (Press F12 to view)'));
  };
  
  // Add debug button in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const handleDebugKey = (e) => {
        // Ctrl+Shift+B to trigger debug
        if (e.ctrlKey && e.shiftKey && e.key === 'B') {
          debugBarcode();
        }
      };
      
      window.addEventListener('keydown', handleDebugKey);
      return () => window.removeEventListener('keydown', handleDebugKey);
    }
  }, [products]);
  
  // Add scanner indicator animation
  useEffect(() => {
    // Add keyframe animation for scanner indicator
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      .scanner-active {
        animation: pulse 1.5s infinite;
        background-color: rgba(25, 118, 210, 0.1);
        border-radius: 4px;
        padding: 2px 8px;
        display: inline-flex;
        align-items: center;
        font-size: 0.75rem;
        font-weight: bold;
        color: #1976d2;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Add product to cart with safe price conversion
  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        // If item already exists, increase quantity
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item with quantity 1 and ensure price is a number
        return [...prevItems, { 
          ...product, 
          quantity: 1,
          price: parsePrice(product.price) // Ensure price is number
        }];
      }
    });
  };
  
  // Remove product from cart
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };
  
  // Update product quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };
  
  // Handle payment
  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // Build sale payload according to backend requirements
      const items = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.price) || 0,
        discount: 0,
        notes: undefined,
      }));

      const methodName = paymentMethods.find(m => m.id === paymentMethod)?.name?.toLowerCase();
      // Map UI methods to backend ENUM: cash, credit_card, debit_card, mobile_payment, other
      let normalizedMethod = 'cash';
      if (methodName?.includes('card')) normalizedMethod = 'credit_card';
      else if (methodName?.includes('cash')) normalizedMethod = 'cash';
      else if (methodName?.includes('bank')) normalizedMethod = 'other';
      else normalizedMethod = 'other';
      
      // Only send customerId if it's a valid UUID-like string
      const customerIdValue = typeof selectedCustomer?.id === 'string' && selectedCustomer.id.match(/^[0-9a-fA-F-]{36}$/)
        ? selectedCustomer.id
        : undefined;

      const salePayload = {
        customerId: customerIdValue,
        items,
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(tax.toFixed(2)),
        discountAmount: parseFloat((discountAmount || 0)) || 0,
        totalAmount: parseFloat(total.toFixed(2)),
        paymentMethod: normalizedMethod,
        paymentStatus: 'paid',
        notes: undefined,
      };

      // Call API to create sale
      const created = await apiService.createSale(salePayload);
      console.log('Sale created:', created);

      // Store created sale to use receiptNumber
      const createdSale = created?.data || created; 
      setReceiptData({
        receiptNumber: createdSale?.receiptNumber,
        createdSale,
      });
      // Dispatch global event to refresh Sales/Invoices lists instantly
      try {
        window.dispatchEvent(new CustomEvent('sales:updated', { detail: createdSale }));
      } catch (e) {
        console.warn('Failed to dispatch sales:updated event', e);
      }
      
      setPaymentLoading(false);
      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);
    } catch (err) {
      console.error('Failed to complete payment:', err);
      alert(err.userMessage || err.friendlyMessage || t('sales:errors.paymentFailed'));
      setPaymentLoading(false);
    }
  };
  
  // Handle completing the sale
  const completeSale = () => {
    // Reset everything
    setCartItems([]);
    setSelectedCustomer(demoCustomers[0]);
    setSearchQuery('');
    setSelectedCategory(1);
    setAmountPaid('');
    setDiscountAmount('');
    setReceiptDialogOpen(false);
    
    // Reset scanner statistics
    setScanCount(0);
    setBlockedScans(0);
    setLastProcessedBarcode('');

    // Navigate to sales page to view the new record
    navigate('/sales');
  };
  
  // Handle canceling the sale
  const cancelSale = () => {
    if (cartItems.length === 0) return;
    
    if (window.confirm(t('sales:confirmDeleteSale'))) {
      setCartItems([]);
      setSelectedCustomer(demoCustomers[0]);
      
      // Reset scanner statistics
      setScanCount(0);
      setBlockedScans(0);
      setLastProcessedBarcode('');
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        {t('sales:pointOfSale')}
      </Typography>
      
      <Grid container spacing={2}>
        {/* Left side - Products */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            {/* Search and category filter */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder={t('sales:searchProduct')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              {/* Barcode input */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="امسح/ادخل الباركود أو رقم المنتج"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyPress}
                  disabled={Date.now() - lastScanTime < SCAN_COOLDOWN_MS}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: scannerActive ? '#e8f5e8' : 
                                     (Date.now() - lastScanTime < SCAN_COOLDOWN_MS) ? '#fff3e0' : 'white',
                      '& fieldset': {
                        borderColor: scannerActive ? '#4caf50' : 
                                   (Date.now() - lastScanTime < SCAN_COOLDOWN_MS) ? '#ff9800' : undefined,
                        borderWidth: scannerActive || (Date.now() - lastScanTime < SCAN_COOLDOWN_MS) ? 2 : 1,
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocalOffer color={
                          scannerActive ? 'success' : 
                          (Date.now() - lastScanTime < SCAN_COOLDOWN_MS) ? 'warning' : 'action'
                        } />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {scannerActive && (
                          <Chip 
                            label="الماسح نشط" 
                            color="success" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                        {Date.now() - lastScanTime < SCAN_COOLDOWN_MS && !scannerActive && (
                          <Chip 
                            label={`انتظار ${Math.ceil((SCAN_COOLDOWN_MS - (Date.now() - lastScanTime)) / 1000)}ث`}
                            color="warning" 
                            size="small"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={debugBarcode}
                    sx={{ mt: 1, width: '100%' }}
                  >
                    {t('Debug Barcode')}
                  </Button>
                )}
              </Grid>
              
              {/* Scanner Statistics */}
              {(scanCount > 0 || blockedScans > 0) && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    mt: 1
                  }}>
                    <Chip 
                      label={`عمليات مسح: ${scanCount}`}
                      color="primary" 
                      size="small"
                      variant="outlined"
                    />
                    {blockedScans > 0 && (
                      <Chip 
                        label={`محظور: ${blockedScans}`}
                        color="warning" 
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Chip 
                      label={`منتجات في السلة: ${cartItems.length}`}
                      color="success" 
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              )}
              
              <Grid item xs={12} md={4}>
                <Tabs
                  value={selectedCategory}
                  onChange={(e, newValue) => setSelectedCategory(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="category tabs"
                  sx={{ maxWidth: '100%', overflow: 'hidden' }}
                >
                  {categories.map((category) => (
                    <Tab 
                      key={category.id} 
                      label={t(`sales.categories.${category.name}`)} 
                      value={category.id} 
                      icon={<Category />} 
                      iconPosition="start"
                    />
                  ))}
                </Tabs>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Products grid */}
          <Grid container spacing={2} sx={{ 
            flexWrap: 'wrap',
            '& .MuiGrid-item': {
              maxWidth: '100%'
            }
          }}>
            {filteredProducts.map((product) => (
              <Grid item xs={6} sm={4} md={3} xl={2} key={product.id} sx={{ minWidth: 0 }}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    maxWidth: '100%',
                    '&:hover': { boxShadow: 6 },
                  }}
                  onClick={() => addToCart(product)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={getProductImageUrl(product)}
                    alt={product.name}
                    sx={{ 
                      objectFit: 'cover',
                      backgroundColor: '#f5f5f5'
                    }}
                    onError={(e) => {
                      // Debug: سجل تفاصيل الخطأ عند فشل تحميل صورة المنتج
                      const failingUrl = e?.target?.src;
                      console.error("خطأ في تحميل صورة المنتج:", {
                        productId: product?.id,
                        productName: product?.name,
                        imageUrlTried: failingUrl,
                        rawImageFields: {
                          image_url: product?.image_url,
                          image: product?.image,
                          imageUrl: product?.imageUrl,
                        },
                        errorEvent: e,
                      });
                      // لمنع تكرار onError بشكل لا نهائي ثم عرض صورة بديلة
                      if (e && e.target) {
                        e.target.onerror = null;
                        e.target.src = placeholderImage;
                      }
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {product.category}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(product.price)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        
        {/* Right side - Cart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Customer selection */}
            <Box sx={{ mb: 2 }}>
              <Autocomplete
                value={selectedCustomer}
                onChange={(event, newValue) => {
                  setSelectedCustomer(newValue || { id: null, name: t('sales:walkInCustomer') });
                }}
                options={customerOptions}
                loading={customersLoading}
                getOptionLabel={(option) => option?.name || ''}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('sales:customer')}
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1">{t(`sales.customers.${option.name}`, { defaultValue: option.name })}</Typography>
                      {option.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {option.phone}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
              />
            </Box>
            
            <Typography variant="h6" gutterBottom>
              {t('sales:items')}
            </Typography>
            
            {/* Cart items */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, maxHeight: '400px' }}>
              {cartItems.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ShoppingCart sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    {t('sales:addItem')}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ pt: 0 }}>
                  {cartItems.map((item) => (
                    <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Typography variant="body2" color="text.primary">
                            {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              updateQuantity(item.id, value);
                            }
                          }}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: 40, mx: 1 }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
            
            {/* Cart summary */}
            <Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body1">{t('sales:subtotal')}:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" align="right">{formatCurrency(subtotal)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{t('sales:tax')} ({taxRatePercent}%):</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setApplyTax((prev) => !prev)}
                      sx={{ minWidth: 0, px: 1, py: 0.5 }}
                    >
                      {applyTax ? 'إيقاف الضريبة' : 'تشغيل الضريبة'}
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1" align="right">{formatCurrency(tax)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right">{formatCurrency(total)}</Typography>
                </Grid>
                {/* Action buttons */}
                <Grid item xs={12}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        color="primary"
                        fullWidth
                        size="small"
                        disabled={cartItems.length === 0}
                        onClick={() => setPaymentDialogOpen(true)}
                        startIcon={<Payment />}
                        sx={{ fontSize: '0.75rem', py: 1 }}
                      >
                        SALES PAYMENT
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        size="small"
                        disabled={cartItems.length === 0}
                        onClick={cancelSale}
                        startIcon={<Cancel />}
                        sx={{ fontSize: '0.75rem', py: 1 }}
                      >
                        SALES CANCELSALE
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant="outlined"
                        color="secondary"
                        fullWidth
                        size="small"
                        disabled={cartItems.length === 0}
                        startIcon={<Save />}
                        sx={{ fontSize: '0.75rem', py: 1 }}
                      >
                        SALES HOLDSALE
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
                {/* Payment dialog inputs - REMOVED FROM CART SUMMARY */}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('sales:payment')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="payment-method-label">{t('sales:paymentMethod')}</InputLabel>
                <Select
                  labelId="payment-method-label"
                  value={paymentMethod}
                  label={t('sales:paymentMethod')}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {t(`sales.paymentMethods.${method.name}`, { defaultValue: method.name })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('sales:amountPaid')}
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('sales:discount')}
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocalOffer />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {getCurrencySymbol()}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('sales:changeAmount')}
                value={change > 0 ? change.toFixed(2) : '0.00'}
                InputProps={{
                  readOnly: true,
                  startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h6">
                {t('sales:total')}: {formatCurrency(total)}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePayment} 
            disabled={!amountPaid || parseFloat(amountPaid) < total || paymentLoading}
          >
            {paymentLoading ? <CircularProgress size={24} /> : t('sales:completeSale')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('sales:receipt')}</DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
         <Box id="receipt-print" sx={{ p: 0, border: 'none', fontFamily: 'monospace', lineHeight: 1.35 }}>
            {/* Store Header */}
            {storeSettings?.receiptShowLogo && storeSettings?.logoUrl && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <img src={storeSettings.logoUrl} alt="logo" style={{ maxHeight: 60, objectFit: 'contain' }} />
              </Box>
            )}
            <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
              {storeSettings?.name || t('appName')}
            </Typography>
            <Typography variant="body2" align="center" gutterBottom>
              {[storeSettings?.address, storeSettings?.city, storeSettings?.country].filter(Boolean).join(', ')}
            </Typography>
            {storeSettings?.phone && (
              <Typography variant="body2" align="center" gutterBottom>
                Tel: {storeSettings.phone}
              </Typography>
            )}
            
            <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
            
            {/* Receipt Details */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                {t('sales:receiptNumber')}: {receiptData?.receiptNumber || 'INV-9010'}
              </Typography>
              <Typography variant="body2">
                {t('sales:date')}: {new Date(receiptData?.createdSale?.createdAt || Date.now()).toLocaleString('en-US')}
              </Typography>
              {currentUser && (
                <Typography variant="body2">
                  {t('sales:cashier')}: {currentUser.name || 'Admin User'}
                </Typography>
              )}
              <Typography variant="body2">
                {t('sales:customer')}: {t(`sales.customers.${selectedCustomer?.name}`, { defaultValue: selectedCustomer?.name || 'walkInCustomer' })}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
            
            {/* Items List */}
            <Box sx={{ mb: 2 }}>
              {cartItems.map((item) => (
                <Box key={item.id} sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {item.name} × {item.quantity}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {formatCurrency(item.price)} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
            
            {/* Totals */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{t('sales:subtotal')}:</Typography>
                <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
              </Box>
              {storeSettings?.receiptShowTaxDetails && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{t('sales:tax')} ({taxRatePercent}%):</Typography>
                  <Typography variant="body2">{formatCurrency(tax)}</Typography>
                </Box>
              )}
              {discount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{t('sales:discount')}:</Typography>
                  <Typography variant="body2">- {formatCurrency(discount)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <Typography variant="body1">{t('sales:total')}:</Typography>
                <Typography variant="body1">{formatCurrency(total)}</Typography>
              </Box>
              <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{t('sales:amountPaid')}:</Typography>
                <Typography variant="body2">{formatCurrency(parseFloat(amountPaid || 0))}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{t('sales:changeAmount')}:</Typography>
                <Typography variant="body2">{formatCurrency(change > 0 ? change : 0)}</Typography>
              </Box>
            </Box>
            
            {/* Terms and Footer */}
            {storeSettings?.invoiceTerms && (
              <Typography
                variant="caption"
                align="center"
                display="block"
                sx={{ whiteSpace: 'pre-line', mb: 1, color: 'text.secondary', fontSize: '0.7rem' }}
              >
                {storeSettings.invoiceTerms}
              </Typography>
            )}
            <Typography variant="body2" align="center" sx={{ fontStyle: 'italic' }}>
              {storeSettings?.receiptFooterText || t('thankYou')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<Print />}
            onClick={() => {
              try {
                window.print();
              } catch (e) {
                console.error('Manual print failed:', e);
              }
              setTimeout(() => {
                completeSale();
              }, 500);
            }}
          >
            {t('sales:printReceipt')}
          </Button>
          <A4InvoiceGenerator 
            saleData={{
              items: cartItems,
              customer: selectedCustomer,
              total: total,
              subtotal: subtotal,
              tax: tax,
              discount: discount,
              invoiceNumber: `INV-${Date.now()}`,
              date: new Date().toLocaleDateString()
            }}
            companyInfo={{
              name: storeSettings?.name,
              address: [storeSettings?.address, storeSettings?.city, storeSettings?.country].filter(Boolean).join(', '),
              trn: storeSettings?.trn || storeSettings?.taxNumber || undefined,
              phone: storeSettings?.phone,
              email: storeSettings?.email,
            }}
          />
          <SimpleInvoiceButton 
            saleData={{
              items: cartItems,
              customer: selectedCustomer,
              total: total
            }}
          />
          <Button startIcon={<Email />}>
            {t('sales:emailReceipt')}
          </Button>
          <Button startIcon={<Sms />}>
            {t('sales:smsReceipt')}
          </Button>
          <Button variant="contained" onClick={completeSale}>
            {t('done')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POS;