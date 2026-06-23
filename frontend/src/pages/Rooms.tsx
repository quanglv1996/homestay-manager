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
  MenuItem,
  Chip,
  Alert,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import api from '../lib/api'

interface Room {
  id: number
  room_code: string
  room_name: string
  property_id: number
  floor_id?: number
  status: string
  monthly_rent: number
  area?: number
  is_dormitory: boolean
  max_occupants?: number
  description?: string
}

export default function Rooms() {
  const queryClient = useQueryClient()
  const [rooms, setRooms] = useState<Room[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    room_code: '',
    room_name: '',
    property_id: '',
    floor_id: '',
    status: 'AVAILABLE',
    monthly_rent: '',
    area: '',
    is_dormitory: false,
    number_of_beds: '',
    max_occupants: '',
    description: '',
  })

  useEffect(() => {
    fetchRooms()
    fetchProperties()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data.items || [])
    } catch (err: any) {
      setError('Không thể tải danh sách phòng')
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties')
      setProperties(response.data.items || [])
    } catch (err) {
      console.error('Failed to fetch properties')
    }
  }

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room)
      setFormData({
        room_code: room.room_code,
        room_name: room.room_name,
        property_id: room.property_id.toString(),
        floor_id: room.floor_id?.toString() || '',
        status: room.status,
        monthly_rent: room.monthly_rent.toString(),
        area: room.area?.toString() || '',
        is_dormitory: room.is_dormitory,
        number_of_beds: '',
        max_occupants: room.max_occupants?.toString() || '',
        description: room.description || '',
      })
    } else {
      setEditingRoom(null)
      setFormData({
        room_code: '',
        room_name: '',
        property_id: '',
        floor_id: '',
        status: 'AVAILABLE',
        monthly_rent: '',
        area: '',
        is_dormitory: false,
        number_of_beds: '',
        max_occupants: '',
        description: '',
      })
    }
    setOpenDialog(true)
    setError('')
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingRoom(null)
  }

  const handleSubmit = async () => {
    try {
      setError('')
      const payload = {
        room_code: formData.room_code,
        room_name: formData.room_name,
        property_id: parseInt(formData.property_id),
        floor_id: formData.floor_id ? parseInt(formData.floor_id) : null,
        status: formData.status,
        monthly_rent: parseFloat(formData.monthly_rent),
        area: formData.area ? parseFloat(formData.area) : null,
        is_dormitory: formData.is_dormitory,
        number_of_beds: formData.is_dormitory && formData.number_of_beds ? parseInt(formData.number_of_beds) : null,
        max_occupants: formData.max_occupants ? parseInt(formData.max_occupants) : null,
        description: formData.description || null,
      }

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom.id}`, payload)
        setSuccess('Cập nhật phòng thành công')
      } else {
        await api.post('/rooms', payload)
        setSuccess('Thêm phòng mới thành công')
      }
      
      handleCloseDialog()
      fetchRooms()
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa phòng này?')) return
    
    try {
      await api.delete(`/rooms/${id}`)
      setSuccess('Xóa phòng thành công')
      fetchRooms()
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể xóa phòng')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success'
      case 'OCCUPIED':
        return 'error'
      case 'MAINTENANCE':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Trống'
      case 'OCCUPIED':
        return 'Đã thuê'
      case 'MAINTENANCE':
        return 'Bảo trì'
      default:
        return status
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quản lý Phòng</Typography>
        <Stack direction="row" spacing={2}>
          <Button startIcon={<RefreshIcon />} onClick={fetchRooms} disabled={loading}>
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Thêm phòng
          </Button>
        </Stack>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã phòng</TableCell>
              <TableCell>Tên phòng</TableCell>
              <TableCell>Tài sản</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Giá thuê/tháng</TableCell>
              <TableCell align="right">Diện tích (m²)</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.room_code}</TableCell>
                <TableCell>{room.room_name}</TableCell>
                <TableCell>
                  {properties.find(p => p.id === room.property_id)?.name || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(room.status)}
                    color={getStatusColor(room.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {room.monthly_rent.toLocaleString()} đ
                </TableCell>
                <TableCell align="right">{room.area || '-'}</TableCell>
                <TableCell>
                  {room.is_dormitory ? (
                    <Chip label="Ký túc xá" size="small" color="primary" />
                  ) : (
                    <Chip label="Phòng thường" size="small" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(room)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(room.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rooms.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Chưa có phòng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            fullWidth
            label="Mã phòng"
            value={formData.room_code}
            onChange={(e) => setFormData({ ...formData, room_code: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Tên phòng"
            value={formData.room_name}
            onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            select
            label="Tài sản"
            value={formData.property_id}
            onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
            margin="normal"
            required
          >
            {properties.map((prop) => (
              <MenuItem key={prop.id} value={prop.id}>
                {prop.name}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            select
            label="Trạng thái"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            margin="normal"
          >
            <MenuItem value="AVAILABLE">Trống</MenuItem>
            <MenuItem value="OCCUPIED">Đã thuê</MenuItem>
            <MenuItem value="MAINTENANCE">Bảo trì</MenuItem>
          </TextField>
          
          <TextField
            fullWidth
            label="Giá thuê/tháng (VNĐ)"
            type="number"
            value={formData.monthly_rent}
            onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Diện tích (m²)"
            type="number"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            select
            label="Loại phòng"
            value={formData.is_dormitory ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, is_dormitory: e.target.value === 'true' })}
            margin="normal"
          >
            <MenuItem value="false">Phòng thường</MenuItem>
            <MenuItem value="true">Ký túc xá</MenuItem>
          </TextField>
          
          {formData.is_dormitory && !editingRoom && (
            <TextField
              fullWidth
              label="Số giường"
              type="number"
              value={formData.number_of_beds}
              onChange={(e) => setFormData({ ...formData, number_of_beds: e.target.value })}
              margin="normal"
              helperText="Hệ thống sẽ tự động tạo giường"
            />
          )}
          
          <TextField
            fullWidth
            label="Số người tối đa"
            type="number"
            value={formData.max_occupants}
            onChange={(e) => setFormData({ ...formData, max_occupants: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Mô tả"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRoom ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
