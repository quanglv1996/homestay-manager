import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getHouses, getRooms, getBeds, getAssignments, getContracts, getRevenueStats, getRevenueStatsByDome } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState(null);
  const [revenueStatsByDome, setRevenueStatsByDome] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    // Set default month to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadRevenueStats();
    }
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      const [statsRes, housesRes, roomsRes, bedsRes, assignmentsRes] = await Promise.all([
        getDashboardStats(),
        getHouses(),
        getRooms(),
        getBeds(),
        getAssignments()
      ]);

      setStats(statsRes.data);
      setHouses(housesRes.data);
      setRooms(roomsRes.data);
      setBeds(bedsRes.data);
      setAssignments(assignmentsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadRevenueStats = async () => {
    try {
      const [revenueRes, domeRevenueRes] = await Promise.all([
        getRevenueStats(selectedMonth),
        getRevenueStatsByDome(selectedMonth)
      ]);
      setRevenueStats(revenueRes.data);
      setRevenueStatsByDome(domeRevenueRes.data);
    } catch (error) {
      console.error('Error loading revenue stats:', error);
    }
  };

  const getHouseStats = (houseId) => {
    const houseRooms = rooms.filter(r => r.houseId === houseId);
    const roomIds = houseRooms.map(r => r.id);
    const houseBeds = beds.filter(b => roomIds.includes(b.roomId));
    const totalPositions = houseBeds.length * 2; // Each bed has 2 levels
    const occupiedPositions = assignments.filter(a => 
      houseBeds.some(b => b.id === a.bedId)
    ).length;

    return {
      totalRooms: houseRooms.length,
      totalBeds: houseBeds.length,
      totalPositions,
      occupiedPositions,
      availablePositions: totalPositions - occupiedPositions
    };
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '2rem', fontSize: '2rem', color: '#333' }}>
        Dashboard Tổng Quan
      </h2>

      {/* Statistics Cards */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card primary">
            <h3>Tổng số giường</h3>
            <div className="value">{stats.totalBeds}</div>
          </div>
          <div className="stat-card success">
            <h3>Vị trí trống</h3>
            <div className="value">{stats.availablePositions}</div>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#888' }}>
              Mỗi giường có 2 tầng
            </p>
          </div>
          <div className="stat-card warning">
            <h3>Sắp đến hạn thanh toán</h3>
            <div className="value">{stats.paymentDueSoon}</div>
          </div>
          <div className="stat-card danger">
            <h3>Sắp hết hạn hợp đồng</h3>
            <div className="value">{stats.contractExpiringSoon}</div>
          </div>
        </div>
      )}

      {/* Revenue Statistics */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#333' }}>📊 Thống kê Doanh thu</h3>
          <div>
            <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>Tháng:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
            />
          </div>
        </div>
        
        {revenueStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#e6fffa', borderRadius: '8px', border: '2px solid #38b2ac' }}>
              <div style={{ fontSize: '0.85rem', color: '#234e52', marginBottom: '0.5rem' }}>Tổng thu (Hợp đồng)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#234e52' }}>
                {revenueStats.totalRevenue.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#e6ffed', borderRadius: '8px', border: '2px solid #48bb78' }}>
              <div style={{ fontSize: '0.85rem', color: '#22543d', marginBottom: '0.5rem' }}>Phí điện nước đã thu</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22543d' }}>
                {revenueStats.totalUtilityBills.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#fff5f5', borderRadius: '8px', border: '2px solid #fc8181' }}>
              <div style={{ fontSize: '0.85rem', color: '#742a2a', marginBottom: '0.5rem' }}>Tổng chi</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#742a2a' }}>
                {revenueStats.totalExpenses.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
            <div style={{ 
              padding: '1rem', 
              background: revenueStats.netRevenue >= 0 ? '#f0fff4' : '#fff5f5', 
              borderRadius: '8px', 
              border: revenueStats.netRevenue >= 0 ? '3px solid #48bb78' : '3px solid #e53e3e' 
            }}>
              <div style={{ fontSize: '0.85rem', color: revenueStats.netRevenue >= 0 ? '#22543d' : '#742a2a', marginBottom: '0.5rem' }}>
                💰 Doanh thu thuần
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: revenueStats.netRevenue >= 0 ? '#22543d' : '#742a2a' }}>
                {revenueStats.netRevenue.toLocaleString('vi-VN')} VNĐ
              </div>
              <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>
                = Thu + Điện nước - Chi
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dome Revenue Statistics */}
      {revenueStatsByDome.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '1.5rem' }}>💰 Doanh thu từng Dome</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {revenueStatsByDome.map((dome) => (
              <div key={dome.houseId} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '1.1rem', color: '#2d3748', marginBottom: '1rem', fontWeight: '600' }}>
                  🏠 {dome.houseName}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#e6fffa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#234e52', marginBottom: '0.25rem' }}>Thu</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#234e52' }}>
                      {dome.totalRevenue.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#e6ffed', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#22543d', marginBottom: '0.25rem' }}>Điện nước</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#22543d' }}>
                      {dome.totalUtilityBills.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#fff5f5', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#742a2a', marginBottom: '0.25rem' }}>Chi</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#742a2a' }}>
                      {dome.totalExpenses.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: dome.netRevenue >= 0 ? '#f0fff4' : '#fff5f5', 
                    borderRadius: '6px',
                    border: dome.netRevenue >= 0 ? '1px solid #48bb78' : '1px solid #e53e3e'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: dome.netRevenue >= 0 ? '#22543d' : '#742a2a', marginBottom: '0.25rem' }}>
                      💰 Lợi nhuận
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: dome.netRevenue >= 0 ? '#22543d' : '#742a2a' }}>
                      {dome.netRevenue.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Houses Grid */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#333' }}>Các Dome</h3>
          <Link to="/houses" className="btn btn-primary">
            Quản lý Dome
          </Link>
        </div>

        {houses.length === 0 ? (
          <div className="empty-state">
            <h3>Chưa có Dome nào</h3>
            <p>Hãy thêm Dome đầu tiên của bạn</p>
            <Link to="/houses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Thêm Dome
            </Link>
          </div>
        ) : (
          <div className="houses-grid">
            {houses.map(house => {
              const houseStats = getHouseStats(house.id);
              return (
                <Link 
                  key={house.id} 
                  to={`/houses/${house.id}`} 
                  style={{ textDecoration: 'none' }}
                >
                  <div className="house-card">
                    <h3>{house.name}</h3>
                    <p>{house.description || 'Không có mô tả'}</p>
                    <div className="stats">
                      <span>Phòng: {houseStats.totalRooms}</span>
                      <span>Giường: {houseStats.totalBeds}</span>
                      <span style={{ color: '#48bb78', fontWeight: 600 }}>
                        Trống: {houseStats.availablePositions}/{houseStats.totalPositions}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
