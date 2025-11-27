import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import LanguageSwitcher from '../LanguageSwitcher';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  PointOfSale as PointOfSaleIcon,
  Receipt as ReceiptIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  SupervisorAccount as UsersIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { selectStoreSettings } from '../../redux/slices/settingsSlice';

// Components

// Redux actions
import { logout, selectUser } from '../../redux/slices/authSlice';
import apiService from '../../api/apiService';
// Auth Service - not needed here as logout is handled in authSlice

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(6)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(6)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  // RTL support - the arrow icon will automatically flip based on the isRTL logic
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isRTL',
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // إزالة قواعد الهوامش القديمة لأن CSS Grid يتولى التخطيط الآن
  // ...(open && {
  //   marginInlineStart: drawerWidth,
  //   width: `calc(100% - ${drawerWidth}px)`,
  //   transition: theme.transitions.create(['width', 'margin'], {
  //     easing: theme.transitions.easing.sharp,
  //     duration: theme.transitions.duration.enteringScreen,
  //   }),
  // }),
}));

const DrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  // تأكد من أن الورقة تشارك في التخطيط وليست مثبتة فوق المحتوى
  '& .MuiDrawer-paper': { position: 'relative' },
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': { ...openedMixin(theme), position: 'relative' },
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': { ...closedMixin(theme), position: 'relative' },
  }),
}));

// Main content wrapper with proper RTL support using logical properties
const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  flexGrow: 1,
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  // إزالة أي حشوة جانبية لإلصاق المحتوى بحدود الشاشة
  paddingLeft: 0,
  paddingRight: 0,
  paddingInlineEnd: 0,
  paddingInlineStart: 0,
  // تأكد من عدم وجود هوامش جانبية
  marginLeft: 0,
  marginRight: 0,
  marginInlineStart: 0,
  marginInlineEnd: 0,
  // ضمان عدم تجاوز المحتوى حدود الشاشة مع تمكين التمرير العمودي داخل المحتوى
  maxWidth: '100%',
  height: '100dvh',
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
}));

