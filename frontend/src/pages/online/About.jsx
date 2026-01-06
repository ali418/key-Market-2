import React from 'react';
import { Container, Typography, Grid, Box, Paper } from '@mui/material';

const About = () => (
  <Container maxWidth="lg" sx={{ my: 6 }}>
    <Grid container spacing={4} alignItems="center">
      <Grid item xs={12} md={6}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#C9A227' }}>قصتنا</Typography>
        <Typography variant="body1" sx={{ lineHeight: 2 }}>
          بدأت فكرة نسمة جمال بشغف للأناقة والهوية الراقية. نبحث عن الجمال في التفاصيل ونقدّم تجربة فريدة تمزج الأصالة بلمسة عصرية.
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ height: 280, borderRadius: 2, overflow: 'hidden', border: '1px solid #C9A227' }}>
          <Box sx={{ width: '100%', height: '100%', bgcolor: '#111' }} />
        </Paper>
      </Grid>
    </Grid>
  </Container>
);

export default About;