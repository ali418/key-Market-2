import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { selectIsAuthenticated, selectUser } from '../../redux/slices/authSlice';

const ProtectedRoute = ({ children, path = null, requiredRole = null, adminOnly = false }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires admin access
  if (adminOnly && user.role !== 'admin') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" color="error" gutterBottom>
            {t('common:accessDenied')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('common:adminAccessRequired')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Check specific role requirements
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" color="error" gutterBottom>
            {t('common:accessDenied')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('common:insufficientPermissions')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Function to check if user has permission to access current path
  const hasPermission = (path, userRole) => {
    if (!userRole) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Define permissions for each role
    const permissions = {
      manager: ['/dashboard', '/products', '/categories', '/sales', '/pos', '/invoices', '/customers', '/inventory', '/reports', '/settings', '/profile'],
      cashier: ['/dashboard', '/pos', '/sales', '/customers', '/profile'],
      storekeeper: ['/dashboard', '/products', '/categories', '/inventory', '/profile'],
      accountant: ['/dashboard', '/sales', '/invoices', '/customers', '/reports', '/profile'],
      staff: ['/dashboard', '/profile']
    };
    
    // Check exact match first
    if (permissions[userRole]?.includes(path)) {
      return true;
    }
    
    // Check for dynamic routes (e.g., /products/edit/123 should match /products)
    for (const allowedPath of permissions[userRole] || []) {
      if (path.startsWith(allowedPath + '/')) {
        return true;
      }
    }
    
    return false;
  };

  // Check if user has permission to access current route
  const currentPath = path || location.pathname;
  if (!hasPermission(currentPath, user.role)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" color="error" gutterBottom>
            {t('common:accessDenied')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('common:noPermissionForPage')}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;