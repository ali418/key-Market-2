import { useEffect, useState } from 'react';
import { Container, Typography, Box, Grid, Paper, IconButton, Button, TextField, Divider, Stack } from '@mui/material';
import { Delete as DeleteIcon, ShoppingCartCheckout as CheckoutIcon, Add as AddIcon, Remove as RemoveIcon, LocalShipping as ShippingIcon, LocalOffer as OfferIcon } from '@mui/icons-material';
import { getCart, removeFromCart, updateQty } from '../../hooks/useCart';
import { useNavigate } from 'react-router-dom';

const placeholderSrc = '/placeholder-image.png';

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => getCart());
  const [total, setTotal] = useState(() => getCart().reduce((s, i) => s + i.price * i.qty, 0));

  const refresh = () => {
    const data = getCart();
    setItems(data);
    setTotal(data.reduce((s, i) => s + i.price * i.qty, 0));
  };

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('cart:updated', handler);
    return () => window.removeEventListener('cart:updated', handler);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ my: 6 }}>
      <Box sx={{ mb: 3, p: 3, borderRadius: 2, background: 'linear-gradient(135deg, #1a1a1a 0%, #111 60%)', color: '#fff', border: '1px solid #2a2a2a' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#C9A227' }}>سلة التسوق</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>اختيار فاخر، تفاصيل راقية، تجربة تسوق تليق بذائقتك</Typography>
      </Box>
      {items.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>سلتك فارغة</Typography>
          <Typography color="text.secondary">ابدأ التسوق الآن لاكتشاف تشكيلة مميزة</Typography>
          <Button sx={{ mt: 3 }} variant="contained" onClick={() => navigate('/online-store')}>الذهاب للمتجر</Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #eee' }}>
              <Stack spacing={2}>
                {items.map((i) => (
                  <Box key={i.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src={i.image_url || placeholderSrc} alt={i.name} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12 }} onError={(e) => { e.currentTarget.src = placeholderSrc; }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 800 }}>{i.name}</Typography>
                      <Typography color="text.secondary">{i.price.toFixed(2)} AED</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <IconButton size="small" onClick={() => updateQty(i.id, Math.max(1, i.qty - 1))}><RemoveIcon /></IconButton>
                        <TextField type="number" size="small" value={i.qty} onChange={(e) => updateQty(i.id, Math.max(1, Number(e.target.value) || 1))} sx={{ width: 80 }} />
                        <IconButton size="small" onClick={() => updateQty(i.id, i.qty + 1)}><AddIcon /></IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 800, color: '#C9A227' }}>{(i.price * i.qty).toFixed(2)} AED</Typography>
                      <IconButton color="error" onClick={() => removeFromCart(i.id)} sx={{ mt: 1 }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #eee', position: { md: 'sticky' }, top: { md: 24 } }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>ملخص الطلب</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography color="text.secondary">عدد العناصر</Typography>
                <Typography sx={{ fontWeight: 700 }}>{items.reduce((s, i) => s + i.qty, 0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography color="text.secondary">المجموع</Typography>
                <Typography sx={{ fontWeight: 700 }}>{total.toFixed(2)} AED</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <OfferIcon sx={{ color: '#C9A227' }} />
                <TextField size="small" fullWidth placeholder="رمز خصم (اختياري)" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShippingIcon sx={{ color: '#C9A227' }} />
                <Typography color="text.secondary">التوصيل داخل الإمارات خلال 2-3 أيام</Typography>
              </Box>
              <Button fullWidth variant="contained" startIcon={<CheckoutIcon />} onClick={() => navigate('/checkout')} sx={{ fontWeight: 800, bgcolor: '#C9A227', '&:hover': { bgcolor: '#b8901f' } }}>إتمام الطلب</Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Cart;