import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getHouses, getRooms, getBeds, getAssignments, getContracts, getRevenueStats, getRevenueHistory } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState(null);
  const [revenueHistory, setRevenueHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedHouseForChart, setSelectedHouseForChart] = useState('');

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
  }, [selectedMonth, selectedHouseForChart]);

  const loadData = async () => {
    try {
      const [statsRes, housesRes, roomsRes, bedsRes, assignmentsRes, contractsRes] = await Promise.all([
        getDashboardStats(),
        getHouses(),
        getRooms(),
        getBeds(),
        getAssignments(),
        getContracts()
      ]);

      setStats(statsRes.data);
      setHouses(housesRes.data);
      setRooms(roomsRes.data);
      setBeds(bedsRes.data);
      setAssignments(assignmentsRes.data);
      setContracts(contractsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadRevenueStats = async () => {
    try {
      const [revenueRes, historyRes] = await Promise.all([
        getRevenueStats(selectedMonth),
        getRevenueHistory(12, selectedHouseForChart || null)
      ]);
      setRevenueStats(revenueRes.data);
      setRevenueHistory(historyRes.data);
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

  // Helper functions for contract status
  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  const isContractExpiring = (endDate) => {
    const daysLeft = getDaysUntilExpiry(endDate);
    return daysLeft > 0 && daysLeft <= 30;
  };

  const isContractOverdue = (endDate) => {
    return getDaysUntilExpiry(endDate) < 0;
  };

  const getExpiringContracts = () => {
    return contracts.filter(c => isContractExpiring(c.endDate));
  };

  const getOverdueContracts = () => {
    return contracts.filter(c => isContractOverdue(c.endDate));
  };

  // Helper function to get bed and dome info for a contract
  const getContractBedInfo = (contractId) => {
    const assignment = assignments.find(a => a.contractId === contractId);
    if (!assignment) return null;
    
    const bed = beds.find(b => b.id === assignment.bedId);
    if (!bed) return null;
    
    const room = rooms.find(r => r.id === bed.roomId);
    if (!room) return null;
    
    const house = houses.find(h => h.id === room.houseId);
    if (!house) return null;
    
    return {
      bedName: bed.name,
      roomName: room.name,
      houseName: house.name
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

      {/* Houses Grid - Moved to top */}
      <div style={{ marginTop: '2rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#e6fffa', borderRadius: '8px', border: '2px solid #38b2ac' }}>
              <div style={{ fontSize: '0.85rem', color: '#234e52', marginBottom: '0.5rem' }}>💰 Tổng thu (Đã thu được)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#234e52' }}>
                {revenueStats.totalRevenue.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '2px solid #f59e0b' }}>
              <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '0.5rem' }}>📈 Tổng thu dự kiến</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#78350f' }}>
                {revenueStats.projectedRevenue.toLocaleString('vi-VN')} VNĐ
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
              border: revenueStats.netRevenue >= 0 ? '3px solid #48bb78' : '3px solid #e53e3e',
              gridColumn: 'span auto'
            }}>
              <div style={{ fontSize: '0.85rem', color: revenueStats.netRevenue >= 0 ? '#22543d' : '#742a2a', marginBottom: '0.5rem' }}>
                💰 Doanh thu thuần
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: revenueStats.netRevenue >= 0 ? '#22543d' : '#742a2a' }}>
                {revenueStats.netRevenue.toLocaleString('vi-VN')} VNĐ
              </div>
              <div style={{ fontSize: '0.75rem', color: '#718096', marginTop: '0.25rem' }}>
                = Thu thực tế + Phải đóng - Chi
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Trend Chart */}
      {revenueHistory.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', color: '#333' }}>📈 Xu hướng Doanh thu</h3>
            <div>
              <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>Lọc theo Dome:</label>
              <select
                value={selectedHouseForChart}
                onChange={(e) => setSelectedHouseForChart(e.target.value)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: '6px', 
                  border: '1px solid #cbd5e0',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                <option value="">Tất cả Dome</option>
                {houses.map(house => (
                  <option key={house.id} value={house.id}>{house.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => value.toLocaleString('vi-VN')}
                labelFormatter={(label) => `Tháng ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalRevenue" 
                stroke="#38b2ac" 
                strokeWidth={2}
                name="Tổng thu (Đã thu được)"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="projectedRevenue" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Tổng thu dự kiến"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="totalExpenses" 
                stroke="#f87171" 
                strokeWidth={2}
                name="Tổng chi"
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="netRevenue" 
                stroke="#48bb78" 
                strokeWidth={2}
                name="Doanh thu thuần"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Contract Status Sections */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Expiring Contracts */}
        <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #fed7d7' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#c53030', marginBottom: '1rem' }}>⏰ Hợp đồng sắp hết hạn</h3>
          {getExpiringContracts().length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Không có hợp đồng sắp hết hạn</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {getExpiringContracts().slice(0, 5).map(contract => {
                const bedInfo = getContractBedInfo(contract.id);
                return (
                  <div key={contract.id} style={{ padding: '0.75rem', background: '#fff5f5', borderRadius: '6px', borderLeft: '4px solid #ed8936' }}>
                    <div style={{ fontWeight: '600', color: '#744210' }}>{contract.tenantName}</div>
                    {bedInfo && (
                      <div style={{ fontSize: '0.8rem', color: '#744210', marginTop: '0.25rem' }}>
                        {bedInfo.houseName} • {bedInfo.roomName} • {bedInfo.bedName}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#c53030', marginTop: '0.25rem' }}>
                      Còn {getDaysUntilExpiry(contract.endDate)} ngày • Hết hạn: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                );
              })}
              {getExpiringContracts().length > 5 && (
                <div style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center', marginTop: '0.5rem' }}>
                  ... và {getExpiringContracts().length - 5} hợp đồng khác
                </div>
              )}
            </div>
          )}
        </div>

        {/* Overdue Contracts */}
        <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #fed7d7' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#742a2a', marginBottom: '1rem' }}>⛔ Hợp đồng quá hạn</h3>
          {getOverdueContracts().length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Không có hợp đồng quá hạn</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {getOverdueContracts().slice(0, 5).map(contract => {
                const bedInfo = getContractBedInfo(contract.id);
                return (
                  <div key={contract.id} style={{ padding: '0.75rem', background: '#fff5f5', borderRadius: '6px', borderLeft: '4px solid #f56565' }}>
                    <div style={{ fontWeight: '600', color: '#742a2a' }}>{contract.tenantName}</div>
                    {bedInfo && (
                      <div style={{ fontSize: '0.8rem', color: '#742a2a', marginTop: '0.25rem' }}>
                        {bedInfo.houseName} • {bedInfo.roomName} • {bedInfo.bedName}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#c53030', marginTop: '0.25rem' }}>
                      Quá hạn {Math.abs(getDaysUntilExpiry(contract.endDate))} ngày • Hết hạn: {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                );
              })}
              {getOverdueContracts().length > 5 && (
                <div style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center', marginTop: '0.5rem' }}>
                  ... và {getOverdueContracts().length - 5} hợp đồng khác
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '2px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#2d3748', marginBottom: '1rem' }}>📋 Tóm tắt hợp đồng</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tổng hợp đồng:</span>
              <span style={{ fontWeight: '600', color: '#667eea' }}>{contracts.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <span>Sắp hết hạn (≤30 ngày):</span>
              <span style={{ fontWeight: '600', color: '#ed8936' }}>{getExpiringContracts().length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Quá hạn:</span>
              <span style={{ fontWeight: '600', color: '#f56565' }}>{getOverdueContracts().length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
