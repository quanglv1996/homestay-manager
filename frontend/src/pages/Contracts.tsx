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
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Extension as ExtensionIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import api from '../lib/api';

interface Contract {
  id: number;
  contract_code: string;
  tenant_id: number;
  tenant_name?: string;
  tenant_phone?: string;
  room_id: number;
  room_code?: string;
  room_name?: string;
  property_name?: string;
  bed_id?: number;
  start_date: string;
  end_date: string;
  payment_day: number;
  payment_cycle: string;
  rent_amount: number;
  deposit_amount: number;
  terms_and_conditions?: string;
  notes?: string;
  status: string;
  signed_date?: string;
  days_until_expiry?: number;
  is_expiring_soon: boolean;
  created_at: string;
}

interface Tenant {
  id: number;
  full_name: string;
  phone: string;
}

interface Room {
  id: number;
  room_code: string;
  room_name: string;
  property_id: number;
  status: string;
}

const ContractStatuses = {
  DRAFT: 'Nháp',
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã hủy',
};

export default function Contracts() {
  const queryClient = useQueryClient();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openExtendDialog, setOpenExtendDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    tenant_id: 0,
    room_id: 0,
    bed_id: null as number | null,
    start_date: '',
    end_date: '',
    payment_day: 5,
    payment_cycle: 'MONTHLY',
    rent_amount: 0,
    deposit_amount: 0,
    terms_and_conditions: '',
    notes: '',
  });

  const [extendMonths, setExtendMonths] = useState(3);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchContracts();
    fetchTenants();
    fetchRooms();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts');
      setContracts(response.data.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Lỗi khi tải danh sách hợp đồng');
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get('/tenants?limit=1000');
      setTenants(response.data.items || []);
    } catch (err: any) {
      console.error('Error fetching tenants:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms?limit=1000');
      setRooms(response.data.items || []);
    } catch (err: any) {
      console.error('Error fetching rooms:', err);
    }
  };

  const handleOpenDialog = (contract?: Contract) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        tenant_id: contract.tenant_id,
        room_id: contract.room_id,
        bed_id: contract.bed_id || null,
        start_date: contract.start_date,
        end_date: contract.end_date,
        payment_day: contract.payment_day,
        payment_cycle: contract.payment_cycle,
        rent_amount: contract.rent_amount,
        deposit_amount: contract.deposit_amount,
        terms_and_conditions: contract.terms_and_conditions || '',
        notes: contract.notes || '',
      });
    } else {
      setEditingContract(null);
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().split('T')[0];

      setFormData({
        tenant_id: 0,
        room_id: 0,
        bed_id: null,
        start_date: today,
        end_date: nextMonthStr,
        payment_day: 5,
        payment_cycle: 'MONTHLY',
        rent_amount: 0,
        deposit_amount: 0,
        terms_and_conditions: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContract(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingContract) {
        await api.put(`/contracts/${editingContract.id}`, formData);
        setSuccess('Cập nhật hợp đồng thành công');
      } else {
        await api.post('/contracts', formData);
        setSuccess('Tạo hợp đồng mới thành công');
      }
      handleCloseDialog();
      fetchContracts();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hợp đồng "${contract.contract_code}"?`)) {
      return;
    }

    try {
      await api.delete(`/contracts/${contract.id}`);
      setSuccess('Xóa hợp đồng thành công');
      fetchContracts();
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể xóa hợp đồng');
    }
  };

  const handleOpenExtendDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setExtendMonths(3);
    setOpenExtendDialog(true);
  };

  const handleExtend = async () => {
    if (!selectedContract) return;

    try {
      await api.post(`/contracts/${selectedContract.id}/extend`, { months: extendMonths });
      setSuccess(`Gia hạn hợp đồng thành công ${extendMonths} tháng`);
      setOpenExtendDialog(false);
      fetchContracts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể gia hạn hợp đồng');
    }
  };

  const handleOpenCancelDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setCancelReason('');
    setOpenCancelDialog(true);
  };

  const handleCancel = async () => {
    if (!selectedContract || !cancelReason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }

    try {
      await api.post(`/contracts/${selectedContract.id}/cancel`, { reason: cancelReason });
      setSuccess('Hủy hợp đồng thành công');
      setOpenCancelDialog(false);
      fetchContracts();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể hủy hợp đồng');
    }
  };

  const getStatusChip = (status: string, isExpiringSoon: boolean) => {
    const colors: Record<string, 'default' | 'success' | 'error' | 'warning'> = {
      DRAFT: 'default',
      ACTIVE: 'success',
      EXPIRED: 'error',
      CANCELLED: 'error',
    };

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={ContractStatuses[status as keyof typeof ContractStatuses] || status}
          color={colors[status] || 'default'}
          size="small"
        />
        {isExpiringSoon && status === 'ACTIVE' && (
          <Tooltip title="Sắp hết hạn trong 30 ngày">
            <WarningIcon color="warning" fontSize="small" />
          </Tooltip>
        )}
      </Box>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý Hợp đồng</Typography>
        <Box>
          <Button startIcon={<RefreshIcon />} onClick={fetchContracts} sx={{ mr: 1 }}>
            Làm mới
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Thêm hợp đồng
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
              <TableCell>Mã HĐ</TableCell>
              <TableCell>Người thuê</TableCell>
              <TableCell>Phòng</TableCell>
              <TableCell>Thời hạn</TableCell>
              <TableCell>Tiền thuê</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {contract.contract_code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{contract.tenant_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {contract.tenant_phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{contract.room_code}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {contract.property_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                  </Typography>
                  {contract.days_until_expiry !== null && contract.days_until_expiry !== undefined && contract.days_until_expiry >= 0 && (
                    <Typography variant="caption" color="text.secondary">
                      Còn {contract.days_until_expiry} ngày
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(contract.rent_amount)}</TableCell>
                <TableCell>{getStatusChip(contract.status, contract.is_expiring_soon)}</TableCell>
                <TableCell align="right">
                  {contract.status === 'ACTIVE' && (
                    <>
                      <Tooltip title="Gia hạn">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenExtendDialog(contract)}
                        >
                          <ExtensionIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Hủy hợp đồng">
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenCancelDialog(contract)}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Sửa">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(contract)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton size="small" color="error" onClick={() => handleDelete(contract)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingContract ? 'Sửa hợp đồng' : 'Thêm hợp đồng mới'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Người thuê</InputLabel>
                  <Select
                    value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: Number(e.target.value) })}
                    label="Người thuê"
                  >
                    {tenants.map((tenant) => (
                      <MenuItem key={tenant.id} value={tenant.id}>
                        {tenant.full_name} - {tenant.phone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Phòng</InputLabel>
                  <Select
                    value={formData.room_id}
                    onChange={(e) => setFormData({ ...formData, room_id: Number(e.target.value) })}
                    label="Phòng"
                  >
                    {rooms.map((room) => (
                      <MenuItem key={room.id} value={room.id}>
                        {room.room_code} - {room.room_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Ngày bắt đầu"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Ngày kết thúc"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>Thông tin thanh toán</Divider>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Ngày thanh toán (1-31)"
                  value={formData.payment_day}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_day: Number(e.target.value) })
                  }
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Chu kỳ thanh toán</InputLabel>
                  <Select
                    value={formData.payment_cycle}
                    onChange={(e) => setFormData({ ...formData, payment_cycle: e.target.value })}
                    label="Chu kỳ thanh toán"
                  >
                    <MenuItem value="MONTHLY">Hàng tháng</MenuItem>
                    <MenuItem value="QUARTERLY">Hàng quý</MenuItem>
                    <MenuItem value="YEARLY">Hàng năm</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Tiền thuê"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData({ ...formData, rent_amount: Number(e.target.value) })}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tiền cọc"
                  value={formData.deposit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, deposit_amount: Number(e.target.value) })
                  }
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Điều khoản hợp đồng"
                  value={formData.terms_and_conditions}
                  onChange={(e) =>
                    setFormData({ ...formData, terms_and_conditions: e.target.value })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Ghi chú"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button type="submit" variant="contained">
              {editingContract ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Extend Contract Dialog */}
      <Dialog open={openExtendDialog} onClose={() => setOpenExtendDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gia hạn hợp đồng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Hợp đồng: <strong>{selectedContract?.contract_code}</strong>
            </Typography>
            <Typography variant="body2" gutterBottom>
              Ngày hết hạn hiện tại: <strong>{selectedContract && formatDate(selectedContract.end_date)}</strong>
            </Typography>

            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Thời gian gia hạn</InputLabel>
              <Select
                value={extendMonths}
                onChange={(e) => setExtendMonths(Number(e.target.value))}
                label="Thời gian gia hạn"
              >
                <MenuItem value={3}>3 tháng</MenuItem>
                <MenuItem value={6}>6 tháng</MenuItem>
                <MenuItem value={12}>12 tháng</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExtendDialog(false)}>Hủy</Button>
          <Button onClick={handleExtend} variant="contained" color="primary">
            Gia hạn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Contract Dialog */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Hủy hợp đồng</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Hợp đồng: <strong>{selectedContract?.contract_code}</strong>
            </Typography>
            <Typography variant="body2" color="error" gutterBottom>
              ⚠️ Hành động này không thể hoàn tác. Phòng sẽ trở về trạng thái trống.
            </Typography>

            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label="Lý do hủy"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do hủy hợp đồng..."
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Đóng</Button>
          <Button onClick={handleCancel} variant="contained" color="error">
            Xác nhận hủy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
