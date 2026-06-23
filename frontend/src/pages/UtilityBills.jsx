import React, { useState, useEffect } from 'react';
import { 
  getUtilityBills, 
  createUtilityBill, 
  updateUtilityBill, 
  deleteUtilityBill,
  getContracts 
} from '../services/api';

function UtilityBills() {
  const [bills, setBills] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterContract, setFilterContract] = useState('');
  const [formData, setFormData] = useState({
    contractId: '',
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
      const [billsRes, contractsRes] = await Promise.all([
        getUtilityBills(),
        getContracts()
      ]);
      setBills(billsRes.data);
      setContracts(contractsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const billData = {
        ...formData,
        amount: parseFloat(formData.amount),
        paidDate: formData.isPaid && formData.paidDate ? formData.paidDate : null
      };
      
      if (editingBill) {
        await updateUtilityBill(editingBill.id, billData);
      } else {
        await createUtilityBill(billData);
      }
      setShowModal(false);
      setEditingBill(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving utility bill:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      contractId: bill.contractId,
      month: bill.month,
      amount: bill.amount,
      isPaid: bill.isPaid || false,
      paidDate: bill.paidDate ? bill.paidDate.split('T')[0] : '',
      notes: bill.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa hóa đơn này?')) {
      try {
        await deleteUtilityBill(id);
        loadData();
      } catch (error) {
        console.error('Error deleting utility bill:', error);
        alert('Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleTogglePaid = async (bill) => {
    try {
      const updatedBill = {
        ...bill,
        isPaid: !bill.isPaid,
        paidDate: !bill.isPaid ? new Date().toISOString().split('T')[0] : null
      };
      await updateUtilityBill(bill.id, updatedBill);
      loadData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleAddNew = () => {
    setEditingBill(null);
    resetForm();
    // Set default month to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setFormData(prev => ({ ...prev, month: currentMonth }));
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      contractId: '',
      month: '',
      amount: '',
      isPaid: false,
      paidDate: '',
      notes: ''
    });
  };

  const getContract = (contractId) => {
    return contracts.find(c => c.id === contractId);
  };

  const getFilteredBills = () => {
    let filtered = bills;
    if (filterMonth) {
      filtered = filtered.filter(b => b.month === filterMonth);
    }
    if (filterContract) {
      filtered = filtered.filter(b => b.contractId === filterContract);
    }
    return filtered;
  };

  const getTotalUnpaid = () => {
    return bills
      .filter(b => !b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getTotalPaid = () => {
    return bills
      .filter(b => b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  const filteredBills = getFilteredBills();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>Phí Điện Nước</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Thêm phí điện nước
        </button>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card warning">
          <h3>Chưa đóng</h3>
          <div className="value">{bills.filter(b => !b.isPaid).length}</div>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {getTotalUnpaid().toLocaleString('vi-VN')} VNĐ
          </p>
        </div>
        <div className="stat-card success">
          <h3>Đã đóng</h3>
          <div className="value">{bills.filter(b => b.isPaid).length}</div>
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Lọc theo hợp đồng:</label>
          <select
            value={filterContract}
            onChange={(e) => setFilterContract(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e0' }}
          >
            <option value="">Tất cả</option>
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.tenantName} - {contract.tenantPhone}
              </option>
            ))}
          </select>
        </div>
        {(filterMonth || filterContract) && (
          <button
            onClick={() => { setFilterMonth(''); setFilterContract(''); }}
            style={{ alignSelf: 'flex-end', padding: '0.5rem 1rem', background: '#718096', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {filteredBills.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có hóa đơn nào</h3>
          <p>Hãy thêm hóa đơn đầu tiên</p>
        </div>
      ) : (
        <div className="contract-list">
          {filteredBills.map(bill => {
            const contract = getContract(bill.contractId);
            return (
              <div 
                key={bill.id} 
                className="contract-item"
                style={{ 
                  borderLeft: bill.isPaid ? '4px solid #48bb78' : '4px solid #ed8936',
                  background: bill.isPaid ? '#f0fff4' : '#fffaf0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3>{contract?.tenantName || 'N/A'}</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                      {contract?.tenantPhone}
                    </p>
                  </div>
                  <div style={{ 
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    background: bill.isPaid ? '#48bb78' : '#ed8936',
                    color: 'white'
                  }}>
                    {bill.isPaid ? '✓ Đã đóng' : '⏱ Chưa đóng'}
                  </div>
                </div>
                
                <div className="contract-info" style={{ marginTop: '1rem' }}>
                  <div>
                    <strong>Tháng:</strong> {new Date(bill.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </div>
                  <div>
                    <strong>Số tiền:</strong> <span style={{ color: '#e53e3e', fontWeight: '600', fontSize: '1.1rem' }}>{bill.amount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  {bill.isPaid && bill.paidDate && (
                    <div>
                      <strong>Ngày đóng:</strong> {new Date(bill.paidDate).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                  {bill.notes && (
                    <div>
                      <strong>Ghi chú:</strong> {bill.notes}
                    </div>
                  )}
                </div>

                <div className="contract-actions" style={{ marginTop: '1rem' }}>
                  <button 
                    className={`btn ${bill.isPaid ? 'btn-warning' : 'btn-success'} btn-small`}
                    onClick={() => handleTogglePaid(bill)}
                  >
                    {bill.isPaid ? '↩ Đánh dấu chưa đóng' : '✓ Đánh dấu đã đóng'}
                  </button>
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => handleEdit(bill)}
                  >
                    Sửa
                  </button>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(bill.id)}
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
            <h2>{editingBill ? 'Sửa hóa đơn điện nước' : 'Thêm hóa đơn điện nước'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Hợp đồng *</label>
                <select
                  required
                  value={formData.contractId}
                  onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                >
                  <option value="">-- Chọn hợp đồng --</option>
                  {contracts.filter(c => c.status === 'active').map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.tenantName} - {contract.tenantPhone}
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
                <label>Số tiền (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100000"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isPaid: e.target.checked,
                      paidDate: e.target.checked ? new Date().toISOString().split('T')[0] : ''
                    })}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <span>Đã đóng</span>
                </label>
              </div>

              {formData.isPaid && (
                <div className="form-group">
                  <label>Ngày đóng</label>
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
                  {editingBill ? 'Cập nhật' : 'Thêm mới'}
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
