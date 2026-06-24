import React, { useState, useEffect } from 'react';
import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getHouses 
} from '../services/api';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    category: '',
    houseId: null,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [expensesRes, housesRes] = await Promise.all([
        getExpenses(),
        getHouses()
      ]);
      setExpenses(expensesRes.data);
      setHouses(housesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        houseId: formData.houseId === '' ? null : formData.houseId
      };
      
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await createExpense(expenseData);
      }
      setShowModal(false);
      setEditingExpense(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      date: expense.date.split('T')[0],
      category: expense.category || '',
      houseId: expense.houseId || '',
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa khoản chi này?')) {
      try {
        await deleteExpense(id);
        loadData();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    resetForm();
    // Set default date to today
    setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      date: '',
      category: '',
      houseId: '',
      notes: ''
    });
  };

  const getHouse = (houseId) => {
    return houses.find(h => h.id === houseId);
  };

  const getFilteredExpenses = () => {
    let filtered = expenses;
    if (filterMonth) {
      filtered = filtered.filter(e => e.date.startsWith(filterMonth));
    }
    if (filterHouse === 'other') {
      filtered = filtered.filter(e => !e.houseId);
    } else if (filterHouse) {
      filtered = filtered.filter(e => e.houseId === filterHouse);
    }
    return filtered;
  };

  const getTotalExpenses = (expenseList = expenses) => {
    return expenseList.reduce((sum, e) => sum + e.amount, 0);
  };

  const getCategoryStats = () => {
    const categories = {};
    expenses.forEach(expense => {
      const cat = expense.category || 'Khác';
      if (!categories[cat]) {
        categories[cat] = { count: 0, total: 0 };
      }
      categories[cat].count++;
      categories[cat].total += expense.amount;
    });
    return Object.entries(categories).map(([name, data]) => ({ name, ...data }));
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  const filteredExpenses = getFilteredExpenses();
  const categoryStats = getCategoryStats();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>Quản lý Khoản Chi</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Thêm khoản chi
        </button>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card danger">
          <h3>Tổng chi</h3>
          <div className="value" style={{ fontSize: '1.5rem' }}>
            {getTotalExpenses().toLocaleString('vi-VN')} VNĐ
          </div>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            {expenses.length} khoản chi
          </p>
        </div>
        {categoryStats.slice(0, 3).map(cat => (
          <div key={cat.name} className="stat-card warning" style={{ background: '#fff5f5', border: '2px solid #fc8181' }}>
            <h3>{cat.name}</h3>
            <div className="value" style={{ fontSize: '1.2rem' }}>
              {cat.total.toLocaleString('vi-VN')} VNĐ
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {cat.count} khoản
            </p>
          </div>
        ))}
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
            <option value="other">Khác (Dùng chung)</option>
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

      {filteredExpenses.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có khoản chi nào</h3>
          <p>Hãy thêm khoản chi đầu tiên</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fff5f5', borderRadius: '8px', border: '2px solid #fc8181' }}>
            <strong style={{ color: '#c53030' }}>Tổng chi (đã lọc):</strong>
            <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#c53030', marginLeft: '0.5rem' }}>
              {getTotalExpenses(filteredExpenses).toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
          
          <div className="contract-list">
            {filteredExpenses.map(expense => {
              const house = expense.houseId ? getHouse(expense.houseId) : null;
              return (
                <div 
                  key={expense.id} 
                  className="contract-item"
                  style={{ borderLeft: '4px solid #e53e3e' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3>{expense.description}</h3>
                      {expense.category && (
                        <span style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          background: '#fed7d7',
                          color: '#c53030',
                          marginTop: '0.5rem'
                        }}>
                          {expense.category}
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: '#c53030'
                    }}>
                      -{expense.amount.toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  
                  <div className="contract-info" style={{ marginTop: '1rem' }}>
                    <div>
                      <strong>Ngày:</strong> {new Date(expense.date).toLocaleDateString('vi-VN')}
                    </div>
                    <div>
                      <strong>Dome:</strong> {house ? house.name : '🌐 Khác (Dùng chung)'}
                    </div>
                    {expense.notes && (
                      <div>
                        <strong>Ghi chú:</strong> {expense.notes}
                      </div>
                    )}
                  </div>

                  <div className="contract-actions" style={{ marginTop: '1rem' }}>
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => handleEdit(expense)}
                    >
                      Sửa
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(expense.id)}
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
            <h2>{editingExpense ? 'Sửa khoản chi' : 'Thêm khoản chi'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Mô tả khoản chi *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ví dụ: Sửa điều hòa phòng 101"
                />
              </div>

              <div className="form-group">
                <label>Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="500000"
                />
              </div>

              <div className="form-group">
                <label>Ngày chi *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phân loại chi tiết *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">-- Chọn loại --</option>
                  <option value="Thuê nhà">Thuê nhà</option>
                  <option value="Sửa chữa">Sửa chữa</option>
                  <option value="Mua sắm">Mua sắm</option>
                  <option value="Tiện ích">Tiện ích</option>
                  <option value="Bảo trì">Bảo trì</option>
                  <option value="Vệ sinh">Vệ sinh</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label>Gán cho Dome</label>
                <select
                  value={formData.houseId || ''}
                  onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
                >
                  <option value="">🌐 Khác (Dùng chung cho tất cả)</option>
                  {houses.map(house => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem' }}>
                  Chọn "Khác" nếu khoản chi không thuộc Dome cụ thể nào
                </p>
              </div>

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
                  {editingExpense ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
