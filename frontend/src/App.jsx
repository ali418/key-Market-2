import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Alert, Snackbar, CircularProgress } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import rtlPlugin from 'stylis-plugin-rtl';

// Auth Service
import { initAuthFromStorage } from './services/authService';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages - Small components, no need for lazy loading
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main Pages - Lazy loaded for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/products/Products'));
const ProductForm = lazy(() => import('./pages/products/ProductForm'));
const ProductView = lazy(() => import('./pages/products/ProductView')); // Import ProductView
const Categories = lazy(() => import('./pages/products/Categories'));
// Online pages
const OnlineProducts = lazy(() => import('./pages/online/OnlineProducts'));
const OnlineOrders = lazy(() => import('./pages/online/OnlineOrders'));
const OnlineStore = lazy(() => import('./pages/online/OnlineStore'));
const Cart = lazy(() => import('./pages/online/Cart'));
const Checkout = lazy(() => import('./pages/online/Checkout'));
const ProductDetails = lazy(() => import('./pages/online/ProductDetails'));
const About = lazy(() => import('./pages/online/About'));
const Contact = lazy(() => import('./pages/online/Contact'));
const POS = lazy(() => import('./pages/sales/POS'));
const Sales = lazy(() => import('./pages/sales/Sales'));
const SaleDetails = lazy(() => import('./pages/sales/SaleDetails'));
const Invoices = lazy(() => import('./pages/sales/Invoices'));
const InvoiceForm = lazy(() => import('./pages/sales/InvoiceForm'));
const Customers = lazy(() => import('./pages/customers/Customers'));
const CustomerForm = lazy(() => import('./pages/customers/CustomerForm'));
const Users = lazy(() => import('./pages/users/Users'));
const Inventory = lazy(() => import('./pages/inventory/Inventory'));
const StockAdjustment = lazy(() => import('./pages/inventory/StockAdjustment'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </div>
);

// Utilities
import { selectThemeMode, setThemeMode, fetchSettings } from './redux/slices/settingsSlice';
import { selectIsAuthenticated, login } from './redux/slices/authSlice';
import './i18n/i18n'; // Import i18n configuration

const App = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const themeMode = useSelector(selectThemeMode);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [showAuthError, setShowAuthError] = React.useState(false);
  
  // Initialize authentication state from localStorage on app startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          console.log("No auth token found - user needs to login");
          setAuthChecked(true);
          return;
        }

        // Additional validation could be added here (API call to verify token)
        const { isAuthenticated: storedAuth, user } = initAuthFromStorage();
        if (storedAuth && user) {
          // Hydrate Redux store with user from storage
          dispatch(login(user));
        } else if (!user && token) {
          // Token exists but no user data - potential corruption
          throw new Error("بيانات الجلسة تالفة. الرجاء إعادة تسجيل الدخول.");
        }
      } catch (err) {
        console.error("خطأ في التحقق من الجلسة:", err);
        setAuthError(`حدث خطأ: ${err.message}`);
        setShowAuthError(true);
        // Clear corrupted auth data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_refresh_token");
        localStorage.removeItem("auth_user");
      } finally {
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, [dispatch]);
  
  // Fetch settings on initial mount for branding (works on public routes too)
  React.useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);
  
  // Update current language when i18n.language changes
  React.useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  // Create emotion cache for RTL support
  const [cacheRtl, setCacheRtl] = React.useState(null);
  const [cacheLtr, setCacheLtr] = React.useState(null);

  React.useEffect(() => {
    const ltrCache = createCache({
      key: 'mui-ltr',
      prepend: true,
    });

    const rtlCache = createCache({
      key: 'mui-rtl',
      prepend: true,
      stylisPlugins: [rtlPlugin],
    });

    setCacheLtr(ltrCache);
    setCacheRtl(rtlCache);
  }, []);
  
  // Create theme based on theme mode and language
  const theme = React.useMemo(() => {
    const isRTL = currentLanguage && currentLanguage.startsWith('ar');
    return createTheme({
      direction: isRTL ? 'rtl' : 'ltr', // RTL for Arabic, LTR for other languages
      palette: {
        mode: themeMode,
        primary: {
          main: '#D4AF37', // Gold color as primary
          light: '#F4E4BC',
          dark: '#B8860B',
          contrastText: '#FFFFFF',
        },
        secondary: {
          main: '#2E7D32', // Green color as secondary
          light: '#4CAF50',
          dark: '#1B5E20',
          contrastText: '#FFFFFF',
        },
        background: {
          default: themeMode === 'dark' ? '#121212' : '#FAFAFA',
          paper: themeMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
        },
        success: {
          main: '#2E7D32',
          light: '#4CAF50',
          dark: '#1B5E20',
        },
        warning: {
          main: '#D4AF37',
          light: '#F4E4BC',
          dark: '#B8860B',
        },
        info: {
          main: '#0288D1',
          light: '#03A9F4',
          dark: '#01579B',
        },
        error: {
          main: '#D32F2F',
          light: '#F44336',
          dark: '#C62828',
        },
      },
      typography: {
        fontFamily: isRTL 
          ? '"Tajawal", "Roboto", "Helvetica", "Arial", sans-serif' 
          : '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              direction: isRTL ? 'rtl' : 'ltr',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
            },
            contained: {
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(212, 175, 55, 0.4)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            },
          },
        },
      },
    });
  }, [currentLanguage, themeMode]);

  // Set document direction based on language - only on initial load
  useEffect(() => {
    // console.log(`Initial language setup: ${i18n.language}`);
    // Get preferred language from localStorage or use default
    const preferredLanguage = localStorage.getItem('preferredLanguage') || localStorage.getItem('language');
    
    // Only change language if it's different from current language
    if (preferredLanguage && preferredLanguage !== i18n.language) {
      // Use the promise returned by changeLanguage to ensure translations are loaded
      i18n.changeLanguage(preferredLanguage).then(() => {
        // console.log(`Language changed to ${preferredLanguage} and translations loaded successfully`);
      }).catch(error => {
        console.error(`Error changing language to ${preferredLanguage}:`, error);
      });
    }
    
    // Initial direction setup is now handled by i18n.js and LanguageSwitcher.jsx
  }, []); // Empty dependency array - only run once on mount

  // Persist theme mode across refresh: hydrate from localStorage on first load
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('themeMode');
      if (savedMode === 'dark' || savedMode === 'light') {
        if (savedMode !== themeMode) {
          dispatch(setThemeMode(savedMode));
        }
      }
    } catch (e) {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save theme mode to localStorage whenever it changes
  useEffect(() => {
    try {
      if (themeMode) {
        localStorage.setItem('themeMode', themeMode);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [themeMode]);

  // Listen for language change events
  useEffect(() => {
    const handleLanguageChanged = (event) => {
      // console.log("Language changed event received in App.jsx:", event.detail);
      // Force re-render by updating the currentLanguage state
      setCurrentLanguage(event.detail.language);
      
      // Apply font family directly to body with !important to ensure it takes precedence
      if (event.detail.isRTL) {
        document.body.setAttribute('style', "font-family: 'Tajawal', sans-serif !important");
      } else {
        document.body.setAttribute('style', "font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif !important");
      }
      
      // Log font loading status
      if (event.detail.fontLoaded === false) {
        console.error('Font loading failed:', event.detail.error);
      }
      
      // Log translation loading status
      if (event.detail.translationsLoaded === false) {
        console.error('Translation loading failed:', event.detail.error);
      }
      
      // Reload all translations to ensure they are properly loaded
      if (window.i18n && typeof window.i18n.reloadAllTranslations === 'function') {
        // console.log('Reloading all translations after language change...');
        window.i18n.reloadAllTranslations(event.detail.language);
      }
    };
    
    // Listen for i18n errors
    const handleI18nError = (event) => {
      console.error("i18n error detected in App.jsx:", event.detail);
    };
    
    // Listen for successful loading of all namespaces
    const handleAllNamespacesLoaded = (event) => {
      // console.log("All namespaces loaded successfully:", event.detail);
      // Force re-render to ensure all translations are applied
      setCurrentLanguage(prev => prev === event.detail.language ? prev + '_refresh' : event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChanged);
    window.addEventListener('i18nError', handleI18nError);
    window.addEventListener('i18nAllNamespacesLoaded', handleAllNamespacesLoaded);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChanged);
      window.removeEventListener('i18nError', handleI18nError);
      window.removeEventListener('i18nAllNamespacesLoaded', handleAllNamespacesLoaded);
    };
  }, []);

  // Use appropriate cache based on language direction
  const cache = (currentLanguage && currentLanguage.startsWith('ar')) ? cacheRtl : cacheLtr;

  if (!cache) {
    return null; // Loading state while cache is being created
  }

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer 
          position="top-left"
          autoClose={5000}
          rtl={i18n.language && i18n.language.startsWith('ar')}
        />
        <Snackbar
          open={showAuthError}
          autoHideDuration={6000}
          onClose={() => setShowAuthError(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowAuthError(false)} severity="error" sx={{ width: '100%' }}>
            {authError || 'حدث خطأ غير متوقع أثناء التحقق من الجلسة.'}
          </Alert>
        </Snackbar>
        <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
            
            {/* Public Online Store (no authentication required) */}
            <Route path="/online-store" element={<Suspense fallback={<LoadingFallback />}><OnlineStore /></Suspense>} />
            <Route path="/cart" element={<Suspense fallback={<LoadingFallback />}><Cart /></Suspense>} />
            <Route path="/checkout" element={<Suspense fallback={<LoadingFallback />}><Checkout /></Suspense>} />
            <Route path="/online-store/product/:id" element={<Suspense fallback={<LoadingFallback />}><ProductDetails /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={<LoadingFallback />}><About /></Suspense>} />
            <Route path="/contact" element={<Suspense fallback={<LoadingFallback />}><Contact /></Suspense>} />
            {/* Backwards-compat alias */}
            <Route path="/online" element={<Navigate to="/online-store" replace />} />
            
            {/* Main Routes - Wrapped with Suspense for lazy loading */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
              <Route path="/products" element={<ProtectedRoute path="/products"><Suspense fallback={<LoadingFallback />}><Products /></Suspense></ProtectedRoute>} />
              <Route path="/products/add" element={<ProtectedRoute path="/products/add"><Suspense fallback={<LoadingFallback />}><ProductForm /></Suspense></ProtectedRoute>} />
              <Route path="/products/edit/:id" element={<ProtectedRoute path="/products/edit/:id"><Suspense fallback={<LoadingFallback />}><ProductForm /></Suspense></ProtectedRoute>} />
              <Route path="/products/view/:id" element={<ProtectedRoute path="/products/view/:id"><Suspense fallback={<LoadingFallback />}><ProductView /></Suspense></ProtectedRoute>} /> {/* Add ProductView route */}
              {/* Online features */}
              <Route path="/online-products" element={<ProtectedRoute path="/online-products"><Suspense fallback={<LoadingFallback />}><OnlineProducts /></Suspense></ProtectedRoute>} />
              <Route path="/online-orders" element={<ProtectedRoute path="/online-orders"><Suspense fallback={<LoadingFallback />}><OnlineOrders /></Suspense></ProtectedRoute>} />
              {/* Removed protected route for /online-store; now public above */}
              <Route path="/categories" element={<ProtectedRoute path="/categories"><Suspense fallback={<LoadingFallback />}><Categories /></Suspense></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute path="/pos"><Suspense fallback={<LoadingFallback />}><POS /></Suspense></ProtectedRoute>} />
              <Route path="/sales" element={<ProtectedRoute path="/sales"><Suspense fallback={<LoadingFallback />}><Sales /></Suspense></ProtectedRoute>} />
              <Route path="/sales/:id" element={<ProtectedRoute path="/sales/:id"><Suspense fallback={<LoadingFallback />}><SaleDetails /></Suspense></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute path="/invoices"><Suspense fallback={<LoadingFallback />}><Invoices /></Suspense></ProtectedRoute>} />
              <Route path="/invoices/add" element={<ProtectedRoute path="/invoices/add"><Suspense fallback={<LoadingFallback />}><InvoiceForm /></Suspense></ProtectedRoute>} />
              <Route path="/invoices/edit/:id" element={<ProtectedRoute path="/invoices/edit/:id"><Suspense fallback={<LoadingFallback />}><InvoiceForm /></Suspense></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute path="/customers"><Suspense fallback={<LoadingFallback />}><Customers /></Suspense></ProtectedRoute>} />
              <Route path="/customers/add" element={<ProtectedRoute path="/customers/add"><Suspense fallback={<LoadingFallback />}><CustomerForm /></Suspense></ProtectedRoute>} />
              <Route path="/customers/edit/:id" element={<ProtectedRoute path="/customers/edit/:id"><Suspense fallback={<LoadingFallback />}><CustomerForm /></Suspense></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute path="/users"><Suspense fallback={<LoadingFallback />}><Users /></Suspense></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute path="/inventory"><Suspense fallback={<LoadingFallback />}><Inventory /></Suspense></ProtectedRoute>} />
              <Route path="/inventory/adjust" element={<ProtectedRoute path="/inventory/adjust"><Suspense fallback={<LoadingFallback />}><StockAdjustment /></Suspense></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute path="/reports"><Suspense fallback={<LoadingFallback />}><Reports /></Suspense></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute path="/settings"><Suspense fallback={<LoadingFallback />}><Settings /></Suspense></ProtectedRoute>} />
              <Route path="/profile" element={<Suspense fallback={<LoadingFallback />}><Profile /></Suspense>} />
            </Route>
            
            {/* 404 Route */}
            <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default App;