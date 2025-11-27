import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import apiService from '../../api/apiService';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const SaleDetails = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef();
  const didAutoPrint = useRef(false);
  
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSaleDetails = async () => {
      try {
        setLoading(true);
        const saleData = await apiService.getSaleById(id);
        console.log('Sale data received:', saleData); // Debug log
        setSale(saleData);
        setError(null);
      } catch (err) {
        console.error('Error fetching sale details:', err);
        setError(err.userMessage || err.message || t('sales:errors.failedToLoadSaleDetails'));
      } finally {
        setLoading(false);
      }
    };

    fetchSaleDetails();
  }, [id]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  // Auto-print when "?print=1" is present and sale data is loaded
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldAutoPrint = params.get('print');
    if (shouldAutoPrint && sale && !loading && !didAutoPrint.current) {
      didAutoPrint.current = true;
      // Slight delay to ensure content is fully rendered
      setTimeout(() => {
        try {
          handlePrint && handlePrint();
        } catch (e) {
          console.error('Auto print failed:', e);
        }
      }, 0);
    }
  }, [location.search, sale, loading]);

  const handleCreateInvoice = () => {
    navigate(`/invoices/edit/${id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!sale) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>{t('sales:saleNotFound')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/sales')} sx={{ marginInlineEnd: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {t('sales:saleDetails')} #{sale.id}
          </Typography>
        </Box>
        <Box>
          <Tooltip title={t('print')}>
            <IconButton onClick={handlePrint} color="primary" sx={{ marginInlineEnd: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ReceiptIcon />}
            onClick={handleCreateInvoice}
          >
            {t('sales:createInvoice')}

          </Button>
        </Box>
      </Box>

      <div ref={printRef}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                {t('sales:saleInfo')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('id')}:</strong> #{sale.id}
              </Typography>
              <Typography variant="body1">
                <strong>{t('date')}:</strong> {sale.saleDate ? format(new Date(sale.saleDate), 'PPpp') : t('notAvailable')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('status')}:</strong>{' '}
                {sale.status ? (
                  <Chip
                    label={t(`sales.status.${sale.status}`)}
                    color={getStatusColor(sale.status)}
                    size="small"
                  />
                ) : t('notAvailable')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('sales:paymentMethod')}:</strong>{' '}
                {sale.paymentMethod ? t(`sales:paymentMethods.${sale.paymentMethod}`) : t('notAvailable')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('sales:employee')}:</strong> {sale.employee || t('notAvailable')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                {t('customers:customerInfo')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('customers:name')}:</strong> {sale.customer?.name || t('notAvailable')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('customers:phone')}:</strong> {sale.customer?.phone || t('notAvailable')}
              </Typography>
              <Typography variant="body1">
                <strong>{t('customers:email')}:</strong> {sale.customer?.email || t('notAvailable')}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            {t('sales:items')}
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('products:product')}</TableCell>
                  <TableCell align="right">{t('quantity')}</TableCell>
                  <TableCell>{t('unit')}</TableCell>
                  <TableCell align="right">{t('price')}</TableCell>
                  <TableCell align="right">{t('total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(sale.items) && sale.items.length > 0 ? (
                  sale.items.map((item) => (
                    <TableRow key={item.id || Math.random()}>
                      <TableCell>{item.Product?.name || item.product?.name || item.product || t('notAvailable')}</TableCell>
                      <TableCell align="right">{item.quantity || 0}</TableCell>
                      <TableCell>{item.unit ? t(`units.${item.unit}`) : t('notAvailable')}</TableCell>
                      <TableCell align="right">{(Number(item.unitPrice ?? item.unit_price ?? item.price ?? item.Product?.price ?? 0)).toFixed(2)}</TableCell>
                      <TableCell align="right">{
                        (() => {
                          const q = Number(item.quantity) || 0;
                          const up = Number(item.unitPrice ?? item.unit_price ?? item.price ?? item.Product?.price ?? 0);
                          const total = Number(item.totalPrice ?? item.total_price ?? item.subtotal ?? item.total ?? (up * q - (Number(item.discount) || 0)));
                          return total.toFixed(2);
                        })()
                      }</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">{t('sales:noItems')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container spacing={2} justifyContent="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('subtotal')}:</span>
                    <span>{(Number(sale.subtotal) || 0).toFixed(2)}</span>
                  </Typography>
                  {(Number(sale.tax) || Number(sale.taxAmount)) > 0 && (
                    <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('tax')}:</span>
                      <span>{(Number(sale.tax) || Number(sale.taxAmount) || 0).toFixed(2)}</span>
                    </Typography>
                  )}
                  {(Number(sale.discount) || Number(sale.discountAmount)) > 0 && (
                    <Typography variant="body1" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('discount')}:</span>
                      <span>-{(Number(sale.discount) || Number(sale.discountAmount) || 0).toFixed(2)}</span>
                    </Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>{t('total')}:</span>
                    <span>{(Number(sale.total) || Number(sale.totalAmount) || 0).toFixed(2)}</span>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {sale.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('notes')}
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body1">{sale.notes}</Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      </div>
    </Box>
  );
};

export default SaleDetails;