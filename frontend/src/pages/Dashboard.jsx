import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getHouses, getRooms, getBeds, getAssignments, getContracts } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
