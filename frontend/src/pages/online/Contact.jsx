import React from 'react';
import { Container, Typography, Grid, TextField, Button, Box } from '@mui/material';

const Contact = () => (
  <Container maxWidth="md" sx={{ my: 6 }}>
    <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>اتصل بنا</Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="الاسم" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="البريد الإلكتروني" />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth label="رسالتك" multiline rows={4} />
      </Grid>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained">إرسال</Button>
        </Box>
      </Grid>
    </Grid>
  </Container>
);

export default Contact;