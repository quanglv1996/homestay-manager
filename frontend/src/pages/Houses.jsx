import React, { useState, useEffect } from 'react';
import { getHouses, createHouse, updateHouse, deleteHouse } from '../services/api';

function Houses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      const response = await getHouses();
      setHouses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading houses:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHouse) {
        await updateHouse(editingHouse.id, formData);
      } else {
        await createHouse(formData);
      }
      setShowModal(false);
      setEditingHouse(null);
      setFormData({ name: '', description: '' });
      loadHouses();
    } catch (error) {
      console.error('Error saving house:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleEdit = (house) => {
    setEditingHouse(house);
    setFormData({
      name: house.name,
      description: house.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa Dome này? Tất cả phòng và giường sẽ bị xóa.')) {
      try {
        await deleteHouse(id);
        loadHouses();
      } catch (error) {
        console.error('Error deleting house:', error);
        alert('Có lỗi xảy ra khi xóa');
      }
    }
  };

  const handleAddNew = () => {
    setEditingHouse(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>Quản lý Dome</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Thêm Dome mới
        </button>
      </div>

      {houses.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có Dome nào</h3>
          <p>Hãy thêm Dome đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="houses-grid">
          {houses.map(house => (
            <div key={house.id} className="house-card">
              <h3>{house.name}</h3>
              <p>{house.description || 'Không có mô tả'}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary btn-small"
                  onClick={() => window.location.href = `/houses/${house.id}`}
                >
                  Xem chi tiết
                </button>
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => handleEdit(house)}
                >
                  Sửa
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(house.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingHouse ? 'Sửa Dome' : 'Thêm Dome mới'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Dome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Dome A"
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả về Dome này..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingHouse ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Houses;
