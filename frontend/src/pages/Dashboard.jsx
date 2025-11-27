import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Inventory,
  Warning,
  ShoppingCart,
  MoreVert,
  Add,
  PointOfSale,
  Person,
  Receipt,
  Assessment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../redux/slices/settingsSlice';
import { useCurrencyFormatter } from '../utils/currencyFormatter';

// Charts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import apiService from '../api/apiService';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const currency = useSelector(selectCurrency);
  const { formatCurrency: formatCurrencyFromHook } = useCurrencyFormatter();

  // State for dynamic sections
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Summary cards state
  const [todaySalesAmount, setTodaySalesAmount] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Charts data state
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New: period toggle and revenue loading
  const [period, setPeriod] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboardSalesPeriod');
      const allowed = ['1D', '1M', '6M', '1Y'];
      return allowed.includes(saved) ? saved : '6M';
    } catch {
      return '6M';
    }
  }); // 1D | 1M | 6M | 1Y
  const [revLoading, setRevLoading] = useState(false);

  // Helper: format currency for axis/tooltip
  const formatCurrency = (value) => {
    const num = Number(value || 0);
    // لا تعرض أي رمز عملة في الداشبورد، فقط الرقم منسق
    return `${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <Paper elevation={3} sx={{ p: 1.5 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
            {t('revenue')}: {formatCurrency(val)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Helper: get date range by period
  const getDateRangeForPeriod = (p) => {
    const end = new Date();
    const start = new Date();
    let groupBy = 'day';
    if (p === '7D') {
      start.setDate(end.getDate() - 6);
      groupBy = 'day';
    } else if (p === '1M') {
      start.setMonth(end.getMonth() - 1);
      groupBy = 'day';
    } else if (p === '6M') {
      start.setMonth(end.getMonth() - 6);
      groupBy = 'month';
    } else if (p === '1Y') {
      start.setFullYear(end.getFullYear() - 1);
      groupBy = 'month';
    }
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    return { startDateStr, endDateStr, groupBy };
  };

  // Fetch revenue with selected period
  const fetchRevenueData = async (p) => {
    try {
      setRevLoading(true);
      const { startDateStr, endDateStr, groupBy } = getDateRangeForPeriod(p);
      const revenueResponse = await apiService.getRevenueReport(startDateStr, endDateStr, groupBy);
      if (revenueResponse && Array.isArray(revenueResponse.revenueData)) {
        const chartData = revenueResponse.revenueData.map((item) => ({
          name: item.period || item.period_date || item.date,
          sales: Number(item.revenue) || 0,
        }));
        setSalesData(chartData);
      } else {
        setSalesData([]);
      }
    } catch (e) {
      console.error('Failed to fetch revenue data for period', p, e);
      setSalesData([]);
    } finally {
      setRevLoading(false);
    }
  };

  // When period changes, refetch revenue
  useEffect(() => {
    fetchRevenueData(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  // Persist selected period to localStorage so it survives refresh/navigation
  useEffect(() => {
    try {
      localStorage.setItem('dashboardSalesPeriod', period);
    } catch (e) {
      // ignore storage errors (e.g., private mode)
    }
  }, [period]);

  // Update document title based on current language
  useEffect(() => {
    document.title = t('common.pageTitle.dashboard', { ns: 'common' });
  }, [i18n.language, t]);

  // Fetch recent sales + low stock + summary counts + chart data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    const fetchData = async () => {
      try {
        // Get date range for reports (last 6 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch recent sales
        const sales = await apiService.getSales();
        // Map to dashboard friendly shape and take latest 5
        const mappedSales = (sales || [])
          .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
          .slice(0, 5)
          .map((s) => ({
            id: s.id,
            customer: s.customer?.name || t('sales:walkInCustomer', { defaultValue: 'Walk-in' }),
            amount: Number(s.totalAmount || 0),
            date: new Date(s.saleDate).toLocaleString(),
            items: Array.isArray(s.items) ? s.items.length : (s.itemsCount || 0),
          }));
        if (isMounted) setRecentSales(mappedSales);

        // Compute today's sales amount
        const todayStr = new Date().toDateString();
        const todayAmount = (sales || [])
          .filter((s) => new Date(s.saleDate).toDateString() === todayStr && ((s.status || 'completed') === 'completed'))
          .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0);
        if (isMounted) setTodaySalesAmount(todayAmount);

        // Fetch revenue data for sales chart (connected to backend)
        const revenueResponse = await apiService.getRevenueReport(startDateStr, endDateStr, 'month');
        // Backend shape: { summary: {...}, revenueData: [ { period: 'YYYY-MM', revenue: '123.45', ... } ] }
        if (isMounted && revenueResponse && Array.isArray(revenueResponse.revenueData)) {
          const chartData = revenueResponse.revenueData.map((item) => ({
            name: item.period || item.period_date || item.date,
            sales: Number(item.revenue) || 0,
          }));
          setSalesData(chartData);
        } else if (isMounted) {
          setSalesData([]);
        }

        // Fetch sales by category for pie chart (connected to backend)
        const salesByCategory = await apiService.getSalesByCategory(startDateStr, endDateStr);
        if (isMounted && Array.isArray(salesByCategory)) {
          const pieData = salesByCategory.map((item) => ({
            name: item.category || t('reports:uncategorized'),
            value: Number(item.totalRevenue) || 0,
          }));
          setCategoryData(pieData);
        } else if (isMounted) {
          setCategoryData([]);
        }
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
        if (isMounted) {
          setRecentSales([]);
          setTodaySalesAmount(0);
          setSalesData([]);
          setCategoryData([]);
          setError(t('common:errorLoadingData'));
        }
      }

      try {
        // Fetch low stock items from reports
        const lowStock = await apiService.getLowStockProducts();
        const mappedLowStock = (lowStock || []).map((item) => ({
          id: item.id || item.productId,
          name: item.product?.name || item.product_name || t('products:unknownProduct', { defaultValue: 'Unknown Product' }),
          stock: item.quantity,
          minStock: item.minStockLevel || item.min_quantity,
        }));
        if (isMounted) {
          setLowStockCount(mappedLowStock.length);
          setLowStockProducts(mappedLowStock.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch low stock products:', error);
        if (isMounted) {
          setLowStockProducts([]);
          setLowStockCount(0);
          setError((prev) => prev || t('common:errorLoadingData'));
        }
      }

      try {
        // Fetch totals for customers and products
        const [customers, products] = await Promise.all([
          apiService.getCustomers(),
          apiService.getProducts(),
        ]);
        if (isMounted) {
          setTotalCustomers((customers || []).length);
          setTotalProducts((products || []).length);
        }
      } catch (error) {
        console.error('Failed to fetch customers/products totals:', error);
        if (isMounted) {
          setTotalCustomers(0);
          setTotalProducts(0);
          setError((prev) => prev || t('common:errorLoadingData'));
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [t]);

  // Summary cards data (now dynamic)
  const summaryCards = [
    {
      title: t('todaySales'),
      value: formatCurrency(Number(todaySalesAmount || 0)),
      icon: <TrendingUp />,
      color: '#2E7D32',
      onClick: () => navigate('/sales'),
    },
    {
      title: t('totalCustomers'),
      value: String(totalCustomers),
      icon: <People />,
      color: '#1976D2',
      onClick: () => navigate('/customers'),
    },
    {
      title: t('totalProducts'),
      value: String(totalProducts),
      icon: <Inventory />,
      color: '#FF8F00',
      onClick: () => navigate('/products'),
    },
    {
      title: t('lowStock'),
      value: String(lowStockCount),
      icon: <Warning />,
      color: '#D32F2F',
      onClick: () => navigate('/inventory'),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        {t('dashboard')}
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
        {t('welcome')}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 120,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                },
              }}
              onClick={card.onClick}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  {card.title}
                </Typography>
                <Avatar sx={{ bgcolor: card.color }}>
                  {card.icon}
                </Avatar>
              </Box>
              <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('quickActions')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {[
            {
              title: t('newSale'),
              icon: <PointOfSale />,
              color: '#2E7D32',
              onClick: () => navigate('/pos'),
            },
            {
              title: t('addProduct'),
              icon: <Inventory />,
              color: '#FF8F00',
              onClick: () => navigate('/products/add'),
            },
            {
              title: t('addCustomer'),
              icon: <Person />,
              color: '#1976D2',
              onClick: () => navigate('/customers/add'),
            },
            {
              title: t('createInvoice'),
              icon: <Receipt />,
              color: '#9C27B0',
              onClick: () => navigate('/invoices/add'),
            },
            {
              title: t('viewReports'),
              icon: <Assessment />,
              color: '#607D8B',
              onClick: () => navigate('/reports'),
            },
          ].map((action, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Button
                variant="outlined"
                startIcon={action.icon}
                onClick={action.onClick}
                sx={{
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 100,
                  width: '100%',
                  borderColor: action.color,
                  color: action.color,
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: `${action.color}10`,
                  },
                }}
              >
                {action.title}
              </Button>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Sales Overview Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title={t('salesOverview')}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={period}
                    onChange={(e, val) => { if (val) setPeriod(val); }}
                    aria-label="period-selector"
                  >
                    <ToggleButton value="1D">1d</ToggleButton>
                    <ToggleButton value="1M">1m</ToggleButton>
                    <ToggleButton value="6M">6m</ToggleButton>
                    <ToggleButton value="1Y">1y</ToggleButton>
                  </ToggleButtonGroup>
                  <Tooltip title={t('more')}>
                    <IconButton aria-label="settings" onClick={() => navigate('/reports')}>
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />
            <Divider />
            <CardContent sx={{ height: 320 }}>
              {(loading || revLoading) ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2E7D32" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#2E7D32" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" tick={{ fill: '#607D8B', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#607D8B', fontSize: 12 }} tickFormatter={formatCurrency} width={80} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#F5F5F5' }} />
                    <Legend />
                    <Bar dataKey="sales" name={t('revenue')} fill="url(#revenueGradient)" stroke="#2E7D32" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    {t('common:noDataAvailable')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sales by Category */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={t('salesByCategory')}
              action={
                <IconButton aria-label="settings" onClick={() => navigate('/reports')}>
                  <MoreVert />
                </IconButton>
              }
            />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    {t('common:noDataAvailable')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Sales */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={t('recentSales')}
              action={
                <Tooltip title={t('more')}>
                  <IconButton aria-label="more" onClick={() => navigate('/sales')}>
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {recentSales.map((sale) => (
                <React.Fragment key={sale.id}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <Typography className="price-wrapper" variant="body2" color="text.primary">
                        {formatCurrency(sale.amount)}
                      </Typography>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#1976D2' }}>
                        <ShoppingCart />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={sale.customer}
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {sale.date}
                          </Typography>
                          {` — ${sale.items} ${t('sales:items')}`}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  variant="text"
                  endIcon={<Add />}
                  onClick={() => navigate('/sales')}
                >
                  {t('viewMore')}
                </Button>
              </Box>
            </List>
          </Card>
        </Grid>

        {/* Low Stock Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title={t('lowStock')}
              action={
                <Tooltip title={t('more')}>
                  <IconButton aria-label="more" onClick={() => navigate('/inventory')}>
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {lowStockProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <ListItem
                    alignItems="flex-start"
                    secondaryAction={
                      <Typography className="price-wrapper" variant="body2" color="error">
                        {product.stock} / {product.minStock}
                      </Typography>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#D32F2F' }}>
                        <Warning />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={product.name}
                      secondary={t('inventory:lowStock')}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  variant="text"
                  endIcon={<Add />}
                  onClick={() => navigate('/inventory')}
                >
                  {t('viewMore')}
                </Button>
              </Box>
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;