import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Rating,
  Skeleton,
  MenuItem,
  Select,
  FormControl,
  IconButton,
  AppBar,
  Toolbar,
  Button,
  Divider,
  Container,
  Badge,
  Drawer,
  Stack,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { Search as SearchIcon, ShoppingCart as ShoppingCartIcon, AccountCircle as AccountIcon, Facebook, Instagram, FilterList, Close as CloseIcon } from '@mui/icons-material';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import apiService from '../../api/apiService';
import brandLogo from '../../assets/logo/logo-nasmat-jamal.svg';
import { useNavigate } from 'react-router-dom';
import { addToCart, getCart } from '../../hooks/useCart';
const placeholderSrc = '/placeholder-image.png';

const OnlineStore = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.dir() === 'rtl';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const productsRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [cartCount, setCartCount] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await apiService.searchProducts({ q: query || undefined, is_online: true });
      setProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e.userMessage || t('common.loadingError', { defaultValue: 'حدث خطأ أثناء التحميل' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleCategoryChange = (event, newCat) => {
    if (newCat) setCategory(newCat);
  };
  const handleSortChange = (e) => setSort(e.target.value);

  const categorized = useMemo(() => {
    const catFilter = (p) => {
      if (category === 'all') return true;
      const n = `${p?.name || ''} ${p?.name_ar || ''}`.toLowerCase();
      if (category === 'perfumes') return /(perfume|عطر|عود|مسك)/i.test(n);
      if (category === 'beauty') return /(makeup|مكياج|روج|بودرة|مسكارا)/i.test(n);
      if (category === 'creams') return /(cream|كريم|مرطب|لوشن)/i.test(n);
      return true;
    };
    const priceFilter = (p) => {
      const price = Number(p?.price ?? 0);
      return price >= priceRange[0] && price <= priceRange[1];
    };
    return products.filter((p) => catFilter(p) && priceFilter(p));
  }, [products, category, priceRange]);

  const sorted = useMemo(() => {
    const arr = [...categorized];
    if (sort === 'price_asc') arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (sort === 'price_desc') arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else arr.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return arr;
  }, [categorized, sort]);

  const suggestions = useMemo(() => {
    const names = products.map((p) => (p?.name_ar || p?.name || '').trim()).filter(Boolean);
    return Array.from(new Set(names)).slice(0, 10);
  }, [products]);

  const getImageSrc = (url) => {
    if (!url) return placeholderSrc;
    if (/^https?:\/\//.test(url)) return url;
    if (url.startsWith('/uploads/')) return url;
    return `/uploads/${url}`;
  };

  const featuredCategories = [
    { key: 'wallets', title: 'المحافظ', img: placeholderSrc },
    { key: 'bags', title: 'الحقائب', img: placeholderSrc },
    { key: 'accessories', title: 'الإكسسوارات', img: placeholderSrc },
  ];

  const scrollToProducts = () => {
    const el = productsRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const refreshCart = () => {
      const c = getCart();
      setCartCount(c.reduce((s, i) => s + i.qty, 0));
    };
    refreshCart();
    const handler = (e) => setCartCount(e.detail?.count ?? cartCount);
    window.addEventListener('cart:updated', handler);
    return () => window.removeEventListener('cart:updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ProductCard = ({ item }) => (
    <Card elevation={1} sx={{ borderRadius: 2, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 } }}>
      <CardActionArea>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component='img'
            height='220'
            image={getImageSrc(item?.image_url)}
            onError={(e) => { e.currentTarget.src = placeholderSrc; }}
            alt={item?.name || item?.name_ar || 'Product'}
            sx={{ objectFit: 'cover' }}
          />
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.05)', opacity: 0, transition: 'opacity 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, '&:hover': { opacity: 1 } }}>
            <Button variant='contained' color='primary' size='small' onClick={() => addToCart(item)}>إضافة للسلة</Button>
            <Button variant='outlined' color='inherit' size='small' onClick={() => { setSelectedProduct(item); setDetailsOpen(true); }}>تفاصيل</Button>
          </Box>
        </Box>
        <CardContent>
          <Typography variant='subtitle1' noWrap sx={{ fontWeight: 700 }}>
            {item?.name || item?.name_ar}
          </Typography>
          <Typography variant='body2' color='text.secondary' noWrap>
            {item?.description || item?.description_ar || ''}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant='h6' sx={{ color: '#C9A227' }}>
              {item?.price != null ? `${item.price} AED` : t('common.notAvailable', { defaultValue: 'غير متاح' })}
            </Typography>
            <Rating size='small' value={4} readOnly />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  return (
    <Box>
      {/* Navbar */}
      <AppBar position='static' color='default' elevation={0} sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Container maxWidth='lg'>
          <Toolbar disableGutters sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src={brandLogo} alt='Nasmat Jamal' onError={(e) => { e.currentTarget.src = placeholderSrc; }} style={{ width: 40, height: 40, objectFit: 'contain' }} />
              <Typography variant='h6' sx={{ fontWeight: 800 }}>نسمة جمال</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button color='inherit' href='/online-store'>{t('common.store', { defaultValue: 'Store' })}</Button>
              <Button color='inherit' href='/about'>{t('common.about', { defaultValue: 'About' })}</Button>
              <Button color='inherit' href='/contact'>{t('common.contact', { defaultValue: 'Contact' })}</Button>
              <Box sx={{ mx: 1 }}>
                <LanguageSwitcher />
              </Box>
              <IconButton color='inherit' aria-label='search'>
                <SearchIcon />
              </IconButton>
              <IconButton color='inherit' aria-label='account'>
                <AccountIcon />
              </IconButton>
              <IconButton color='inherit' aria-label='cart' onClick={() => navigate('/cart')}>
                <Badge badgeContent={cartCount} color='primary'>
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <Paper sx={{ py: 8, mb: 4, background: '#000', color: '#fff' }}>
        <Container maxWidth='lg'>
          <Grid container spacing={4} alignItems='center'>
            <Grid item xs={12} md={6}>
              <Typography variant='h3' sx={{ fontWeight: 800, mb: 2, color: '#C9A227' }}>
                استمتع برفاهية الأناقة الخالدة
              </Typography>
              <Typography variant='body1' sx={{ mb: 3, maxWidth: 560 }}>
                نقدّم مجموعة راقية من العطور والأناقة. تمتاز منتجاتنا بعناية فائقة تعكس روح الجمال مع لمسة راقية تمنحك تجربة فريدة لا تُنسى.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant='contained' color='secondary' onClick={scrollToProducts}>
                  تسوق الآن
                </Button>
                <Button variant='outlined' color='inherit' href='/online-store'>
                  اكتشف مجموعتنا
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ height: 260, borderRadius: 2, overflow: 'hidden', border: '1px solid #C9A227' }}>
                <img src={placeholderSrc} alt='Hero' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Featured Categories */}
      <Container maxWidth='lg'>
        <Box sx={{ mb: 4 }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 2 }}>أقسام مميزة</Typography>
          <Grid container spacing={2}>
            {featuredCategories.map((cat) => (
              <Grid item xs={12} sm={6} md={4} key={cat.key}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardActionArea onClick={() => setCategory(cat.key)}>
                    <CardMedia component='img' height='160' image={cat.img} alt={cat.title} />
                    <CardContent>
                      <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>{cat.title}</Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      <Divider />

      {/* Products Grid */}
      <Container maxWidth='lg' ref={productsRef}>
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant='h5' sx={{ fontWeight: 800 }}>{t('common.featuredProducts', { defaultValue: 'Featured Products' })}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Autocomplete
              freeSolo
              options={suggestions}
              value={query}
              onChange={(_, v) => {
                if (typeof v === 'string') {
                  setQuery(v);
                  const norm = v.toLowerCase();
                  const found = products.find((p) => {
                    const n1 = (p?.name || '').toLowerCase();
                    const n2 = (p?.name_ar || '').toLowerCase();
                    return n1 === norm || n2 === norm || n1.includes(norm) || n2.includes(norm);
                  });
                  if (found) { setSelectedProduct(found); setDetailsOpen(true); }
                }
              }}
              onInputChange={(_, v) => setQuery(v)}
              openOnFocus
              sx={{ minWidth: 280 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size='small'
                  placeholder={t('common.searchProducts', { defaultValue: 'ابحث عن منتج...' })}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (<InputAdornment position='start'><SearchIcon /></InputAdornment>),
                  }}
                />
              )}
            />
            <IconButton onClick={() => setFiltersOpen(true)} aria-label='filters'>
              <FilterList />
            </IconButton>
            <FormControl size='small'>
              <Select value={sort} onChange={handleSortChange} displayEmpty>
                <MenuItem value='latest'>{t('common.latest', { defaultValue: 'Latest' })}</MenuItem>
                <MenuItem value='price_asc'>{t('common.priceLowHigh', { defaultValue: 'Price: Low to High' })}</MenuItem>
                <MenuItem value='price_desc'>{t('common.priceHighLow', { defaultValue: 'Price: High to Low' })}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Skeleton variant='rectangular' height={280} />
                </Grid>
              ))}
            </Grid>
          ) : error ? (
            <Paper sx={{ p: 2 }}>
              <Typography color='error'>{error}</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {sorted.slice(0, 12).map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <ProductCard item={item} />
                </Grid>
              ))}
              {sorted.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>{t('common.noRecordsFound', { defaultValue: 'ما في منتجات' })}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Container>

      <Drawer anchor={isRTL ? 'right' : 'left'} open={filtersOpen} onClose={() => setFiltersOpen(false)}>
        <Box sx={{ width: 300, p: 2 }} role='presentation'>
          <Typography variant='h6' sx={{ fontWeight: 800, mb: 2 }}>{t('common.filters', { defaultValue: 'Filters' })}</Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant='subtitle2' sx={{ mb: 1 }}>{t('common.category', { defaultValue: 'Category' })}</Typography>
          <ToggleButtonGroup
            exclusive
            value={category}
            onChange={handleCategoryChange}
            fullWidth
            sx={{ mb: 3 }}
          >
            <ToggleButton value='all'>الكل</ToggleButton>
            <ToggleButton value='perfumes'>عطور</ToggleButton>
            <ToggleButton value='beauty'>تجميل</ToggleButton>
            <ToggleButton value='creams'>كريمات</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant='subtitle2' sx={{ mb: 1 }}>{t('common.priceRange', { defaultValue: 'Price Range' })}</Typography>
          <Stack direction='row' spacing={1} alignItems='center'>
            <TextField size='small' value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])} sx={{ width: 90 }} />
            <Typography>-</Typography>
            <TextField size='small' value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 0])} sx={{ width: 90 }} />
          </Stack>
          <Slider value={priceRange} onChange={(_, v) => setPriceRange(v)} min={0} max={1000} sx={{ mt: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant='contained' onClick={() => setFiltersOpen(false)}>{t('common.apply', { defaultValue: 'Apply' })}</Button>
          </Box>
        </Box>
      </Drawer>

      {/* Footer (dark + gold style) */}
      <Box component='footer' sx={{ mt: 6, py: 6, backgroundColor: '#000', color: '#fff' }}>
        <Container maxWidth='lg'>
          <Grid container spacing={4} alignItems='center'>
            {/* Contact */}
            <Grid item xs={12} md={3}>
              <Typography variant='h6' sx={{ fontWeight: 800, mb: 2, color: '#C9A227' }}>{t('common.contactUs', { defaultValue: 'Contact Us' })}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant='body2'>
                  <span style={{ color: '#C9A227' }}>✉</span> <Button href='mailto:info@nasmatjamal.com' color='inherit' sx={{ p: 0, minWidth: 'auto' }}>info@nasmatjamal.com</Button>
                </Typography>
                <Typography variant='body2'>
                  <span style={{ color: '#C9A227' }}>✆</span> <Button href='tel:+971581398039' color='inherit' sx={{ p: 0, minWidth: 'auto' }}>+971581398039</Button>
                </Typography>
                <Typography variant='body2'>
                  <span style={{ color: '#C9A227' }}>✆</span> <Button href='tel:+971502497632' color='inherit' sx={{ p: 0, minWidth: 'auto' }}>+971502497632</Button>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                  {/* Instagram */}
                  <IconButton href='https://www.instagram.com/nasmat_jamal_/' target='_blank' rel='noopener noreferrer' aria-label='instagram' sx={{ border: '1px solid #fff', color: '#C9A227' }}>
                    <Instagram />
                  </IconButton>
                  {/* TikTok (inline svg) */}
                  <IconButton href='https://www.tiktok.com/@nasmatjamal1?is_from_webapp=1&sender_device=pc' target='_blank' rel='noopener noreferrer' aria-label='tiktok' sx={{ border: '1px solid #fff', color: '#C9A227' }}>
                    <Box component='span' sx={{ display: 'inline-flex' }}>
                      <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
                        <path d='M17 4c.5 1.9 2 3.3 3.9 3.8v2.3c-1.5-.1-2.9-.6-4-1.4v6.1c0 4.1-2.7 6-5.5 6-2.6 0-4.7-1.8-4.7-4.6 0-3 2.2-4.6 4.8-4.6.4 0 .8 0 1.1.1v2.4c-.3-.1-.6-.1-1-.1-1.3 0-2.4.9-2.4 2.3 0 1.5 1.1 2.3 2.3 2.3 1.4 0 2.4-.9 2.4-2.7V4H17z'/>
                      </svg>
                    </Box>
                  </IconButton>
                  {/* Facebook */}
                  <IconButton href='https://www.facebook.com/share/19apYxGQ2L/' target='_blank' rel='noopener noreferrer' aria-label='facebook' sx={{ border: '1px solid #fff', color: '#C9A227' }}>
                    <Facebook />
                  </IconButton>
                </Box>
              </Box>
            </Grid>

            {/* Info links */}
            <Grid item xs={12} md={3}>
              <Typography variant='h6' sx={{ fontWeight: 800, mb: 2, color: '#C9A227' }}>معلومات</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button href='/online-store' color='inherit' sx={{ justifyContent: 'flex-start' }}>تسوق الآن</Button>
                <Button href='/about' color='inherit' sx={{ justifyContent: 'flex-start' }}>من نحن</Button>
                <Button href='/contact' color='inherit' sx={{ justifyContent: 'flex-start' }}>معلومات الإرجاع</Button>
              </Box>
            </Grid>

            {/* Language switcher */}
            <Grid item xs={12} md={3}>
              <Typography variant='h6' sx={{ fontWeight: 800, mb: 2, color: '#C9A227' }}>{t('common.language', { defaultValue: 'Language' })}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LanguageSwitcher />
              </Box>
            </Grid>

            {/* Brand logo */}
            <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'inline-block', background: '#111', p: 2, borderRadius: 1 }}>
                <img src={brandLogo} alt='Nasmat Jamal' style={{ height: 64, objectFit: 'contain' }} />
              </Box>
            </Grid>

            {/* Tagline */}
            <Grid item xs={12} md={3}>
              <Typography variant='h6' sx={{ fontWeight: 800, mb: 2, color: '#C9A227' }}>استمتع برفاهية الأناقة الخالدة</Typography>
              <Typography variant='body2' sx={{ lineHeight: 1.8 }}>
                نقدّم مجموعة راقية من العطور والأناقة. تمتاز منتجاتنا بعناية فائقة تعكس روح الجمال مع لمسة راقية تمنحك تجربة فريدة لا تُنسى.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid #eee' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 800 }}>{selectedProduct?.name || selectedProduct?.name_ar}</Typography>
          <IconButton onClick={() => setDetailsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <CardMedia component='img' height='300' image={getImageSrc(selectedProduct?.image_url)} onError={(e) => { e.currentTarget.src = placeholderSrc; }} sx={{ objectFit: 'cover', borderRadius: 2 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='h6' sx={{ color: '#C9A227', fontWeight: 800, mb: 1 }}>
                {selectedProduct?.price != null ? `${selectedProduct.price} AED` : t('common.notAvailable', { defaultValue: 'غير متاح' })}
              </Typography>
              <Typography variant='body2' sx={{ mb: 2 }}>
                {selectedProduct?.description_ar || selectedProduct?.description || selectedProduct?.longDescription || ''}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant='contained' onClick={() => addToCart(selectedProduct)} sx={{ bgcolor: '#C9A227', '&:hover': { bgcolor: '#b8901f' } }}>إضافة للسلة</Button>
                <Button variant='outlined' onClick={() => setDetailsOpen(false)}>إغلاق</Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default OnlineStore;