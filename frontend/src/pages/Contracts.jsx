import React, { useState, useEffect } from 'react';
import { getContracts, createContract, updateContract, deleteContract } from '../services/api';

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    tenantIdCard: '',
    startDate: '',
    endDate: '',
    price: '',
    equipment: [],
    notes: '',
    status: 'active'
  });
  const [newEquipment, setNewEquipment] = useState('');

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await getContracts();
      setContracts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading contracts:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const contractData = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      if (editingContract) {
        await updateContract(editingContract.id, contractData);
      } else {
        await createContract(contractData);
      }
      setShowModal(false);
      setEditingContract(null);
      resetForm();
      loadContracts();
    } catch (error) {
      console.error('Error saving contract:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      tenantName: contract.tenantName,
      tenantPhone: contract.tenantPhone,
      tenantEmail: contract.tenantEmail || '',
      tenantIdCard: contract.tenantIdCard || '',
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate.split('T')[0],
      price: contract.price,
      equipment: contract.equipment || [],
      notes: contract.notes || '',
      status: contract.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa hợp đồng này?')) {
      try {
        await deleteContract(id);
        loadContracts();
      } catch (error) {
        console.error('Error deleting contract:', error);
        alert('Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleAddNew = () => {
    setEditingContract(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      tenantIdCard: '',
      startDate: '',
      endDate: '',
      price: '',
      equipment: [],
      notes: '',
      status: 'active'
    });
    setNewEquipment('');
  };

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, newEquipment.trim()]
      });
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (index) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>Quản lý Hợp đồng</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Thêm hợp đồng mới
        </button>
      </div>

      {contracts.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có hợp đồng nào</h3>
          <p>Hãy thêm hợp đồng đầu tiên</p>
        </div>
      ) : (
        <div className="contract-list">
          {contracts.map(contract => (
            <div key={contract.id} className="contract-item">
              <h3>{contract.tenantName}</h3>
              <div className="contract-info">
                <div>
                  <strong>Điện thoại:</strong> {contract.tenantPhone}
                </div>
                <div>
                  <strong>Email:</strong> {contract.tenantEmail || 'N/A'}
                </div>
                <div>
                  <strong>CMND/CCCD:</strong> {contract.tenantIdCard || 'N/A'}
                </div>
                <div>
                  <strong>Giá:</strong> {contract.price.toLocaleString('vi-VN')} VNĐ/tháng
                </div>
                <div>
                  <strong>Từ ngày:</strong> {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                </div>
                <div>
                  <strong>Đến ngày:</strong> {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                </div>
              </div>
              
              {contract.equipment && contract.equipment.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Thiết bị bàn giao:</strong>
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    {contract.equipment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {contract.notes && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>Ghi chú:</strong> {contract.notes}
                </div>
              )}

              <div className="contract-actions">
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => handleEdit(contract)}
                >
                  Sửa
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(contract.id)}
                >
                  Xóa
                </button>
                <span 
                  style={{ 
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    background: contract.status === 'active' ? '#48bb78' : '#718096',
                    color: 'white'
                  }}
                >
                  {contract.status === 'active' ? 'Đang hiệu lực' : 'Hết hiệu lực'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingContract ? 'Sửa hợp đồng' : 'Thêm hợp đồng mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên người thuê *</label>
                <input
                  type="text"
                  required
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  required
                  value={formData.tenantPhone}
                  onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                  placeholder="0123456789"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.tenantEmail}
                  onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-group">
                <label>CMND/CCCD</label>
                <input
                  type="text"
                  value={formData.tenantIdCard}
                  onChange={(e) => setFormData({ ...formData, tenantIdCard: e.target.value })}
                  placeholder="123456789"
                />
              </div>

              <div className="form-group">
                <label>Ngày bắt đầu *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ngày kết thúc *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Giá (VNĐ/tháng) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1000000"
                />
              </div>

              <div className="form-group">
                <label>Thiết bị bàn giao</label>
                <div className="equipment-list">
                  {formData.equipment.map((item, index) => (
                    <div key={index} className="equipment-item">
                      <input type="text" value={item} readOnly />
                      <button type="button" onClick={() => handleRemoveEquipment(index)}>
                        Xóa
                      </button>
                    </div>
                  ))}
                  <div className="equipment-item">
                    <input
                      type="text"
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                      placeholder="Nhập tên thiết bị..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEquipment();
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddEquipment}
                      style={{ background: '#48bb78' }}
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="form-group">
                <label>Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Đang hiệu lực</option>
                  <option value="inactive">Hết hiệu lực</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContract ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contracts;
