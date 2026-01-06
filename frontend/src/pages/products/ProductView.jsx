import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, CircularProgress, Button, Grid, Divider } from '@mui/material';
import apiService from '../../api/apiService';

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await apiService.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError('Failed to fetch product details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!product) {
    return <Typography>Product not found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Product Details
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6">{product.name}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={6}>
            <Typography><strong>Price:</strong> {product.price}</Typography>
            <Typography><strong>Stock:</strong> {product.stock}</Typography>
            <Typography><strong>Category:</strong> {product.category.name}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography><strong>Barcode:</strong> {product.barcode}</Typography>
            <Typography><strong>Status:</strong> {product.status}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={() => navigate('/products')}>
              Back to Products
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProductView;