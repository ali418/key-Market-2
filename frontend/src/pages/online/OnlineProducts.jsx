import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import apiService from '../../api/apiService';

const OnlineProducts = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await apiService.searchProducts({
        q: search || undefined,
        barcode: barcode || undefined,
        is_online: onlyOnline ? true : undefined,
      });
      setProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.userMessage || 'حصل خطأ أثناء تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleBarcodeChange = (e) => setBarcode(e.target.value);
  const handleToggleOnlyOnline = (e) => setOnlyOnline(e.target.checked);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, barcode, onlyOnline]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleProducts = useMemo(() => {
    return products.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [products, page, rowsPerPage]);

  const handleToggleOnline = async (product) => {
    const next = !product.is_online;
    // Optimistic update
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_online: next } : p)));
    try {
      await apiService.setProductOnline(product.id, next);
    } catch (e) {
      // Revert on error
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, is_online: !next } : p)));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          إدارة المنتجات الأونلاين
        </Typography>
        <Tooltip title={t('refresh') || 'تحديث'}>
          <IconButton onClick={fetchProducts} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="بحث بالاسم"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="بحث بالباركود"
              value={barcode}
              onChange={handleBarcodeChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Checkbox checked={onlyOnline} onChange={handleToggleOnlyOnline} />}
              label="عرض المنتجات الأونلاين فقط"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        {!loading && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>المنتج</TableCell>
                    <TableCell>الباركود</TableCell>
                    <TableCell align="right">السعر</TableCell>
                    <TableCell align="center">الأونلاين</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleProducts.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">{product.name || product.name_ar}</Typography>
                          {product.is_online ? (
                            <Chip label="أونلاين" color="success" size="small" />
                          ) : (
                            <Chip label="غير أونلاين" color="default" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{product.barcode || '-'}</TableCell>
                      <TableCell align="right">{product.price ?? '-'}</TableCell>
                      <TableCell align="center">
                        <Checkbox
                          checked={!!product.is_online}
                          onChange={() => handleToggleOnline(product)}
                          inputProps={{ 'aria-label': 'toggle-online' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {t('noRecordsFound') || 'ما في منتجات'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={products.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('rowsPerPage') || 'عدد الصفوف'}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default OnlineProducts;