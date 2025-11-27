import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrency } from '../../redux/slices/settingsSlice';
import apiService from '../../api/apiService';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Card,
  CardMedia,
  IconButton,
  FormHelperText,
  Switch,
  FormControlLabel,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save,
  Cancel,
  PhotoCamera,
  Delete,
  ArrowBack,
  Home,
} from '@mui/icons-material';

// Demo data for categories

// Categories state (loaded from API)
const ProductForm = () => {
  const { t } = useTranslation();
 const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const currency = useSelector(selectCurrency);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiService.getCategories();
       const mapped = (data || []).map((c) => ({ id: c.id, name: c.name }));
        setCategories(mapped);
      } catch (err) {
        console.error('Failed to load categories for product form:', err);
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Set document title
  useEffect(() => {
    const titleKey = isEditMode ? 'common.pageTitle.editProduct' : 'common.pageTitle.addProduct';
    document.title = t(titleKey);
  }, [t, isEditMode]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    barcode: '',
    description: '',
    sku: '',
    taxRate: '',
    minStock: '',
    maxStock: '',
    supplier: '',
    isActive: true,
    image: '/placeholder-image.svg',
  });

  // Validation state
  const [errors, setErrors] = useState({});
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load product data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const product = await apiService.getProductById(id);
          if (product) {
            setFormData({
              name: product.name || '',
              category: product.category || '',
              price: product.price?.toString() || '',
              cost: product.cost?.toString() || '',
              stock: (product.stock ?? '').toString(),
              barcode: product.barcode || '',
              is_generated_barcode: product.is_generated_barcode || false,
              description: product.description || '',
              sku: product.sku || '',
              taxRate: product.taxRate?.toString() || '',
              minStock: product.minStock?.toString() || '',
              maxStock: product.maxStock?.toString() || '',
              supplier: product.supplier || '',
              isActive: product.isActive !== false,
              image: product.image_url
                ? (product.image_url.startsWith('http') ? product.image_url : `/uploads/${product.image_url}`)
                : '/placeholder-image.svg',
            });
          } else {
            setNotification({ open: true, message: t('products:productNotFound'), severity: 'error' });
            navigate('/products');
          }
        } catch (err) {
          console.error('Failed to load product for edit:', err);
          setNotification({ open: true, message: err.userMessage || t('common:errorLoading'), severity: 'error' });
          navigate('/products');
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode, navigate, t]);

  // Handle form input changes
  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    
    // إذا كان الحقل هو الباركود وتم تغييره يدويًا، قم بإعادة تعيين علامة is_generated_barcode إلى false
    if (name === 'barcode') {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
        is_generated_barcode: false // إعادة تعيين العلامة عند التعديل اليدوي
      }));
      
      // التحقق من فريدية الباركود إذا كان الإدخال يدويًا وكان طول الباركود 12 رقمًا
      if (value.length === 12 && /^\d+$/.test(value)) {
        try {
          const exists = await apiService.checkBarcodeExists(value, isEditMode ? id : null);
          if (exists) {
            setErrors(prev => ({ ...prev, barcode: t('products:barcodeExists', { defaultValue: 'هذا الباركود موجود بالفعل' }) }));
          } else {
            setErrors(prev => ({ ...prev, barcode: null }));
          }
        } catch (error) {
          console.error('Error checking barcode uniqueness:', error);
        }
      }
    } else {
      // للحقول الأخرى، استخدم السلوك العادي
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Store the actual file for later upload
      setImageFile(file);
      
      // Create a local URL for preview
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
    }
  };
  
  // Clean up object URLs when component unmounts or when image changes
  useEffect(() => {
    // Only cleanup when the image is an object URL
    if (formData.image && typeof formData.image === 'string' && formData.image.startsWith('blob:')) {
      return () => {
        try {
          URL.revokeObjectURL(formData.image);
        } catch (e) {
          // ignore
        }
      };
    }
  }, [formData.image]);

  // Validate form
  const validateForm = async () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('validation:required');
    }
    
    if (!formData.category) {
      newErrors.category = t('validation:required');
    }
    
    if (!formData.price) {
      newErrors.price = t('validation:required');
    } else if (isNaN(formData.price) || parseFloat(formData.price) < 0) {
      newErrors.price = t('validation:invalidNumber');
    }
    
    if (!formData.cost) {
      newErrors.cost = t('validation:required');
    } else if (isNaN(formData.cost) || parseFloat(formData.cost) < 0) {
      newErrors.cost = t('validation:invalidNumber');
    }
    
    // التحقق من فريدية الباركود إذا لم يكن مولدًا تلقائيًا
    if (formData.barcode && !formData.is_generated_barcode) {
      try {
        const exists = await apiService.checkBarcodeExists(formData.barcode, isEditMode ? id : null);
        if (exists) {
          newErrors.barcode = t('products:barcodeExists', { defaultValue: 'هذا الباركود موجود بالفعل' });
        }
      } catch (error) {
        console.error('Error checking barcode uniqueness during validation:', error);
      }
    }
    
    if (!formData.stock) {
      newErrors.stock = t('validation:required');
    } else if (isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      newErrors.stock = t('validation:invalidNumber');
    }
    
    if (!formData.barcode.trim()) {
      newErrors.barcode = t('validation:required');
    }
    
    if (formData.taxRate && (isNaN(formData.taxRate) || parseFloat(formData.taxRate) < 0)) {
      newErrors.taxRate = t('validation:invalidNumber');
    }
    
    if (formData.minStock && (isNaN(formData.minStock) || parseInt(formData.minStock) < 0)) {
      newErrors.minStock = t('validation:invalidNumber');
    }
    
    if (formData.maxStock && (isNaN(formData.maxStock) || parseInt(formData.maxStock) < 0)) {
      newErrors.maxStock = t('validation:invalidNumber');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Store the actual file when uploaded
  const [imageFile, setImageFile] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (isValid) {
      try {
        // Prepare data for API
        const productData = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          category: formData.category,
          cost: parseFloat(formData.cost),
          sku: formData.sku,
          barcode: formData.barcode,
          is_generated_barcode: formData.is_generated_barcode || false,
          taxRate: formData.taxRate ? parseFloat(formData.taxRate) : null,
          minStock: formData.minStock ? parseInt(formData.minStock) : null,
          maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
          supplier: formData.supplier,
          isActive: formData.isActive,
          // image_url will be set after successful upload if a new file is selected
        };
        
        console.log('Preparing product data for API:', productData);

        // If user selected an image file, upload it first
        let finalProductData = { ...productData };
        try {
          if (imageFile) {
            console.log('Uploading product image...');
            try {
              const uploadResult = await apiService.uploadFile(imageFile);
              console.log('Upload result:', uploadResult);
              const uploadedFileName = uploadResult?.fileName || (uploadResult?.fileUrl ? uploadResult.fileUrl.split('/').pop() : null);
              if (uploadedFileName) {
                finalProductData.image_url = uploadedFileName;
              }
            } catch (uploadError) {
              console.error('Error uploading image, continuing without image:', uploadError);
              // Continue without image if upload fails
            }
          } else if (isEditMode && formData.image && typeof formData.image === 'string' && formData.image.includes('/uploads/')) {
            // Preserve existing image when editing if user didn't pick a new one
            finalProductData.image_url = formData.image.split('/').pop();
          }
        } catch (imageError) {
          console.error('Error processing image, continuing without image:', imageError);
          // Continue without image if processing fails
        }
        
        // Call API to create or update product
        if (isEditMode) {
          await apiService.updateProduct(id, finalProductData);

        } else {
          const createdProduct = await apiService.createProduct(finalProductData);

          // After creating the product, create corresponding inventory record
          try {
            await apiService.createInventory({
              productId: createdProduct.id,
              quantity: parseInt(formData.stock) || 0,
              minStockLevel: formData.minStock ? parseInt(formData.minStock) : 0,
            });
          } catch (invErr) {
            console.error('Error creating inventory for new product:', invErr);
            throw invErr;
          }
        }

        setNotification({
          open: true,
          message: isEditMode ? t('products:productUpdated') : t('products:productAdded'),
          severity: 'success',
        });
        
        // Navigate back to products list after a short delay
        setTimeout(() => {
          navigate('/products');
        }, 1500);
      } catch (error) {
        console.error('Error saving product:', error);
        setNotification({
          open: true,
          message: error.userMessage || t('errorOccurred'),
          severity: 'error',
        });
      }
    }
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          href="/" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ marginInlineEnd: 0.5 }} fontSize="inherit" />
          {t('home')}
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/products"
          onClick={(e) => {
            e.preventDefault();
            navigate('/products');
          }}
        >
          {t('products:products')}
        </Link>
        <Typography color="text.primary">
          {isEditMode ? t('products:editProduct') : t('products:addProduct')}
        </Typography>
      </Breadcrumbs>
      
      {/* Page title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isEditMode ? t('products:editProduct') : t('products:addProduct')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/products')}
        >
          {t('back')}
        </Button>
      </Box>
      
      {/* Product form */}
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left column - Basic info */}
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              {t('products:basicInfo')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('products:productName')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={Boolean(errors.name)}
                  helperText={errors.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(errors.category)} required>
                  <InputLabel id="category-label">{t('products:category')}</InputLabel>
                  <Select
                    labelId="category-label"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label={t('products:category')}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('products:barcode')}
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  error={Boolean(errors.barcode)}
                  helperText={errors.barcode}
                  required
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={async () => {
                            try {
                              // استخدام الوظيفة الجديدة لتوليد باركود فريد
                              const uniqueBarcode = await apiService.generateUniqueBarcode();
                              
                              // تعيين الباركود وتحديد أنه تم توليده تلقائيًا
                              setFormData(prev => ({
                                ...prev,
                                barcode: uniqueBarcode,
                                is_generated_barcode: true // تأكيد تعيين هذه القيمة إلى true
                              }));
                              
                              // مسح أي خطأ في حقل الباركود
                              if (errors.barcode) {
                                setErrors(prev => ({ ...prev, barcode: null }));
                              }
                              
                              console.log('Generated barcode with is_generated_barcode=true:', uniqueBarcode);
                              
                              // إظهار رسالة نجاح
                              setNotification({
                                open: true,
                                message: t('products:barcodeGenerated', { defaultValue: 'تم توليد باركود فريد بنجاح' }),
                                severity: 'success'
                              });
                            } catch (error) {
                              console.error('Error generating unique barcode:', error);
                              setNotification({
                                open: true,
                                message: error.userMessage || t('products:barcodeGenerationFailed', { defaultValue: 'فشل في توليد باركود فريد' }),
                                severity: 'error'
                              });
                            }
                          }}
                        >
                          {t('products:generate', { defaultValue: 'توليد' })}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('products:sku')}
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  error={Boolean(errors.sku)}
                  helperText={errors.sku}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('products:description')}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              {t('products:pricing')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('products:sellingPrice')}
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  error={Boolean(errors.price)}
                  helperText={errors.price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"> {currency.symbol}</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('products:costPrice')}
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  error={Boolean(errors.cost)}
                  helperText={errors.cost}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{currency.symbol}</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('products:taxRate')}
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  error={Boolean(errors.taxRate)}
                  helperText={errors.taxRate}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              {t('products:inventory')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('products:currentStock')}
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  error={Boolean(errors.stock)}
                  helperText={errors.stock}
                  type="number"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('products:minStock')}
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  error={Boolean(errors.minStock)}
                  helperText={errors.minStock}
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label={t('products:maxStock')}
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleChange}
                  error={Boolean(errors.maxStock)}
                  helperText={errors.maxStock}
                  type="number"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('products:supplier')}
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Right column - Image and status */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              {t('products:productImage')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Card sx={{ width: '100%', mb: 2 }}>
                <CardMedia
                  component="img"
                  height="250"
                  image={formData.image}
                  alt={formData.name || t('products:productImage')}
                  onError={(e) => {
                    if (e?.target && e.target.src !== window.location.origin + '/placeholder-image.svg') {
                      e.target.src = '/placeholder-image.svg';
                    }
                  }}
                />
              </Card>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  {t('products:uploadImage')}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                
                <IconButton 
                  color="error" 
                  onClick={() => {
                    // Reset image to default and clear the file
                    setFormData(prev => ({ ...prev, image: '/placeholder-image.svg' }));
                    setImageFile(null);
                  }}
                  disabled={formData.image === '/placeholder-image.svg'}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              {t('products:status')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleChange}
                  name="isActive"
                  color="primary"
                />
              }
              label={formData.isActive ? t('products:active') : t('products:inactive')}
            />
          </Grid>
          
          {/* Form actions */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => navigate('/products')}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save />}
              >
                {isEditMode ? t('update') : t('save')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductForm;