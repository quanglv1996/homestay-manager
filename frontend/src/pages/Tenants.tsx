import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  SwapHoriz as TransferIcon,
  ExitToApp as CheckoutIcon,
} from '@mui/icons-material'
import api from '../lib/api'

interface Tenant {
  id: number
  full_name: string
  id_card: string
  phone: string
  email?: string
  date_of_birth?: string
  permanent_address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  is_active: boolean
}

export default function Tenants() {
  const queryClient = useQueryClient()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openTransferDialog, setOpenTransferDialog] = useState(false)
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    full_name: '',
    id_card: '',
    phone: '',
    email: '',
    date_of_birth: '',
    permanent_address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    is_active: true,
  })

  const [transferData, setTransferData] = useState({
    new_room_id: 0,
    transfer_date: new Date().toISOString().split('T')[0],
    reason: '',
  })

  const [checkoutData, setCheckoutData] = useState({
    checkout_date: new Date().toISOString().split('T')[0],
    reason: '',
    final_electricity: '',
    final_water: '',
  })

  useEffect(() => {
    fetchTenants()
    fetchRooms()
  }, [])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await api.get('/tenants')
      setTenants(response.data.items || [])
    } catch (err: any) {
      setError('Không thể tải danh sách người thuê')
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms?limit=1000')
      setRooms(response.data.items || [])
    } catch (err: any) {
      console.error('Error fetching rooms:', err)
    }
  }

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant)
      setFormData({
        full_name: tenant.full_name,
        id_card: tenant.id_card,
        phone: tenant.phone,
        email: tenant.email || '',
        date_of_birth: tenant.date_of_birth || '',
        permanent_address: tenant.permanent_address || '',
        emergency_contact_name: tenant.emergency_contact_name || '',
        emergency_contact_phone: tenant.emergency_contact_phone || '',
        notes: tenant.notes || '',
        is_active: tenant.is_active,
      })
    } else {
      setEditingTenant(null)
      setFormData({
        full_name: '',
        id_card: '',
        phone: '',
        email: '',
        date_of_birth: '',
        permanent_address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
        is_active: true,
      })
    }
    setOpenDialog(true)
    setError('')
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingTenant(null)
  }

  const handleSubmit = async () => {
    try {
      setError('')
      const payload = {
        ...formData,
        email: formData.email || null,
        date_of_birth: formData.date_of_birth || null,
        permanent_address: formData.permanent_address || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        notes: formData.notes || null,
      }

      if (editingTenant) {
        await api.put(`/tenants/${editingTenant.id}`, payload)
        setSuccess('Cập nhật người thuê thành công')
      } else {
        await api.post('/tenants', payload)
        setSuccess('Thêm người thuê mới thành công')
      }
      
      handleCloseDialog()
      fetchTenants()
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa người thuê này?')) return
    
    try {
      await api.delete(`/tenants/${id}`)
      setSuccess('Xóa người thuê thành công')
      fetchTenants()
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể xóa người thuê')
    }
  }

  const handleOpenTransfer = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setTransferData({
      new_room_id: 0,
      transfer_date: new Date().toISOString().split('T')[0],
      reason: '',
    })
    setOpenTransferDialog(true)
  }

  const handleTransferRoom = async () => {
    if (!selectedTenant || !transferData.new_room_id || !transferData.reason.trim()) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      await api.post(`/tenants/${selectedTenant.id}/transfer-room`, transferData)
      setSuccess('Chuyển phòng thành công')
      setOpenTransferDialog(false)
      fetchTenants()
      fetchRooms()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể chuyển phòng')
    }
  }

  const handleOpenCheckout = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setCheckoutData({
      checkout_date: new Date().toISOString().split('T')[0],
      reason: '',
      final_electricity: '',
      final_water: '',
    })
    setOpenCheckoutDialog(true)
  }

  const handleCheckout = async () => {
    if (!selectedTenant || !checkoutData.reason.trim()) {
      setError('Vui lòng nhập lý do trả phòng')
      return
    }

    try {
      const payload: any = {
        checkout_date: checkoutData.checkout_date,
        reason: checkoutData.reason,
      }
      
      if (checkoutData.final_electricity) {
        payload.final_electricity = parseFloat(checkoutData.final_electricity)
      }
      if (checkoutData.final_water) {
        payload.final_water = parseFloat(checkoutData.final_water)
      }

      await api.post(`/tenants/${selectedTenant.id}/checkout`, payload)
      setSuccess('Trả phòng thành công')
      setOpenCheckoutDialog(false)
      fetchTenants()
      fetchRooms()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể trả phòng')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quản lý Người thuê</Typography>
        <Stack direction="row" spacing={2}>
          <Button startIcon={<RefreshIcon />} onClick={fetchTenants} disabled={loading}>
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Thêm người thuê
          </Button>
        </Stack>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Họ tên</TableCell>
              <TableCell>CCCD/CMND</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Liên hệ khẩn cấp</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.full_name}</TableCell>
                <TableCell>{tenant.id_card}</TableCell>
                <TableCell>{tenant.phone}</TableCell>
                <TableCell>{tenant.email || '-'}</TableCell>
                <TableCell>
                  {tenant.emergency_contact_name ? (
                    <div>
                      <div>{tenant.emergency_contact_name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {tenant.emergency_contact_phone}
                      </div>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={tenant.is_active ? 'Đang thuê' : 'Không hoạt động'}
                    color={tenant.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {tenant.is_active && (
                    <>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleOpenTransfer(tenant)}
                        title="Chuyển phòng"
                      >
                        <TransferIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleOpenCheckout(tenant)}
                        title="Trả phòng"
                      >
                        <CheckoutIcon />
                      </IconButton>
                    </>
                  )}
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(tenant)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(tenant.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Chưa có người thuê nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTenant ? 'Chỉnh sửa người thuê' : 'Thêm người thuê mới'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            fullWidth
            label="Họ và tên"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Số CCCD/CMND"
            value={formData.id_card}
            onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Số điện thoại"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Ngày sinh"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            fullWidth
            label="Địa chỉ thường trú"
            multiline
            rows={2}
            value={formData.permanent_address}
            onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
            margin="normal"
          />
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Thông tin liên hệ khẩn cấp
          </Typography>
          
          <TextField
            fullWidth
            label="Họ tên người liên hệ"
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Số điện thoại người liên hệ"
            value={formData.emergency_contact_phone}
            onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Ghi chú"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTenant ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Room Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chuyển phòng</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
            Người thuê: <strong>{selectedTenant?.full_name}</strong>
          </Typography>

          <TextField
            fullWidth
            select
            label="Phòng mới"
            value={transferData.new_room_id}
            onChange={(e) => setTransferData({ ...transferData, new_room_id: Number(e.target.value) })}
            margin="normal"
            required
            SelectProps={{ native: true }}
          >
            <option value="0">Chọn phòng</option>
            {rooms.filter(r => r.status === 'AVAILABLE').map((room) => (
              <option key={room.id} value={room.id}>
                {room.room_code} - {room.room_name}
              </option>
            ))}
          </TextField>

          <TextField
            fullWidth
            type="date"
            label="Ngày chuyển"
            value={transferData.transfer_date}
            onChange={(e) => setTransferData({ ...transferData, transfer_date: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do chuyển phòng"
            value={transferData.reason}
            onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
            margin="normal"
            required
            placeholder="Ví dụ: Nâng cấp phòng lớn hơn, yêu cầu thay đổi tầng..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferDialog(false)}>Hủy</Button>
          <Button onClick={handleTransferRoom} variant="contained" color="primary">
            Xác nhận chuyển
          </Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={openCheckoutDialog} onClose={() => setOpenCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trả phòng</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
            Người thuê: <strong>{selectedTenant?.full_name}</strong>
          </Typography>
          <Typography variant="body2" color="error" gutterBottom>
            ⚠️ Hành động này sẽ kết thúc hợp đồng và trả phòng về trạng thái trống.
          </Typography>

          <TextField
            fullWidth
            type="date"
            label="Ngày trả phòng"
            value={checkoutData.checkout_date}
            onChange={(e) => setCheckoutData({ ...checkoutData, checkout_date: e.target.value })}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do trả phòng"
            value={checkoutData.reason}
            onChange={(e) => setCheckoutData({ ...checkoutData, reason: e.target.value })}
            margin="normal"
            required
            placeholder="Ví dụ: Hết hạn hợp đồng, chuyển nơi ở..."
          />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Chỉ số cuối kỳ (tùy chọn)
          </Typography>

          <TextField
            fullWidth
            type="number"
            label="Điện (kWh)"
            value={checkoutData.final_electricity}
            onChange={(e) => setCheckoutData({ ...checkoutData, final_electricity: e.target.value })}
            margin="normal"
            inputProps={{ min: 0, step: 0.1 }}
          />

          <TextField
            fullWidth
            type="number"
            label="Nước (m³)"
            value={checkoutData.final_water}
            onChange={(e) => setCheckoutData({ ...checkoutData, final_water: e.target.value })}
            margin="normal"
            inputProps={{ min: 0, step: 0.1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckoutDialog(false)}>Hủy</Button>
          <Button onClick={handleCheckout} variant="contained" color="error">
            Xác nhận trả phòng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
