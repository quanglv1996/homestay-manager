import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material'
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Assignment as ContractIcon,
} from '@mui/icons-material'
import api from '../lib/api'

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data
    },
  })

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value || 0}</Typography>
          </Box>
          <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng số tài sản"
            value={stats?.total_properties}
            icon={<HomeIcon fontSize="inherit" />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tổng số phòng"
            value={stats?.total_rooms}
            icon={<HomeIcon fontSize="inherit" />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Người thuê"
            value={stats?.total_tenants}
            icon={<PeopleIcon fontSize="inherit" />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hợp đồng đang hoạt động"
            value={stats?.active_contracts}
            icon={<ContractIcon fontSize="inherit" />}
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tỷ lệ lấp đầy
            </Typography>
            <Typography variant="h3" color="primary">
              {stats?.occupancy_rate?.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats?.occupied_rooms} / {stats?.total_rooms} phòng đã cho thuê
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Doanh thu tháng này
            </Typography>
            <Typography variant="h3" color="success.main">
              {stats?.revenue_this_month?.toLocaleString('vi-VN')} ₫
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hóa đơn chưa thanh toán: {stats?.unpaid_invoices}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
