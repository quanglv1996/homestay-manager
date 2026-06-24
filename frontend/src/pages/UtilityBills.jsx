import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UtilityBills() {
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    houseId: '',
    month: '',
    electricity: '',
    water: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [housesRes, roomsRes, contractsRes, distRes] = await Promise.all([
        axios.get('/api/houses'),
        axios.get('/api/rooms'),
        axios.get('/api/contracts'),
        axios.get('/api/utility-distributions')
      ]);
      setHouses(housesRes.data);
      setRooms(roomsRes.data);
      setContracts(contractsRes.data);
      setDistributions(distRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setFormData({
      houseId: '',
      month: currentMonth,
      electricity: '',
      water: ''
    });
    setPreview(null);
    setError('');
    setShowModal(true);
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!formData.houseId || !formData.electricity || !formData.water || !formData.month) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setError('');
      const electricity = parseFloat(formData.electricity);
      const water = parseFloat(formData.water);

      if (electricity < 0 || water < 0) {
        setError('Giá tiền phải là số dương');
        return;
      }

      const house = houses.find(h => h.id === formData.houseId);
      if (!house) {
        setError('Không tìm thấy Dome');
        return;
      }

      // Calculate total cost
      const totalCost = electricity + water;
      setPreview({
        totalElectricity: electricity,
        totalWater: water,
        totalCost: totalCost,
        house: house,
        message: 'Hệ thống sẽ tự động phân bổ chi phí này cho tất cả hợp đồng trong Dome dựa vào số ngày ở của mỗi hợp đồng.'
      });
    } catch (err) {
      setError('Có lỗi xảy ra: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const electricity = parseFloat(formData.electricity);
      const water = parseFloat(formData.water);

      if (electricity < 0 || water < 0 || !formData.houseId || !formData.month) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      // Call the house-level distribution API
      const response = await axios.post(
        `/api/utility-distributions/house/${formData.houseId}/distribute`,
        null,
        {
          params: {
            electricity,
            water,
            month: formData.month
          }
        }
      );

      if (response.data.success) {
        setSuccess(`✓ ${response.data.message}`);
        setShowModal(false);
        setFormData({
          houseId: '',
          month: '',
          electricity: '',
          water: ''
        });
        setPreview(null);
        loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleTogglePaid = async (distribution) => {
    try {
      await axios.put(
        `/api/utility-distributions/${distribution.id}`,
        {
          ...distribution,
          isPaid: !distribution.isPaid,
          paidDate: !distribution.isPaid ? new Date().toISOString().split('T')[0] : null
        }
      );
      loadData();
    } catch (err) {
      setError('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa phân bổ này?')) {
      try {
        await axios.delete(`/api/utility-distributions/${id}`);
        loadData();
      } catch (err) {
        setError('Có lỗi xảy ra khi xóa');
      }
    }
  };

  const getFilteredDistributions = () => {
    let filtered = distributions;
    if (filterMonth) {
      filtered = filtered.filter(d => d.month === filterMonth);
    }
    if (filterRoom) {
      filtered = filtered.filter(d => d.roomId === filterRoom);
    }
    return filtered;
  };

  const getTotalUnpaid = () => {
    return distributions
      .filter(d => !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0);
  };

  const getTotalPaid = () => {
    return distributions
      .filter(d => d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0);
  };

  const getRoom = (roomId) => {
    return rooms.find(r => r.id === roomId);
  };

  const getHouse = (houseId) => {
    return houses.find(h => h.id === houseId);
  };

  const getContract = (contractId) => {
    return contracts.find(c => c.id === contractId);
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  const filteredDistributions = getFilteredDistributions();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>💡 Phí Điện Nước</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Tính toán phí điện nước
        </button>
      </div>

      {success && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          background: '#f0fff4',
          color: '#22543d',
          border: '2px solid #48bb78',
          borderRadius: '6px'
        }}>
          {success}
        </div>
      )}

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card warning">
          <h3>Chưa thanh toán</h3>
          <div className="value">{distributions.filter(d => !d.isPaid).length}</div>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {getTotalUnpaid().toLocaleString('vi-VN')} VNĐ
          </p>
        </div>
        <div className="stat-card success">
          <h3>Đã thanh toán</h3>
          <div className="value">{distributions.filter(d => d.isPaid).length}</div>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {getTotalPaid().toLocaleString('vi-VN')} VNĐ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lọc theo tháng:</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          />
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lọc theo phòng:</label>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          >
            <option value="">Tất cả phòng</option>
            {rooms.map(room => {
              const house = getHouse(room.houseId);
              return (
                <option key={room.id} value={room.id}>
                  {house?.name} - {room.name}
                </option>
              );
            })}
          </select>
        </div>
        {(filterMonth || filterRoom) && (
          <button
            onClick={() => { setFilterMonth(''); setFilterRoom(''); }}
            style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', background: '#718096', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {filteredDistributions.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có phân bổ phí điện nước</h3>
          <p>Hãy tính toán phí điện nước cho một Dome</p>
        </div>
      ) : (
        <div className="contract-list">
          {filteredDistributions.map(dist => {
            const room = getRoom(dist.roomId);
            const house = getHouse(dist.houseId);
            const contract = getContract(dist.contractId);
            return (
              <div 
                key={dist.id} 
                className="contract-item"
                style={{ 
                  borderLeft: dist.isPaid ? '4px solid #48bb78' : '4px solid #3182ce',
                  background: dist.isPaid ? '#f0fff4' : '#ebf8ff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3>{contract?.tenantName || 'N/A'}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                      📍 {house?.name} - {room?.name}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                      Điện thoại: {contract?.tenantPhone}
                    </p>
                  </div>
                  <div style={{ 
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    background: dist.isPaid ? '#48bb78' : '#3182ce',
                    color: 'white'
                  }}>
                    {dist.isPaid ? '✓ Đã TT' : '⏳ Chờ'}
                  </div>
                </div>
                
                <div className="contract-info" style={{ marginTop: '1rem' }}>
                  <div>
                    <strong>Tháng:</strong> {new Date(dist.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </div>
                  <div>
                    <strong>Phí phân bổ:</strong> <span style={{ color: '#e53e3e', fontWeight: '600', fontSize: '1.1rem' }}>{dist.amount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  {dist.isPaid && dist.paidDate && (
                    <div>
                      <strong>Ngày thanh toán:</strong> {new Date(dist.paidDate).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                  {dist.notes && (
                    <div>
                      <strong>Ghi chú:</strong> {dist.notes}
                    </div>
                  )}
                </div>

                <div className="contract-actions" style={{ marginTop: '1rem' }}>
                  <button 
                    className={`btn ${dist.isPaid ? 'btn-warning' : 'btn-success'} btn-small`}
                    onClick={() => handleTogglePaid(dist)}
                  >
                    {dist.isPaid ? '↩ Đánh dấu chưa TT' : '✓ Đánh dấu đã TT'}
                  </button>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(dist.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>💡 Tính toán phí điện nước cho Dome</h2>
            
            {error && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                background: '#fff5f5',
                color: '#c53030',
                border: '2px solid #fc8181',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Chọn Dome *</label>
                <select
                  required
                  value={formData.houseId}
                  onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
                >
                  <option value="">-- Chọn Dome --</option>
                  {houses.map(house => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tháng *</label>
                <input
                  type="month"
                  required
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                />
                <small style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  💡 Thường điện nước được thu sau khi sử dụng
                </small>
              </div>

              <div className="form-group">
                <label>Tiền Điện (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.electricity}
                  onChange={(e) => setFormData({ ...formData, electricity: e.target.value })}
                  placeholder="100000"
                />
              </div>

              <div className="form-group">
                <label>Tiền Nước (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.water}
                  onChange={(e) => setFormData({ ...formData, water: e.target.value })}
                  placeholder="50000"
                />
              </div>

              {preview && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: '#ebf8ff',
                  border: '2px solid #3182ce',
                  borderRadius: '6px',
                  color: '#1e3a8a'
                }}>
                  <strong>📊 Tổng chi phí cho {preview.house.name}:</strong>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#e53e3e' }}>
                    {preview.totalCost.toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Điện: {preview.totalElectricity.toLocaleString('vi-VN')} VNĐ + Nước: {preview.totalWater.toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.75rem', fontStyle: 'italic', color: '#2d3748' }}>
                    ℹ️ {preview.message}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning"
                  onClick={handlePreview}
                >
                  👁 Xem trước
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!preview}
                >
                  💾 Tính toán & Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UtilityBills;
