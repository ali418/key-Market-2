import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { saveAuthData } from '../../services/authService';
import {
  Avatar,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useEffect } from 'react';
import Logo from '../../assets/logo/logo-nasmat-jamal.svg';

// Redux actions
import { login } from '../../redux/slices/authSlice';
import apiService from '../../api/apiService';

const Login = () => {
  const { t, i18n } = useTranslation('auth');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update document title based on current language
  useEffect(() => {
    document.title = t('common.pageTitle.login', { ns: 'common' });
  }, [i18n.language, t]);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rememberMe' ? checked : value,
    });
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Real API login
      const { token, refreshToken, user } = await apiService.login(
        formData.username,
        formData.password
      );

      // Persist auth data
      saveAuthData(token, refreshToken, user, formData.rememberMe);

      // Update Redux store
      dispatch(login(user));

      // Navigate to dashboard
      navigate('/');
    } catch (err) {
      console.error('Login Error Details:', err);
      
      let errorMessage = t('invalidCredentials');
      
      if (err.response) {
        // Server responded with error status
        console.error('Server Error Response:', err.response.data);
        console.error('Status Code:', err.response.status);
        
        if (err.response.status === 401) {
          errorMessage = t('invalidCredentials');
        } else if (err.response.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else if (err.response.status === 404) {
          errorMessage = 'لا يمكن الوصول إلى الخادم. تحقق من الاتصال';
        } else {
          errorMessage = err.response.data?.message || `خطأ في الخادم (${err.response.status})`;
        }
      } else if (err.request) {
        // Network error - no response received
        console.error('Network Error - No Response:', err.request);
        errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من الاتصال بالإنترنت';
      } else {
        // Other error
        console.error('Other Error:', err.message);
        errorMessage = err.message || 'حدث خطأ غير متوقع';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        minHeight: '500px',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        borderRadius: '20px',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}1A 0%, ${theme.palette.secondary.main}1A 100%)`,
          borderRadius: '20px',
        }
      }}
    >
      {/* Decorative Elements */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          opacity: 0.2,
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-10px)' }
          }
        })}
      />
      
      <Box
        sx={(theme) => ({
          position: 'absolute',
          bottom: '30px',
          left: '30px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
          opacity: 0.3,
          animation: 'float 2s ease-in-out infinite reverse',
        })}
      />

      {/* Company Logo */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 1s ease-in-out',
          '@keyframes fadeInUp': {
            '0%': { opacity: 0, transform: 'translateY(30px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        <Box
          sx={(theme) => ({
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '10px',
              left: '10px',
              right: '10px',
              bottom: '10px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
            }
          })}
        >
          <img
            src={Logo}
            alt="Key4Market Logo"
            style={{
              width: '80px',
              height: '100px',
              filter: 'brightness(0) invert(1)',
              zIndex: 1,
              position: 'relative'
            }}
          />
        </Box>
        
        <Typography 
          variant="h3" 
          sx={(theme) => ({ 
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            fontFamily: '"Tajawal", "Roboto", sans-serif',
            mb: 1
          })}
        >
          كي فورماركت
        </Typography>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'secondary.main',
            textAlign: 'center',
            fontWeight: 500,
            fontFamily: '"Tajawal", "Roboto", sans-serif'
          }}
        >
          KEY4MARKET
        </Typography>
      </Box>
      
      <Typography 
        component="h1" 
        variant="h4" 
        sx={{ 
          mb: 1,
          fontWeight: 'bold',
          color: 'secondary.main',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          fontFamily: '"Tajawal", "Roboto", sans-serif'
        }}
      >
        {t('login')}
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          mb: 4,
          color: '#666',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          fontFamily: '"Tajawal", "Roboto", sans-serif'
        }}
      >
        مرحباً بك في نظام إدارة المتجر
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2, 
            width: '100%',
            position: 'relative',
            zIndex: 1,
            borderRadius: '12px',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            '& .MuiAlert-icon': {
              color: '#d32f2f'
            }
          }}
        >
          {error}
        </Alert>
      )}
      
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        noValidate 
        sx={{ 
          mt: 3, 
          width: '100%',
          position: 'relative',
          zIndex: 1,
          maxWidth: '400px'
        }}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label={t('username')}
          name="username"
          autoComplete="username"
          autoFocus
          value={formData.username}
          onChange={handleChange}
          disabled={loading}
          sx={(theme) => ({
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '2px solid transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${theme.palette.primary.main}30`,
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
                border: `2px solid ${theme.palette.primary.main}`,
                boxShadow: '0 0 0 4px rgba(212, 175, 55, 0.1)',
              }
            },
            '& .MuiInputLabel-root': {
              color: '#666',
              fontFamily: '"Tajawal", "Roboto", sans-serif',
              '&.Mui-focused': {
                color: 'primary.main',
              }
            }
          })}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label={t('password')}
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          sx={(theme) => ({
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '2px solid transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: `2px solid ${theme.palette.primary.main}30`,
              },
              '&.Mui-focused': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
                border: `2px solid ${theme.palette.primary.main}`,
                boxShadow: '0 0 0 4px rgba(212, 175, 55, 0.1)',
              }
            },
            '& .MuiInputLabel-root': {
              color: '#666',
              fontFamily: '"Tajawal", "Roboto", sans-serif',
              '&.Mui-focused': {
                color: 'primary.main',
              }
            }
          })}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    }
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={loading}
              sx={{
                color: 'primary.main',
                '&.Mui-checked': {
                  color: 'primary.main',
                },
                '&:hover': {
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                }
              }}
            />
          }
          label={
            <Typography 
              sx={{ 
                color: '#666',
                fontFamily: '"Tajawal", "Roboto", sans-serif'
              }}
            >
              {t('rememberMe')}
            </Typography>
          }
          sx={{ mb: 2 }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={(theme) => ({ 
            mt: 2, 
            mb: 3,
            py: 1.5,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            fontFamily: '"Tajawal", "Roboto", sans-serif',
            textTransform: 'none',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              boxShadow: '0 12px 40px rgba(212, 175, 55, 0.4)',
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
            '&:disabled': {
              background: 'rgba(212, 175, 55, 0.3)',
              boxShadow: 'none',
            }
          })}
        >
          {loading ? (
            <CircularProgress 
              size={24} 
              sx={{ 
                color: 'white',
                mr: 1 
              }} 
            />
          ) : null}
          {loading ? 'جاري تسجيل الدخول...' : t('signIn')}
        </Button>
        <Grid container justifyContent="center">
          <Grid item>
            <Link 
              component={RouterLink} 
              to="/forgot-password" 
              variant="body2"
              sx={{
                color: 'secondary.main',
                textDecoration: 'none',
                fontFamily: '"Tajawal", "Roboto", sans-serif',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                }
              }}
            >
              {t('forgotYourPassword')}
            </Link>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Login;