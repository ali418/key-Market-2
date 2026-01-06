import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { selectStoreSettings } from '../redux/slices/settingsSlice';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { format } from 'date-fns';

// Professional A4 print styles
const printStyles = {
  '@media print': {
    '@page': {
      size: 'A4',
      margin: '15mm',
    },
    body: {
      '-webkit-print-color-adjust': 'exact',
      'color-adjust': 'exact',
    },
  },
};

const InvoicePrint = forwardRef(({ invoice }, ref) => {
  const { t } = useTranslation();
  const storeSettings = useSelector(selectStoreSettings);

  if (!invoice) {
    return (
      <Box ref={ref} sx={{ display: 'none' }}>
        <Typography>{t('noInvoiceData')}</Typography>
      </Box>
    );
  }

  // Generate invoice number using settings
  const invoiceNumber = `${storeSettings?.invoicePrefix || 'INV'}${invoice.id}${storeSettings?.invoiceSuffix || ''}`;
  const derivedTaxPercent = invoice?.subtotal ? Number((((invoice.tax || 0) / invoice.subtotal) * 100).toFixed(2)) : 0;
  const taxRatePercent = Number(storeSettings?.taxRate) || derivedTaxPercent;

  return (
    <Box 
      ref={ref} 
      className="invoice-print-container"
      sx={{ 
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        backgroundColor: 'white',
        color: '#333',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        fontSize: '12px',
        lineHeight: 1.4,
        position: 'relative',
        '@media print': {
          margin: 0,
          boxShadow: 'none',
          '-webkit-print-color-adjust': 'exact',
          'color-adjust': 'exact',
        }
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: '20mm',
          height: '100%',
          boxShadow: 'none',
          '@media print': {
            boxShadow: 'none',
            margin: 0,
            padding: '15mm',
          }
        }}
      >
        {/* Professional Header with UAE Theme */}
        <Box sx={{ 
          borderBottom: '4px solid #1976d2',
          pb: 3,
          mb: 4,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: '-4px',
            left: 0,
            width: '100px',
            height: '2px',
            backgroundColor: '#ff9800',
          }
        }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={6}>
              {storeSettings?.invoiceShowLogo && (
                <Box sx={{ mb: 2 }}>
                  <img 
                    src={storeSettings?.logoUrl || '/logo-nasmat-jamal.svg'} 
                    alt="Store Logo" 
                    style={{ 
                      maxHeight: '80px',
                      maxWidth: '220px',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              )}
              {/* Brand name (English | Arabic) */}
              <Box sx={{ mb: 1 }}>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  sx={{ 
                    fontWeight: '800',
                    color: '#D4AF37',
                    letterSpacing: '1px',
                    fontSize: '22px'
                  }}
                >
                  {storeSettings?.name ? storeSettings.name : 'NASMAT JAMAL'}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ fontWeight: '700', color: '#2E7D32' }}
                >
                  {storeSettings?.name ? storeSettings.name : 'نسمة جمال'}
                </Typography>
              </Box>
              {/* Tagline */}
              <Typography variant="body2" sx={{ color: '#555', mb: 1 }}>
                PERFUMES & COSMETICS TRADING | تجارة العطور ومستحضرات التجميل
              </Typography>
              <Box sx={{ color: '#666', fontSize: '11px' }}>
                {storeSettings?.address && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    📍 {storeSettings.address}
                  </Typography>
                )}
                {storeSettings?.city && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {[storeSettings.city, storeSettings.state, storeSettings.country].filter(Boolean).join(', ')}
                  </Typography>
                )}
                {storeSettings?.phone && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    📞 {storeSettings.phone}
                  </Typography>
                )}
                {storeSettings?.email && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    ✉️ {storeSettings.email}
                  </Typography>
                )}
                {storeSettings?.invoiceShowTaxNumber && storeSettings?.taxRate > 0 && (
                  <Typography variant="body2">
                    {t('taxNumber')}: {storeSettings.taxRate}%
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold', mt: 1 }}>
                  🇦🇪 دولة الإمارات العربية المتحدة | United Arab Emirates
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography 
                variant="h3" 
                component="h2" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  mb: 2,
                  fontSize: '36px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
              >
                فاتورة | INVOICE
              </Typography>
              <Box sx={{ 
                backgroundColor: '#f8f9fa',
                p: 2,
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  <span style={{ color: '#666' }}>{t('sales:invoiceNumber')}:</span> {invoiceNumber}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <span style={{ color: '#666' }}>{t('date')}:</span> {format(new Date(invoice.date), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <span style={{ color: '#666' }}>{t('sales:dueDate')}:</span> {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <span style={{ color: '#666' }}>{t('status')}:</span> 
                  <span style={{ 
                    color: invoice.status === 'paid' ? '#28a745' : invoice.status === 'pending' ? '#ffc107' : '#dc3545',
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}>
                    {t(`sales.invoiceStatus.${invoice.status}`)}
                  </span>
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1, fontFamily: 'monospace' }}>
                  العملة: درهم إماراتي (AED)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Customer Information Section */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Box sx={{ 
              backgroundColor: '#f8f9fa',
              p: 3,
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              borderRight: '4px solid #1976d2'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  mb: 2,
                  fontSize: '16px'
                }}
              >
                {t('sales:billTo')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#333' }}>
                {invoice.customer?.name || t('sales:walkInCustomer')}
              </Typography>
              {invoice.customer?.email && (
                <Typography variant="body2" sx={{ mb: 0.5, color: '#666' }}>
                  ✉️ {invoice.customer.email}
                </Typography>
              )}
              {invoice.customer?.phone && (
                <Typography variant="body2" sx={{ color: '#666' }}>
                  📞 {invoice.customer.phone}
                </Typography>
              )}
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ 
              backgroundColor: '#f8f9fa',
              p: 3,
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              borderRight: '4px solid #ff9800'
            }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#ff9800',
                  mb: 2,
                  fontSize: '16px'
                }}
              >
                {t('sales:paymentInfo')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <span style={{ color: '#666' }}>{t('sales:paymentMethod')}:</span>
                <br />
                <strong>{t(`sales.paymentMethods.${invoice.paymentMethod}`)}</strong>
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Items Table with Professional Styling */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: '#1976d2',
              mb: 2,
              fontSize: '16px'
            }}
          >
            {t('sales:itemsDetails')}
          </Typography>
          <TableContainer 
            component={Paper} 
            variant="outlined" 
            sx={{ 
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #e9ecef'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  backgroundColor: '#1976d2',
                  '& .MuiTableCell-head': {
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    borderBottom: 'none'
                  }
                }}>
                  <TableCell sx={{ width: '40%' }}>{t('products:product')}</TableCell>
                  <TableCell align="center" sx={{ width: '15%' }}>{t('quantity')}</TableCell>
                  <TableCell align="center" sx={{ width: '15%' }}>{t('unit')}</TableCell>
                  <TableCell align="right" sx={{ width: '15%' }}>{t('price')}</TableCell>
                  <TableCell align="right" sx={{ width: '15%' }}>{t('total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <TableRow 
                      key={item.id || index}
                      sx={{ 
                        '&:nth-of-type(even)': {
                          backgroundColor: '#f8f9fa',
                        },
                        '&:hover': {
                          backgroundColor: '#e3f2fd',
                        },
                        '& .MuiTableCell-body': {
                          borderBottom: '1px solid #e9ecef',
                          fontSize: '12px'
                        }
                      }}
                    >
                      <TableCell sx={{ fontWeight: '500' }}>
                        {item.product?.name || t('unknownProduct')}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        {item.quantity || 0}
                      </TableCell>
                      <TableCell align="center">
                        {item.product?.unit || 'قطعة'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                        <Box component="span" sx={{ color: '#1976d2', fontWeight: 'bold', marginInlineEnd: 1 }}>
                          {storeSettings?.currencySymbol || 'د.إ'}
                        </Box>
                        {(item.price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                        <Box component="span" sx={{ color: '#1976d2', fontWeight: 'bold', marginInlineEnd: 1 }}>
                          {storeSettings?.currencySymbol || 'د.إ'}
                        </Box>
                        {(item.total || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#666' }}>
                      {t('sales:noItems')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Professional Totals Section */}
        <Grid container justifyContent="flex-end" sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              border: '2px solid #1976d2',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                backgroundColor: '#1976d2',
                color: 'white',
                p: 2,
                textAlign: 'center'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {t('sales:summary')}
                </Typography>
              </Box>
              <Box sx={{ p: 3, backgroundColor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1" sx={{ color: '#666' }}>{t('subtotal')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                    <Box component="span" sx={{ color: '#1976d2', fontWeight: 'bold', marginInlineEnd: 1 }}>
                      {storeSettings?.currencySymbol || 'د.إ'}
                    </Box>
                    {(invoice.subtotal || 0).toFixed(2)}
                  </Typography>
                </Box>
                {(invoice.tax || 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" sx={{ color: '#666' }}>
                      {t('tax')}{taxRatePercent > 0 ? ` (${taxRatePercent}%)` : ''}:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                      <Box component="span" sx={{ color: '#1976d2', fontWeight: 'bold', marginInlineEnd: 1 }}>
                        {storeSettings?.currencySymbol || 'د.إ'}
                      </Box>
                      {(invoice.tax || 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                {(invoice.discount || 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" sx={{ color: '#666' }}>{t('discount')}:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#dc3545', fontFamily: 'monospace' }}>
                      <Box component="span" sx={{ color: '#dc3545', fontWeight: 'bold', marginInlineEnd: 1 }}>
                        -{storeSettings?.currencySymbol || 'د.إ'}
                      </Box>
                      {(invoice.discount || 0).toFixed(2)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2, borderColor: '#1976d2' }} />
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  backgroundColor: '#f8f9fa',
                  p: 2,
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {t('total')}:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2', fontFamily: 'monospace' }}>
                    <Box component="span" sx={{ color: '#1976d2', fontWeight: 'bold', marginInlineEnd: 1, fontSize: '1.2em' }}>
                      {storeSettings?.currencySymbol || 'د.إ'}
                    </Box>
                    {(invoice.total || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Notes Section */}
        {invoice.notes && (
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: '#1976d2',
                mb: 2,
                fontSize: '16px'
              }}
            >
              {t('notes')}
            </Typography>
            <Box sx={{ 
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              p: 3
            }}>
              <Typography variant="body1" sx={{ color: '#856404', whiteSpace: 'pre-wrap' }}>
                {invoice.notes}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Terms and Conditions */}
        {storeSettings?.invoiceTerms && (
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                color: '#1976d2',
                mb: 2,
                fontSize: '16px'
              }}
            >
              {t('sales:termsAndConditions')}
            </Typography>
            <Box sx={{ 
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              p: 3
            }}>
              <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {storeSettings.invoiceTerms}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Footer with Signatures */}
        <Box sx={{ 
          mt: 'auto',
          pt: 4,
          borderTop: '2px solid #e9ecef'
        }}>
          {/* Professional Footer with UAE Branding */}
          <Box sx={{ 
            borderTop: '3px solid #1976d2',
            pt: 3,
            mt: 4,
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            p: 3
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#1976d2',
                fontWeight: 'bold',
                fontSize: '16px',
                mb: 2
              }}
            >
              {storeSettings?.invoiceFooterText || 'شكراً لتسوقكم معنا | Thank you for shopping with us'}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mt: 2
            }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                🇦🇪 معتمد في دولة الإمارات العربية المتحدة
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', fontFamily: 'monospace' }}>
                العملة الرسمية: درهم إماراتي (AED) | د.إ
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy HH:mm')}
              </Typography>
            </Box>
          </Box>

          {/* Brand contact info (from business card) */}
          <Box sx={{
            mt: 2,
            p: 2,
            borderRadius: '8px',
            border: '1px dashed #e0e0e0',
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'center',
            gap: 3,
            flexWrap: 'wrap'
          }}>
            <Typography variant="body2" sx={{ color: '#333' }}>
              📞 +971581398039
            </Typography>
            <Typography variant="body2" sx={{ color: '#333' }}>
              📞 +971502497632
            </Typography>
            <Typography variant="body2" sx={{ color: '#333' }}>
              ✉️ mahil213233@gmail.com
            </Typography>
          </Box>

          {/* Signatures Section */}
          {storeSettings?.invoiceShowSignature && (
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    borderBottom: '2px solid #333',
                    mb: 2,
                    height: '60px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>
                    {t('sales:customerSignature')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
                    {t('sales:signatureDate')}: _______________
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    borderBottom: '2px solid #333',
                    mb: 2,
                    height: '60px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }} />
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#666' }}>
                    {t('sales:storeRepresentative')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
                    {storeSettings?.name || 'متجر نسمات جمال'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Professional Footer */}
          <Box sx={{ 
            textAlign: 'center',
            mt: 4,
            pt: 3,
            borderTop: '1px solid #e9ecef',
            color: '#999',
            fontSize: '10px'
          }}>
            <Typography variant="caption">
              تم إنشاء هذه الفاتورة إلكترونياً • {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
});

InvoicePrint.displayName = 'InvoicePrint';

export default InvoicePrint;