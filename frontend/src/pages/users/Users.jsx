import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  PointOfSale as CashierIcon,
  Inventory as StorekeeperIcon,
  AccountBalance as AccountantIcon,
  People as StaffIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiService from '../../api/apiService';

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State for users data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // State for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loginHistoryDialogOpen, setLoginHistoryDialogOpen] = useState(false);

  // State for user form
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    role: 'staff',
    password: '',
    confirmPassword: '',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // State for login history
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Available roles
  const roles = [
    { value: 'admin', label: 'المدير', icon: AdminIcon, color: '#f44336' },
    { value: 'manager', label: 'مدير المتجر', icon: ManagerIcon, color: '#ff9800' },
    { value: 'cashier', label: 'كاشير', icon: CashierIcon, color: '#2196f3' },
    { value: 'storekeeper', label: 'أمين المخزن', icon: StorekeeperIcon, color: '#4caf50' },
    { value: 'accountant', label: 'محاسب', icon: AccountantIcon, color: '#9c27b0' },
    { value: 'staff', label: 'موظف', icon: StaffIcon, color: '#607d8b' }
  ];

  // Get role info
  const getRoleInfo = (roleValue) => {
    return roles.find(role => role.value === roleValue) || roles[roles.length - 1];
  };

  // Set document title
  useEffect(() => {
    document.title = 'إدارة المستخدمين - نظام إدارة المتجر';
  }, []);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search or filters change
  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search and filters
  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
    setPage(0); // Reset to first page when filtering
  };

  // Handle menu open
  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // Handle add user
  const handleAddUser = () => {
    setUserForm({
      username: '',
      email: '',
      fullName: '',
      phone: '',
      role: 'staff',
      password: '',
      confirmPassword: '',
      isActive: true
    });
    setFormErrors({});
    setAddDialogOpen(true);
  };

  // Handle edit user
  const handleEditUser = () => {
    setUserForm({
      username: selectedUser.username || '',
      email: selectedUser.email || '',
      fullName: selectedUser.fullName || '',
      phone: selectedUser.phone || '',
      role: selectedUser.role || 'staff',
      password: '',
      confirmPassword: '',
      isActive: selectedUser.isActive !== false
    });
    setFormErrors({});
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // Handle delete user
  const handleDeleteUser = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Handle view login history
  const handleViewLoginHistory = async () => {
    setHistoryLoading(true);
    setLoginHistoryDialogOpen(true);
    handleMenuClose();

    try {
      const response = await apiService.getUserLoginHistory(selectedUser.id);
      setLoginHistory(response.data || []);
    } catch (err) {
      console.error('Error loading login history:', err);
      setLoginHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!userForm.username.trim()) {
      errors.username = 'اسم المستخدم مطلوب';
    }

    if (!userForm.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!userForm.fullName.trim()) {
      errors.fullName = 'الاسم الكامل مطلوب';
    }

    if (addDialogOpen) { // Only validate password for new users
      if (!userForm.password) {
        errors.password = 'كلمة المرور مطلوبة';
      } else if (userForm.password.length < 6) {
        errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      }

      if (userForm.password !== userForm.confirmPassword) {
        errors.confirmPassword = 'كلمات المرور غير متطابقة';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    try {
      const userData = {
        username: userForm.username,
        email: userForm.email,
        fullName: userForm.fullName,
        phone: userForm.phone,
        role: userForm.role,
        isActive: userForm.isActive
      };

      if (addDialogOpen) {
        userData.password = userForm.password;
        await apiService.createUser(userData);
      } else {
        await apiService.updateUser(selectedUser.id, userData);
      }

      await loadUsers();
      setAddDialogOpen(false);
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Error saving user:', err);
      setFormErrors({ submit: 'فشل في حفظ المستخدم' });
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    try {
      await apiService.deleteUser(selectedUser.id);
      await loadUsers();
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // Handle form input change
  const handleInputChange = (field, value) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get user avatar
  const getUserAvatar = (user) => {
    const roleInfo = getRoleInfo(user.role);
    const initials = user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : user.username?.substring(0, 2).toUpperCase();
    
    return (
      <Avatar sx={{ bgcolor: roleInfo.color, width: 40, height: 40 }}>
        {initials}
      </Avatar>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          إدارة المستخدمين
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          إضافة مستخدم جديد
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="البحث في المستخدمين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>الدور</InputLabel>
              <Select
                value={roleFilter}
                label="الدور"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">جميع الأدوار</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={statusFilter}
                label="الحالة"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">جميع الحالات</MenuItem>
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="inactive">غير نشط</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              المجموع: {filteredUsers.length} مستخدم
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المستخدم</TableCell>
                <TableCell>البريد الإلكتروني</TableCell>
                <TableCell>الهاتف</TableCell>
                <TableCell>الدور</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>آخر تسجيل دخول</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const RoleIcon = roleInfo.icon;
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getUserAvatar(user)}
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle2">
                              {user.fullName || user.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          icon={<RoleIcon />}
                          label={roleInfo.label}
                          size="small"
                          sx={{ bgcolor: roleInfo.color, color: 'white' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'نشط' : 'غير نشط'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-SA') : 'لم يسجل دخول'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, user)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="عدد الصفوف في الصفحة:"
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser}>
          <EditIcon sx={{ mr: 1 }} />
          تعديل
        </MenuItem>
        <MenuItem onClick={handleViewLoginHistory}>
          <HistoryIcon sx={{ mr: 1 }} />
          سجل تسجيل الدخول
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          حذف
        </MenuItem>
      </Menu>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={addDialogOpen || editDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {addDialogOpen ? 'إضافة مستخدم جديد' : 'تعديل المستخدم'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="اسم المستخدم"
                value={userForm.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                error={!!formErrors.username}
                helperText={formErrors.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="الاسم الكامل"
                value={userForm.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                error={!!formErrors.fullName}
                helperText={formErrors.fullName}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                type="email"
                value={userForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="رقم الهاتف"
                value={userForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>الدور</InputLabel>
                <Select
                  value={userForm.role}
                  label="الدور"
                  onChange={(e) => handleInputChange('role', e.target.value)}
                >
                  {roles.map(role => (
                    <MenuItem key={role.value} value={role.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <role.icon sx={{ mr: 1, color: role.color }} />
                        {role.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userForm.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  />
                }
                label="المستخدم نشط"
              />
            </Grid>
            {addDialogOpen && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="كلمة المرور"
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="تأكيد كلمة المرور"
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
          {formErrors.submit && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formErrors.submit}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
            }}
            startIcon={<CancelIcon />}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleFormSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {addDialogOpen ? 'إضافة' : 'حفظ'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من حذف المستخدم "{selectedUser?.fullName || selectedUser?.username}"؟
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            هذا الإجراء لا يمكن التراجع عنه.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* Login History Dialog */}
      <Dialog
        open={loginHistoryDialogOpen}
        onClose={() => setLoginHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          سجل تسجيل الدخول - {selectedUser?.fullName || selectedUser?.username}
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : loginHistory.length > 0 ? (
            <List>
              {loginHistory.map((entry, index) => (
                <React.Fragment key={entry.id || index}>
                  <ListItem>
                    <ListItemIcon>
                      <HistoryIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${new Date(entry.loginTime).toLocaleString('ar-SA')}`}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            عنوان IP: {entry.ipAddress}
                          </Typography>
                          <Typography variant="body2">
                            الجهاز: {entry.device || 'غير محدد'}
                          </Typography>
                          <Typography variant="body2">
                            المتصفح: {entry.userAgent?.substring(0, 50)}...
                          </Typography>
                          <Chip
                            label={entry.status === 'success' ? 'نجح' : 'فشل'}
                            color={entry.status === 'success' ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < loginHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ p: 3 }}>
              لا يوجد سجل تسجيل دخول
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginHistoryDialogOpen(false)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;