const MainLayout = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation(['common', 'dashboard', 'products', 'sales', 'customers', 'inventory', 'reports']);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const storeSettings = useSelector(selectStoreSettings);
  const isRTL = (typeof document !== 'undefined' ? document.dir === 'rtl' : (i18n.language && i18n.language.startsWith('ar')));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sidebar state with localStorage persistence as specified by user
  const [open, setOpen] = useState(() => {
    if (isMobile) return false;
    // Apply user's localStorage logic
    const collapsed = localStorage.getItem('sidebarCollapsed');
    return collapsed !== 'true'; // return true if not collapsed
  });

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  const handleDrawerOpen = () => {
    setOpen(true);
    localStorage.setItem('sidebarCollapsed', 'false');
  };

  const handleDrawerClose = () => {
    setOpen(false);
    localStorage.setItem('sidebarCollapsed', 'true');
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // Fetch notifications
  const loadNotifications = async () => {
    setNotificationsError('');
    setNotificationsLoading(true);
     try {
       const [list, count] = await Promise.all([
         apiService.getNotifications(),
         apiService.getUnreadNotificationsCount(),
       ]);
       setNotifications(list);
       setUnreadCount(count);
     } catch (err) {
       // apiService returns mock data on failure, so we still update state
       console.error('Failed to load notifications:', err);
       const list = await apiService.getNotifications();
       const count = await apiService.getUnreadNotificationsCount();
       setNotifications(list);
       setUnreadCount(count);
      setNotificationsError(err?.userMessage || err?.message || '');
    } finally {
      setNotificationsLoading(false);
     }
   };

  useEffect(() => {
    const enabled = String(process.env.REACT_APP_ENABLE_NOTIFICATIONS).toLowerCase() !== 'false';
    if (!enabled) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 60 * 1000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleOpenNotificationsMenu = async (event) => {
    setAnchorElNotifications(event.currentTarget);
    // Optionally refresh when opening
    await loadNotifications();
  };

  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
    } catch (e) {
      // ignore
    }
    // Update local state optimistically
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await apiService.markNotificationAsRead(id);
    } catch (e) {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleDeleteNotification = async (id) => {
    try {
      await apiService.deleteNotification(id);
    } catch (e) {
      // ignore
    }
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      const updated = prev.filter((n) => n.id !== id);
      if (removed && removed.isRead === false) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return updated;
    });
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
    // Navigate based on notification type if applicable
    if (n.type === 'low_stock') {
      navigate('/inventory');
    } else if (n.type === 'new_order') {
      navigate('/sales');
    } else if (n.type === 'payment_received') {
      navigate('/invoices');
    }
    handleCloseNotificationsMenu();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setOpen(false);
    }
  };

  // Grid layout for sidebar positioned properly in both LTR and RTL
  const collapsedWidth = `calc(${theme.spacing(6)} + 1px)`;
  const drawerColWidth = open ? `${drawerWidth}px` : (isMobile ? '0px' : collapsedWidth);
  // Keep drawer on left for both RTL and LTR as per user request
  const gridTemplateColumns = `${drawerColWidth} 1fr`;
  const gridTemplateAreas = "'drawer content'";

  // Function to check if user has permission to access a menu item
  const hasPermission = (path, userRole) => {
    if (!userRole) return false;
    
    // Admin has access to everything
    if (userRole === 'admin') return true;
    
    // Define permissions for each role
    const permissions = {
  manager: ['/dashboard', '/products', '/categories', '/sales', '/pos', '/invoices', '/customers', '/inventory', '/reports', '/settings', '/profile', '/online-products', '/online-orders'],
  cashier: ['/dashboard', '/pos', '/sales', '/customers', '/profile'],
  storekeeper: ['/dashboard', '/products', '/categories', '/inventory', '/profile', '/online-products'],
  accountant: ['/dashboard', '/sales', '/invoices', '/customers', '/reports', '/profile', '/online-orders'],
  staff: ['/dashboard', '/profile']
    };
    
    return permissions[userRole]?.includes(path) || false;
  };

  // Filter menu items based on user permissions
  const allMenuItems = [
    { text: t('dashboard:dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('products:products'), icon: <InventoryIcon />, path: '/products' },
    { text: t('products:categories'), icon: <CategoryIcon />, path: '/categories' },
    { text: t('sales:pos'), icon: <PointOfSaleIcon />, path: '/pos' },
    { text: t('sales:sales'), icon: <ShoppingCartIcon />, path: '/sales' },
    { text: t('sales:invoices'), icon: <ReceiptIcon />, path: '/invoices' },
    { text: t('customers:customers'), icon: <PeopleIcon />, path: '/customers' },
    { text: t('users:users'), icon: <UsersIcon />, path: '/users', adminOnly: true },
    { text: t('inventory:inventory'), icon: <InventoryIcon sx={{ transform: 'rotate(90deg)' }} />, path: '/inventory' },
    { text: t('reports:reports'), icon: <BarChartIcon />, path: '/reports' },
    { text: t('settings'), icon: <SettingsIcon />, path: '/settings' },
    // Online features
    { text: 'الطلبات الأونلاين', icon: <ShoppingCartIcon />, path: '/online-orders' },
    { text: 'إدارة المنتجات الأونلاين', icon: <InventoryIcon />, path: '/online-products' },
  ];

  const menuItems = allMenuItems.filter(item => {
    // Users management is admin only
    if (item.adminOnly && user?.role !== 'admin') return false;
    return hasPermission(item.path, user?.role);
  });

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns,
      gridTemplateAreas,
      // لا فجوة بين الأعمدة
      gap: 0,
      height: '100dvh',
      minHeight: 0,
      overflow: 'hidden',
      transition: theme.transitions.create('grid-template-columns', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }}>
      <AppBarStyled position='fixed' open={open} isRTL={isRTL} sx={{ gridColumn: '1 / -1' }}>
        <Toolbar>
          <IconButton
            color='inherit'
            aria-label={open ? t('common.collapse', { defaultValue: 'Collapse sidebar' }) : t('common.expand', { defaultValue: 'Expand sidebar' })}
            onClick={open ? handleDrawerClose : handleDrawerOpen}
            edge='start'
            sx={{
              // لا تضيف مسافة إضافية بجانب الأيقونة
              marginInlineEnd: 0,
            }}
         >
            {open ? (isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />) : <MenuIcon />}
          </IconButton>
          <Typography variant='h6' noWrap component='div' sx={{ flexGrow: 1 }}>
            {storeSettings?.name || t('appName')}
          </Typography>

          <LanguageSwitcher />

          <Tooltip title={t('notifications')}>
            <IconButton
              color='inherit'
              onClick={handleOpenNotificationsMenu}
            >
              <Badge badgeContent={unreadCount} color='error'>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Menu
            sx={{ mt: '45px' }}
            id='notifications-menu'
            anchorEl={anchorElNotifications}
            anchorOrigin={{
              vertical: 'top',
              horizontal: isRTL ? 'left' : 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: isRTL ? 'left' : 'right',
            }}
            open={Boolean(anchorElNotifications)}
            onClose={handleCloseNotificationsMenu}
          >
            {unreadCount > 0 && (
              <MenuItem onClick={() => { handleMarkAllAsRead(); }}>
                <Typography sx={{ fontWeight: 600 }}>
                  {t('common.markAllAsRead', { defaultValue: 'Mark all as read' })}
                </Typography>
              </MenuItem>
            )}

            {notificationsLoading && (
              <MenuItem disabled>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <CircularProgress size={18} />
                  <Typography>{t('common.loading', { defaultValue: 'Loading...' })}</Typography>
                </Box>
              </MenuItem>
            )}

           {!notificationsLoading && notificationsError && (
              <MenuItem disabled>
                <Typography color='error'>
                  {notificationsError}
                </Typography>
              </MenuItem>
            )}
 
            {!notificationsLoading && notifications.length === 0 ? (
               <MenuItem disabled>
                 <Typography textAlign='center'>
                   {t('common.noData')}
                 </Typography>
               </MenuItem>
             ) : (
              notifications.map((n) => (
                <MenuItem key={n.id} onClick={() => handleNotificationClick(n)}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography textAlign='start' sx={{ fontWeight: n.isRead ? 400 : 700 }}>
                        {n.type === 'low_stock'
                          ? t('common.lowStockAlertItem', { item: n?.data?.item || '' })
                          : n.type === 'new_order'
                            ? t('common.newOrderNumber', { number: n?.data?.number || '' })
                            : n.type === 'payment_received'
                              ? t('common.paymentReceivedFromCustomerNumber', { number: n?.data?.number || '' })
                              : (n.message || n.title || '')}
                      </Typography>
                      {n.createdAt && (
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(n.createdAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                    <IconButton size='small' edge='end' onClick={(e) => { e.stopPropagation(); handleDeleteNotification(n.id); }} aria-label={t('common.delete', { defaultValue: 'Delete' })}>
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Box>
                </MenuItem>
              ))
             )}
           </Menu>

          <Box sx={{ flexGrow: 0, marginInlineStart: 2 }}>
            <Tooltip title={t('profile')}>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user?.name || 'User'} src='/static/images/avatar/1.jpg' />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id='menu-appbar'
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: isRTL ? 'left' : 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: isRTL ? 'left' : 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                <ListItemIcon>
                  <PersonIcon fontSize='small' />
                </ListItemIcon>
                <Typography textAlign='center'>{t('profile')}</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize='small' />
                </ListItemIcon>
                <Typography textAlign='center'>{t('settings')}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); handleLogout(); }}>
                <ListItemIcon>
                  <LogoutIcon fontSize='small' />
                </ListItemIcon>
                <Typography textAlign='center'>{t('logout')}</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      <DrawerStyled variant='permanent' anchor='left' open={open} sx={{ gridArea: 'drawer', '& .MuiDrawer-paper': { height: '100%', boxSizing: 'border-box' } }}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
                onClick={() => handleNavigate(item.path)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    // إزالة الهامش الجانبي لتقليل أي فراغ بصري
                    marginInlineEnd: 0,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DrawerStyled>
      <MainContent component='main' open={open} sx={{ gridArea: 'content', height: '100dvh', minHeight: 0, overflowX: 'hidden', overflowY: 'auto' }}>
        <DrawerHeader />
        <Outlet />
      </MainContent>
    </Box>
  );
};

export default MainLayout;