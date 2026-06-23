import React, { useState, useEffect } from 'react';
import { 
  getRentExpenses, 
  createRentExpense, 
  updateRentExpense, 
  deleteRentExpense,
  getHouses 
} from '../services/api';

function RentExpenses() {
  const [rentExpenses, setRentExpenses] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRent, setEditingRent] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [formData, setFormData] = useState({
    houseId: '',
    month: '',
    amount: '',
    isPaid: false,
    paidDate: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rentsRes, housesRes] = await Promise.all([
        getRentExpenses(),
        getHouses()
      ]);
      setRentExpenses(rentsRes.data);
      setHouses(housesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.houseId || !formData.month || !formData.amount) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }
    
    if (parseFloat(formData.amount) <= 0) {
      alert('Số tiền phải lớn hơn 0');
      return;
    }

    try {
      const rentData = {
        houseId: formData.houseId,
        month: formData.month,
        amount: parseFloat(formData.amount),
        isPaid: formData.isPaid,
        paidDate: formData.isPaid ? formData.paidDate : null,
        notes: formData.notes
      };
      
      if (editingRent) {
        await updateRentExpense(editingRent.id, rentData);
      } else {
        await createRentExpense(rentData);
      }
      setShowModal(false);
      setEditingRent(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving rent expense:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleEdit = (rent) => {
    setEditingRent(rent);
    setFormData({
      houseId: rent.houseId,
      month: rent.month,
      amount: rent.amount,
      isPaid: rent.isPaid || false,
      paidDate: rent.paidDate || '',
      notes: rent.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khoản thuê nhà này?')) {
      try {
        await deleteRentExpense(id);
        loadData();
      } catch (error) {
        console.error('Error deleting rent expense:', error);
        alert('Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleAddNew = () => {
    setEditingRent(null);
    resetForm();
    // Set default month to current month
    const now = new Date();
    const currentMonth = now.toISOString().split('T')[0].substring(0, 7);
    setFormData(prev => ({ ...prev, month: currentMonth }));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      houseId: '',
      month: '',
      amount: '',
      isPaid: false,
      paidDate: '',
      notes: ''
    });
  };

  const getHouse = (houseId) => {
    return houses.find(h => h.id === houseId);
  };

  const getFilteredRents = () => {
    let filtered = rentExpenses;
    if (filterMonth) {
      filtered = filtered.filter(r => r.month === filterMonth);
    }
    if (filterHouse) {
      filtered = filtered.filter(r => r.houseId === filterHouse);
    }
    return filtered.sort((a, b) => b.month.localeCompare(a.month));
  };

  const getTotalRents = (rentList = rentExpenses) => {
    return rentList.reduce((sum, r) => sum + r.amount, 0);
  };

  const getTotalPaid = (rentList = rentExpenses) => {
    return rentList.filter(r => r.isPaid).reduce((sum, r) => sum + r.amount, 0);
  };

  const getTotalUnpaid = (rentList = rentExpenses) => {
    return rentList.filter(r => !r.isPaid).reduce((sum, r) => sum + r.amount, 0);
  };

  const getHouseStats = () => {
    const stats = {};
    rentExpenses.forEach(rent => {
      if (!stats[rent.houseId]) {
        stats[rent.houseId] = { total: 0, paid: 0, unpaid: 0, count: 0 };
      }
      stats[rent.houseId].total += rent.amount;
      stats[rent.houseId].count++;
      if (rent.isPaid) {
        stats[rent.houseId].paid += rent.amount;
      } else {
        stats[rent.houseId].unpaid += rent.amount;
      }
    });
    return stats;
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  const filteredRents = getFilteredRents();
  const houseStats = getHouseStats();
  const totalRents = getTotalRents();
  const totalPaid = getTotalPaid();
  const totalUnpaid = getTotalUnpaid();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>Quản lý Khoản Thuê Nhà</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Thêm khoản thuê
        </button>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card" style={{ background: '#f0fdf4', border: '2px solid #86efac' }}>
          <h3 style={{ color: '#16a34a' }}>Tổng chi tiêu</h3>
          <div className="value" style={{ fontSize: '1.5rem', color: '#16a34a' }}>
            {totalRents.toLocaleString('vi-VN')} VNĐ
          </div>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {rentExpenses.length} khoản thuê
          </p>
        </div>

        <div className="stat-card" style={{ background: '#f0fdf4', border: '2px solid #86efac' }}>
          <h3 style={{ color: '#16a34a' }}>Đã thanh toán</h3>
          <div className="value" style={{ fontSize: '1.5rem', color: '#16a34a' }}>
            {totalPaid.toLocaleString('vi-VN')} VNĐ
          </div>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {rentExpenses.filter(r => r.isPaid).length} khoản
          </p>
        </div>

        <div className="stat-card" style={{ background: '#fefce8', border: '2px solid #facc15' }}>
          <h3 style={{ color: '#ca8a04' }}>Chưa thanh toán</h3>
          <div className="value" style={{ fontSize: '1.5rem', color: '#ca8a04' }}>
            {totalUnpaid.toLocaleString('vi-VN')} VNĐ
          </div>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {rentExpenses.filter(r => !r.isPaid).length} khoản
          </p>
        </div>

        {houses.map(house => {
          const stats = houseStats[house.id] || { total: 0, paid: 0, unpaid: 0, count: 0 };
          return (
            <div key={house.id} className="stat-card" style={{ background: '#f3f4f6', border: '2px solid #d1d5db' }}>
              <h3>{house.name}</h3>
              <div className="value" style={{ fontSize: '1rem' }}>
                {stats.total.toLocaleString('vi-VN')} VNĐ
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#16a34a' }}>
                ✓ Đã: {stats.paid.toLocaleString('vi-VN')}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#ca8a04' }}>
                ⏳ Chưa: {stats.unpaid.toLocaleString('vi-VN')}
              </p>
            </div>
          );
        })}
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lọc theo Dome:</label>
          <select
            value={filterHouse}
            onChange={(e) => setFilterHouse(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          >
            <option value="">Tất cả</option>
            {houses.map(house => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
        </div>
        {(filterMonth || filterHouse) && (
          <button
            onClick={() => { setFilterMonth(''); setFilterHouse(''); }}
            style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', background: '#718096', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {filteredRents.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có khoản thuê nào</h3>
          <p>Hãy thêm khoản thuê đầu tiên</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '2px solid #86efac' }}>
            <strong style={{ color: '#16a34a' }}>Tổng chi tiêu (đã lọc):</strong>
            <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#16a34a', marginLeft: '0.5rem' }}>
              {getTotalRents(filteredRents).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          
          <div className="contract-list">
            {filteredRents.map(rent => {
              const house = getHouse(rent.houseId);
              const monthDate = new Date(rent.month + '-01');
              const monthStr = monthDate.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
              
              return (
                <div 
                  key={rent.id} 
                  className="contract-item"
                  style={{ borderLeft: `4px solid ${rent.isPaid ? '#16a34a' : '#ca8a04'}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3>{house ? house.name : 'Không xác định'}</h3>
                      <div style={{ 
                        display: 'inline-block',
                        marginTop: '0.5rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: rent.isPaid ? '#dcfce7' : '#fef3c7',
                        color: rent.isPaid ? '#16a34a' : '#ca8a04'
                      }}>
                        {rent.isPaid ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                      </div>
                    </div>
                    <div style={{ 
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: rent.isPaid ? '#16a34a' : '#ca8a04'
                    }}>
                      {rent.amount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  
                  <div className="contract-info" style={{ marginTop: '1rem' }}>
                    <div>
                      <strong>Tháng:</strong> {monthStr}
                    </div>
                    {rent.isPaid && rent.paidDate && (
                      <div>
                        <strong>Ngày thanh toán:</strong> {new Date(rent.paidDate).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {rent.notes && (
                      <div>
                        <strong>Ghi chú:</strong> {rent.notes}
                      </div>
                    )}
                  </div>

                  <div className="contract-actions" style={{ marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(rent)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(rent.id)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRent ? 'Sửa khoản thuê' : 'Thêm khoản thuê'}</h2>
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
              </div>

              <div className="form-group">
                <label>Số tiền thuê (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="5000000"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  />
                  {' '}Đã thanh toán
                </label>
              </div>

              {formData.isPaid && (
                <div className="form-group">
                  <label>Ngày thanh toán</label>
                  <input
                    type="date"
                    value={formData.paidDate}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRent ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentExpenses;
