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
  VpnKeyRounded,
  Key as KeyIcon,
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

  const sanitize = (s) => {
    if (typeof s !== 'string') return s;
    return s
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u2066-\u2069]/g, '')
      .trim();
  };

  
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
    const v = name === 'rememberMe' ? checked : sanitize(value);
    setFormData({
      ...formData,
      [name]: v,
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
        sanitize(formData.username),
        sanitize(formData.password)
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
      <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
        <LockOutlinedIcon />
      </Avatar>
      <Typography component="h1" variant="h5">
        {t('login')}
      </Typography>

      {/* Demo Credentials Hint */}
      <Box 
        onClick={() => setFormData({ ...formData, username: 'admin', password: 'keyforit12' })} 
        sx={{ 
          mt: 2,
          mb: 3, 
          p: 2, 
          width: '100%',
          borderRadius: 2, 
          bgcolor: 'rgba(33, 150, 243, 0.1)', 
          border: '1px solid rgba(33, 150, 243, 0.3)', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.2s', 
          '&:hover': { 
            bgcolor: 'rgba(33, 150, 243, 0.2)', 
            transform: 'translateY(-2px)' 
          } 
        }} 
      > 
        <Box sx={{ 
          p: 1, 
          borderRadius: '50%', 
          bgcolor: 'rgba(33, 150, 243, 0.2)', 
          display: 'flex', 
          color: '#1976d2' 
        }}> 
          <KeyIcon fontSize="small" /> 
        </Box> 
        <Box> 
          <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 'bold' }}> 
            Demo Account 
          </Typography> 
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}> 
            admin / keyforit12 
          </Typography> 
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}> 
            Click here to auto-fill demo login 
          </Typography> 
        </Box> 
      </Box>
      
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
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            setFormData((prev) => ({ ...prev, username: sanitize(text) }));
          }}
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
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            setFormData((prev) => ({ ...prev, password: sanitize(text) }));
          }}
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
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : t('signIn')}
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
