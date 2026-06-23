import { useState, useEffect } from 'react'
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
  Alert,
  Stack,
  Chip,
  Grid,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material'
import api from '../lib/api'

interface Invoice {
  id: number
  invoice_number: string
  contract_id: number
  issue_date: string
  due_date: string
  status: string
  rent_amount: number
  electricity_amount: number
  water_amount: number
  service_amount: number
  other_amount: number
  total_amount: number
  paid_amount: number
  payment_date?: string
  notes?: string
}

interface Contract {
  id: number
  contract_number: string
  tenant?: { full_name: string }
  room?: { room_name: string }
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [openDetailDialog, setOpenDetailDialog] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [formData, setFormData] = useState({
    contract_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    rent_amount: '',
    electricity_amount: '0',
    water_amount: '0',
    service_amount: '0',
    other_amount: '0',
    notes: '',
  })

  useEffect(() => {
    fetchInvoices()
    fetchContracts()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/invoices')
      setInvoices(response.data.items || [])
    } catch (err: any) {
      setError('Không thể tải danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts')
      setContracts(response.data.items || [])
    } catch (err) {
      console.error('Failed to fetch contracts')
    }
  }

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice)
      setFormData({
        contract_id: invoice.contract_id.toString(),
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        rent_amount: invoice.rent_amount.toString(),
        electricity_amount: invoice.electricity_amount.toString(),
        water_amount: invoice.water_amount.toString(),
        service_amount: invoice.service_amount.toString(),
        other_amount: invoice.other_amount.toString(),
        notes: invoice.notes || '',
      })
    } else {
      setEditingInvoice(null)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7)
      setFormData({
        contract_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        rent_amount: '',
        electricity_amount: '0',
        water_amount: '0',
        service_amount: '0',
        other_amount: '0',
        notes: '',
      })
    }
    setOpenDialog(true)
    setError('')
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingInvoice(null)
  }

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const response = await api.get(`/invoices/${invoice.id}`)
      setViewingInvoice(response.data)
      setOpenDetailDialog(true)
    } catch (err) {
      setError('Không thể tải chi tiết hóa đơn')
    }
  }

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false)
    setViewingInvoice(null)
  }

  const handleSubmit = async () => {
    try {
      setError('')
      const payload = {
        contract_id: parseInt(formData.contract_id),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        rent_amount: parseFloat(formData.rent_amount),
        electricity_amount: parseFloat(formData.electricity_amount),
        water_amount: parseFloat(formData.water_amount),
        service_amount: parseFloat(formData.service_amount),
        other_amount: parseFloat(formData.other_amount),
        notes: formData.notes || null,
      }

      if (editingInvoice) {
        await api.put(`/invoices/${editingInvoice.id}`, payload)
        setSuccess('Cập nhật hóa đơn thành công')
      } else {
        await api.post('/invoices', payload)
        setSuccess('Tạo hóa đơn mới thành công')
      }
      
      handleCloseDialog()
      fetchInvoices()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Có lỗi xảy ra')
    }
  }

  const handleMarkAsPaid = async (invoice: Invoice) => {
    if (!confirm('Xác nhận đã thanh toán hóa đơn này?')) return
    
    try {
      await api.put(`/invoices/${invoice.id}`, {
        status: 'PAID',
        paid_amount: invoice.total_amount,
        payment_date: new Date().toISOString().split('T')[0],
      })
      setSuccess('Đã cập nhật trạng thái thanh toán')
      fetchInvoices()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể cập nhật')
    }
  }

  const handleExportPDF = (invoice: Invoice) => {
    alert(`Xuất PDF cho hóa đơn ${invoice.invoice_number}\n(Tính năng đang phát triển)`)
  }

  const handlePrint = (invoice: Invoice) => {
    alert(`In hóa đơn ${invoice.invoice_number}\n(Tính năng đang phát triển)`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success'
      case 'UNPAID':
        return 'warning'
      case 'OVERDUE':
        return 'error'
      case 'CANCELLED':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán'
      case 'UNPAID':
        return 'Chưa thanh toán'
      case 'OVERDUE':
        return 'Quá hạn'
      case 'CANCELLED':
        return 'Đã hủy'
      default:
        return status
    }
  }

  const calculateTotal = () => {
    const rent = parseFloat(formData.rent_amount) || 0
    const electricity = parseFloat(formData.electricity_amount) || 0
    const water = parseFloat(formData.water_amount) || 0
    const service = parseFloat(formData.service_amount) || 0
    const other = parseFloat(formData.other_amount) || 0
    return rent + electricity + water + service + other
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Quản lý Hóa đơn</Typography>
        <Stack direction="row" spacing={2}>
          <Button startIcon={<RefreshIcon />} onClick={fetchInvoices} disabled={loading}>
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Tạo hóa đơn
          </Button>
        </Stack>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Số hóa đơn</TableCell>
              <TableCell>Hợp đồng</TableCell>
              <TableCell>Ngày xuất</TableCell>
              <TableCell>Hạn thanh toán</TableCell>
              <TableCell align="right">Tổng tiền</TableCell>
              <TableCell align="right">Đã thanh toán</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.invoice_number}</TableCell>
                <TableCell>
                  {contracts.find(c => c.id === invoice.contract_id)?.contract_number || '-'}
                </TableCell>
                <TableCell>{new Date(invoice.issue_date).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>{new Date(invoice.due_date).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell align="right">
                  {invoice.total_amount.toLocaleString()} đ
                </TableCell>
                <TableCell align="right">
                  {invoice.paid_amount.toLocaleString()} đ
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(invoice.status)}
                    color={getStatusColor(invoice.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewInvoice(invoice)}
                    title="Xem chi tiết"
                  >
                    <ViewIcon />
                  </IconButton>
                  {invoice.status !== 'PAID' && (
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleMarkAsPaid(invoice)}
                      title="Đánh dấu đã thanh toán"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handlePrint(invoice)}
                    title="In hóa đơn"
                  >
                    <PrintIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleExportPDF(invoice)}
                    title="Xuất PDF"
                  >
                    <PdfIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Chưa có hóa đơn nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Tạo/Sửa Hóa đơn */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInvoice ? 'Chỉnh sửa hóa đơn' : 'Tạo hóa đơn mới'}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <TextField
            fullWidth
            select
            label="Hợp đồng"
            value={formData.contract_id}
            onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
            margin="normal"
            required
          >
            {contracts.map((contract) => (
              <MenuItem key={contract.id} value={contract.id}>
                {contract.contract_number} - {contract.tenant?.full_name} ({contract.room?.room_name})
              </MenuItem>
            ))}
          </TextField>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Ngày xuất hóa đơn"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Hạn thanh toán"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
          
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Chi tiết khoản phí
          </Typography>
          
          <TextField
            fullWidth
            label="Tiền thuê phòng"
            type="number"
            value={formData.rent_amount}
            onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
            margin="normal"
            required
          />
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Tiền điện"
                type="number"
                value={formData.electricity_amount}
                onChange={(e) => setFormData({ ...formData, electricity_amount: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Tiền nước"
                type="number"
                value={formData.water_amount}
                onChange={(e) => setFormData({ ...formData, water_amount: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Phí dịch vụ"
                type="number"
                value={formData.service_amount}
                onChange={(e) => setFormData({ ...formData, service_amount: e.target.value })}
                margin="normal"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Chi phí khác"
                type="number"
                value={formData.other_amount}
                onChange={(e) => setFormData({ ...formData, other_amount: e.target.value })}
                margin="normal"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="h6">
              Tổng cộng: {calculateTotal().toLocaleString()} đ
            </Typography>
          </Box>
          
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
            {editingInvoice ? 'Cập nhật' : 'Tạo hóa đơn'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Chi tiết Hóa đơn */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết hóa đơn {viewingInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {viewingInvoice && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Số hóa đơn</Typography>
                  <Typography variant="body1">{viewingInvoice.invoice_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                  <Chip
                    label={getStatusLabel(viewingInvoice.status)}
                    color={getStatusColor(viewingInvoice.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Ngày xuất</Typography>
                  <Typography variant="body1">
                    {new Date(viewingInvoice.issue_date).toLocaleDateString('vi-VN')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Hạn thanh toán</Typography>
                  <Typography variant="body1">
                    {new Date(viewingInvoice.due_date).toLocaleDateString('vi-VN')}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" gutterBottom>Chi tiết khoản phí</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Tiền thuê phòng</TableCell>
                      <TableCell align="right">{viewingInvoice.rent_amount.toLocaleString()} đ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tiền điện</TableCell>
                      <TableCell align="right">{viewingInvoice.electricity_amount.toLocaleString()} đ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tiền nước</TableCell>
                      <TableCell align="right">{viewingInvoice.water_amount.toLocaleString()} đ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Phí dịch vụ</TableCell>
                      <TableCell align="right">{viewingInvoice.service_amount.toLocaleString()} đ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Chi phí khác</TableCell>
                      <TableCell align="right">{viewingInvoice.other_amount.toLocaleString()} đ</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Tổng cộng</strong></TableCell>
                      <TableCell align="right">
                        <strong>{viewingInvoice.total_amount.toLocaleString()} đ</strong>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Đã thanh toán</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        {viewingInvoice.paid_amount.toLocaleString()} đ
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {viewingInvoice.payment_date && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Ngày thanh toán</Typography>
                  <Typography variant="body1">
                    {new Date(viewingInvoice.payment_date).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
              )}
              
              {viewingInvoice.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Ghi chú</Typography>
                  <Typography variant="body1">{viewingInvoice.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => viewingInvoice && handlePrint(viewingInvoice)} startIcon={<PrintIcon />}>
            In
          </Button>
          <Button onClick={() => viewingInvoice && handleExportPDF(viewingInvoice)} startIcon={<PdfIcon />}>
            Xuất PDF
          </Button>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
