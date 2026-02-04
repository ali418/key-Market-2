import { useEffect, useState } from 'react';
import { Container, Typography, Grid, TextField, Paper, Box, Button, Divider } from '@mui/material';
import { getCart, setCart } from '../../hooks/useCart';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const navigate = useNavigate();
  const items = getCart();
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });

  useEffect(() => {}, []);

  const submit = () => {
    alert('تم استلام طلبك. سنتواصل معك قريبًا.');
    setCart([]);
    navigate('/online-store');
  };

  return (
    <Container maxWidth="lg" sx={{ my: 6 }}>
      <Box sx={{ mb: 3, p: 3, borderRadius: 2, background: 'linear-gradient(135deg, #1a1a1a 0%, #111 60%)', color: '#fff', border: '1px solid #2a2a2a' }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: '#C9A227' }}>إتمام الطلب</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>أدخل بياناتك لإتمام تجربة شراء راقية</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #eee' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="الاسم" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="رقم الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="ملاحظات" multiline rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={submit} sx={{ bgcolor: '#C9A227', '&:hover': { bgcolor: '#b8901f' } }}>تأكيد الطلب</Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #eee', position: { md: 'sticky' }, top: { md: 24 } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>ملخص الطلب</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {items.map((i) => (
                <Box key={i.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{i.name} × {i.qty}</Typography>
                  <Typography>{(i.price * i.qty).toFixed(2)} AED</Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Typography sx={{ fontWeight: 800 }}>الإجمالي</Typography>
              <Typography sx={{ color: '#C9A227', fontWeight: 800 }}>{total.toFixed(2)} AED</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;