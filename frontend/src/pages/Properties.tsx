import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Typography,
  Grid,
  Tab,
  Tabs,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
  Hotel as HotelIcon,
  Info as InfoIcon,
  Image as ImageIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import api from '../lib/api';

interface Property {
  id: number;
  name: string;
  type: string;
  address: string;
  description?: string;
  total_floors: number;
  total_rooms: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  default_electricity_price: number;
  default_water_price: number;
  default_internet_fee: number;
  default_cleaning_fee: number;
  default_parking_fee: number;
  created_at: string;
}

interface PropertyStats {
  property_id: number;
  property_name: string;
  total_rooms: number;
  available_rooms: number;
  occupied_rooms: number;
  maintenance_rooms: number;
  total_floors: number;
  occupancy_rate: number;
}

interface Floor {
  id: number;
  property_id: number;
  floor_number: number;
  floor_name: string;
  description?: string;
}

const PropertyTypes = {
  MINI_APARTMENT: 'Chung cư mini',
  ROOM_RENTAL: 'Nhà cho thuê',
  DORMITORY: 'Ký túc xá',
};

export default function Properties() {
  const queryClient = useQueryClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailTab, setDetailTab] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    type: 'ROOM_RENTAL',
    address: '',
    description: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    default_electricity_price: 0,
    default_water_price: 0,
    default_internet_fee: 0,
    default_cleaning_fee: 0,
    default_parking_fee: 0,
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties');
      setProperties(response.data.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi tải danh sách tài sản');
    }
  };

  const fetchPropertyStats = async (propertyId: number) => {
    try {
      const response = await api.get(`/properties/${propertyId}/stats`);
      setPropertyStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchFloors = async (propertyId: number) => {
    try {
      const response = await api.get(`/properties/${propertyId}/floors`);
      setFloors(response.data || []);
    } catch (err: any) {
      console.error('Error fetching floors:', err);
    }
  };

  const handleOpenDialog = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        name: property.name,
        type: property.type,
        address: property.address,
        description: property.description || '',
        contact_name: property.contact_name || '',
        contact_phone: property.contact_phone || '',
        contact_email: property.contact_email || '',
        default_electricity_price: property.default_electricity_price,
        default_water_price: property.default_water_price,
        default_internet_fee: property.default_internet_fee,
        default_cleaning_fee: property.default_cleaning_fee,
        default_parking_fee: property.default_parking_fee,
      });
    } else {
      setEditingProperty(null);
      setFormData({
        name: '',
        type: 'ROOM_RENTAL',
        address: '',
        description: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        default_electricity_price: 3500,
        default_water_price: 20000,
        default_internet_fee: 100000,
        default_cleaning_fee: 50000,
        default_parking_fee: 100000,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProperty(null);
  };

  const handleViewDetail = async (property: Property) => {
    setViewingProperty(property);
    setDetailTab(0);
    await fetchPropertyStats(property.id);
    await fetchFloors(property.id);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setViewingProperty(null);
    setPropertyStats(null);
    setFloors([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingProperty) {
        await api.put(`/properties/${editingProperty.id}`, formData);
        setSuccess('Cập nhật tài sản thành công');
      } else {
        await api.post('/properties', formData);
        setSuccess('Tạo tài sản mới thành công');
      }
      handleCloseDialog();
      fetchProperties();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (property: Property) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài sản "${property.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/properties/${property.id}`);
      setSuccess('Xóa tài sản thành công');
      fetchProperties();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể xóa tài sản');
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'MINI_APARTMENT':
        return <ApartmentIcon />;
      case 'DORMITORY':
        return <HotelIcon />;
      default:
        return <HomeIcon />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý Tài sản</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchProperties}
            sx={{ mr: 1 }}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Thêm tài sản
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên tài sản</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>Số tầng</TableCell>
              <TableCell>Số phòng</TableCell>
              <TableCell>Liên hệ</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {properties.map((property) => (
              <TableRow key={property.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPropertyTypeIcon(property.type)}
                    <Typography variant="body2" fontWeight="bold">
                      {property.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={PropertyTypes[property.type as keyof typeof PropertyTypes]}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{property.address}</TableCell>
                <TableCell>{property.total_floors}</TableCell>
                <TableCell>{property.total_rooms}</TableCell>
                <TableCell>
                  {property.contact_name && (
                    <Typography variant="body2">{property.contact_name}</Typography>
                  )}
                  {property.contact_phone && (
                    <Typography variant="caption" color="text.secondary">
                      {property.contact_phone}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleViewDetail(property)}
                    title="Xem chi tiết"
                  >
                    <InfoIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(property)}
                    title="Sửa"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(property)}
                    title="Xóa"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProperty ? 'Sửa tài sản' : 'Thêm tài sản mới'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  label="Tên tài sản"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Loại tài sản</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Loại tài sản"
                  >
                    <MenuItem value="MINI_APARTMENT">Chung cư mini</MenuItem>
                    <MenuItem value="ROOM_RENTAL">Nhà cho thuê</MenuItem>
                    <MenuItem value="DORMITORY">Ký túc xá</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Địa chỉ"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Mô tả"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Thông tin liên hệ</Divider>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tên người liên hệ"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Giá dịch vụ mặc định</Divider>
              </Grid>

              <Grid item xs={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giá điện (đ/kWh)"
                  value={formData.default_electricity_price}
                  onChange={(e) =>
                    setFormData({ ...formData, default_electricity_price: Number(e.target.value) })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Giá nước (đ/m³)"
                  value={formData.default_water_price}
                  onChange={(e) =>
                    setFormData({ ...formData, default_water_price: Number(e.target.value) })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Phí Internet (đ/tháng)"
                  value={formData.default_internet_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, default_internet_fee: Number(e.target.value) })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Phí vệ sinh (đ/tháng)"
                  value={formData.default_cleaning_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, default_cleaning_fee: Number(e.target.value) })
                  }
                />
              </Grid>
              <Grid item xs={6} md={2.4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Phí xe (đ/tháng)"
                  value={formData.default_parking_fee}
                  onChange={(e) =>
                    setFormData({ ...formData, default_parking_fee: Number(e.target.value) })
                  }
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button type="submit" variant="contained">
              {editingProperty ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Chi tiết tài sản: {viewingProperty?.name}
        </DialogTitle>
        <DialogContent>
          <Tabs value={detailTab} onChange={(_e, v) => setDetailTab(v)} sx={{ mb: 2 }}>
            <Tab label="Thông tin" icon={<InfoIcon />} iconPosition="start" />
            <Tab label="Thống kê" icon={<LayersIcon />} iconPosition="start" />
            <Tab label="Tầng" icon={<LayersIcon />} iconPosition="start" />
            <Tab label="Ảnh" icon={<ImageIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab 0: Information */}
          {detailTab === 0 && viewingProperty && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Thông tin cơ bản
                    </Typography>
                    <Typography variant="body2">
                      <strong>Loại:</strong>{' '}
                      {PropertyTypes[viewingProperty.type as keyof typeof PropertyTypes]}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Địa chỉ:</strong> {viewingProperty.address}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Mô tả:</strong> {viewingProperty.description || 'Không có'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Liên hệ
                    </Typography>
                    <Typography variant="body2">
                      <strong>Người liên hệ:</strong>{' '}
                      {viewingProperty.contact_name || 'Không có'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Điện thoại:</strong> {viewingProperty.contact_phone || 'Không có'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {viewingProperty.contact_email || 'Không có'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Giá dịch vụ mặc định
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={2.4}>
                        <Typography variant="caption" color="text.secondary">
                          Giá điện
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(viewingProperty.default_electricity_price)}/kWh
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={2.4}>
                        <Typography variant="caption" color="text.secondary">
                          Giá nước
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(viewingProperty.default_water_price)}/m³
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={2.4}>
                        <Typography variant="caption" color="text.secondary">
                          Internet
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(viewingProperty.default_internet_fee)}/tháng
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={2.4}>
                        <Typography variant="caption" color="text.secondary">
                          Vệ sinh
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(viewingProperty.default_cleaning_fee)}/tháng
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={2.4}>
                        <Typography variant="caption" color="text.secondary">
                          Xe
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(viewingProperty.default_parking_fee)}/tháng
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Statistics */}
          {detailTab === 1 && propertyStats && (
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" color="primary">
                      {propertyStats.total_rooms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng số phòng
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" color="success.main">
                      {propertyStats.available_rooms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Phòng trống
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" color="error.main">
                      {propertyStats.occupied_rooms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Đã cho thuê
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" color="warning.main">
                      {propertyStats.maintenance_rooms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Đang bảo trì
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tỷ lệ lấp đầy
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {propertyStats.occupancy_rate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Floors */}
          {detailTab === 2 && (
            <Box>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                sx={{ mb: 2 }}
                onClick={() => alert('Chức năng thêm tầng sẽ được triển khai sau')}
              >
                Thêm tầng
              </Button>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Số tầng</TableCell>
                      <TableCell>Tên tầng</TableCell>
                      <TableCell>Mô tả</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {floors.map((floor) => (
                      <TableRow key={floor.id}>
                        <TableCell>{floor.floor_number}</TableCell>
                        <TableCell>{floor.floor_name}</TableCell>
                        <TableCell>{floor.description || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 3: Images */}
          {detailTab === 3 && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Chức năng upload và quản lý ảnh sẽ được triển khai sau
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
