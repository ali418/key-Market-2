import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Container, Grid, Typography, Paper, Rating, Button, Tabs, Tab, Divider, Card, CardContent, CardMedia } from '@mui/material';
import apiService from '../../api/apiService';
import { buildPoeticDescription } from '../../utils/poeticDescription';
import { addToCart } from '../../hooks/useCart';

const placeholderSrc = '/placeholder-image.png';

const ProductDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  const getImageSrc = (url) => {
    if (!url) return placeholderSrc;
    if (/^https?:\/\//.test(url)) return url;
    if (url.startsWith('/uploads/')) return url;
    return `/uploads/${url}`;
  };

  const [related, setRelated] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiService.getProductById(id);
        setProduct(data || {});
        const all = await apiService.getProducts();
        const key = (data?.name_ar || data?.name || '').split(/\s+/).filter(Boolean)[0] || '';
        const rel = (all || [])
          .filter((p) => p.id !== data.id)
          .filter((p) => {
            const n = `${p?.name || ''} ${p?.name_ar || ''}`.toLowerCase();
            return key && n.includes(key.toLowerCase());
          })
          .slice(0, 3);
        setRelated(rel);
      } catch (e) {
        setError(e.userMessage || t('common.loadingError', { defaultValue: 'حدث خطأ أثناء التحميل' }));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Typography>{t('loading', { defaultValue: 'جاري التحميل...' })}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Typography>{t('common.noDataAvailable', { defaultValue: 'لا توجد بيانات' })}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 3, p: 3, borderRadius: 2, background: 'linear-gradient(135deg, #1a1a1a 0%, #111 60%)', color: '#fff', border: '1px solid #2a2a2a' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#C9A227' }}>{product?.name || product?.name_ar}</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>نفحة فاخرة بتفاصيل أنيقة تمنحك حضورًا يليق بذوقك</Typography>
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #eee' }}>
            <Box sx={{ height: 420, borderRadius: 2, overflow: 'hidden', border: '1px solid #C9A227' }}>
              <img src={getImageSrc(product?.image_url)} alt={product?.name || product?.name_ar || 'Product'} loading='lazy' decoding='async' style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = placeholderSrc; }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {[product?.image_url, product?.image2, product?.image3].filter(Boolean).slice(0, 3).map((img, idx) => (
                <Box key={idx} sx={{ width: 80, height: 80, border: '1px solid #eee', borderRadius: 2, overflow: 'hidden' }}>
                  <img src={getImageSrc(img)} alt="thumb" loading='lazy' decoding='async' style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = placeholderSrc; }} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Rating value={4} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">(مراجعات)</Typography>
          </Box>
          <Typography variant="h5" sx={{ color: '#C9A227', mb: 2 }}>{product?.price != null ? `${product.price} AED` : t('common.notAvailable', { defaultValue: 'غير متاح' })}</Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>{product?.description_ar || product?.description || product?.longDescription || buildPoeticDescription(product)}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="contained" onClick={() => addToCart(product)} sx={{ bgcolor: '#C9A227', '&:hover': { bgcolor: '#b8901f' } }}>إضافة للسلة</Button>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/online-store')}>عودة للمتجر</Button>
          </Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700 }, '& .MuiTabs-indicator': { backgroundColor: '#C9A227' } }}>
            <Tab label="الوصف" />
            <Tab label="المكونات العطرية" />
            <Tab label="كيفية الاستخدام" />
          </Tabs>
          <Divider sx={{ my: 2 }} />
          {tab === 0 && (
            <Typography variant="body2" sx={{ lineHeight: 1.9 }}>{product?.longDescription || 'تفاصيل أنيقة تعكس روح الجمال مع لمسة راقية تمنحك تجربة فريدة.'}</Typography>
          )}
          {tab === 1 && (
            <Typography variant="body2" sx={{ lineHeight: 1.9 }}>عود، مسك، ورد، حمضيات.</Typography>
          )}
          {tab === 2 && (
            <Typography variant="body2" sx={{ lineHeight: 1.9 }}>يوضع على نقاط النبض للحصول على ثبات وأناقة تدوم.</Typography>
          )}
        </Grid>
      </Grid>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: '#C9A227' }}>منتجات ذات صلة</Typography>
        <Grid container spacing={2}>
          {related.slice(0, 3).map((it, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #eee', transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
                <CardMedia component="img" height="180" image={getImageSrc(it?.image_url)} loading="lazy" />
                <CardContent>
                  <Typography noWrap sx={{ fontWeight: 700 }}>{it?.name || it?.name_ar || 'منتج'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default ProductDetails;