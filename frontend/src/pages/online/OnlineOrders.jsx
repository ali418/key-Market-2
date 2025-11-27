import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const OnlineOrders = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        الطلبات الأونلاين
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography>
          جاري التحضير لعرض الطلبات الأونلاين. سيتم ربطها قريبًا.
        </Typography>
      </Paper>
    </Box>
  );
};

export default OnlineOrders;