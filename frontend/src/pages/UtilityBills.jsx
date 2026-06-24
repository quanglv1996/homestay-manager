import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatNumberDisplay, removeNumberFormatting } from '../utils/formatNumber';

function UtilityBills() {
  const [houses, setHouses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [utilityInputs, setUtilityInputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [editingInputId, setEditingInputId] = useState(null);
  const [editingInputForm, setEditingInputForm] = useState({
    houseId: '',
    month: '',
    electricity: '',
    water: '',
    notes: ''
  });
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
      const [housesRes, roomsRes, contractsRes, distRes, inputsRes] = await Promise.all([
        axios.get('/api/houses'),
        axios.get('/api/rooms'),
        axios.get('/api/contracts'),
        axios.get('/api/utility-distributions'),
        axios.get('/api/utility-inputs')
      ]);
      setHouses(housesRes.data);
      setRooms(roomsRes.data);
      setContracts(contractsRes.data);
      setDistributions(distRes.data);
      setUtilityInputs(inputsRes.data);
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
      setError('');
      await axios.put(
        `/api/utility-distributions/${distribution.id}`,
        {
          ...distribution,
          isPaid: !distribution.isPaid,
          paidDate: !distribution.isPaid ? new Date().toISOString().split('T')[0] : null
        }
      );
      setSuccess('✓ Cập nhật trạng thái thanh toán thành công');
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleDelete = async (id) => {
    setPendingAction({
      type: 'delete',
      id: id
    });
    setShowPasswordDialog(true);
  };

  const handleDeleteInput = async (inputId) => {
    setPendingAction({
      type: 'deleteInput',
      id: inputId
    });
    setShowPasswordDialog(true);
  };

  const executePasswordAction = async () => {
    if (!pendingAction || !password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setError('');
      
      if (pendingAction.type === 'delete') {
        await axios.delete(
          `/api/utility-distributions/${pendingAction.id}?password=${encodeURIComponent(password)}`
        );
        setSuccess('✓ Xóa phân bổ thành công');
      } else if (pendingAction.type === 'deleteInput') {
        await axios.delete(
          `/api/utility-inputs/${pendingAction.id}?password=${encodeURIComponent(password)}`
        );
        setSuccess('✓ Xóa thông tin nhập tính toán và các hóa đơn liên quan');
      } else if (pendingAction.type === 'updateInput') {
        await axios.put(
          `/api/utility-inputs/${pendingAction.id}?password=${encodeURIComponent(password)}`,
          pendingAction.data
        );
        setSuccess('✓ Cập nhật thông tin nhập tính toán thành công');
        setEditingInputId(null);
      }

      setShowPasswordDialog(false);
      setPassword('');
      setPendingAction(null);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || 'Mật khẩu không chính xác hoặc có lỗi xảy ra');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleEditInput = (input) => {
    setEditingInputId(input.id);
    setEditingInputForm({
      houseId: input.houseId,
      month: input.month,
      electricity: input.electricity.toString(),
      water: input.water.toString(),
      notes: input.notes || ''
    });
  };

  const handleSaveInput = async () => {
    if (!editingInputForm.houseId || !editingInputForm.month || !editingInputForm.electricity || !editingInputForm.water) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setPendingAction({
      type: 'updateInput',
      id: editingInputId,
      data: {
        houseId: editingInputForm.houseId,
        month: editingInputForm.month,
        electricity: parseFloat(editingInputForm.electricity),
        water: parseFloat(editingInputForm.water),
        notes: editingInputForm.notes
      }
    });
    setShowPasswordDialog(true);
  };

  const handleCancelEdit = () => {
    setEditingInputId(null);
    setEditingInputForm({
      houseId: '',
      month: '',
      electricity: '',
      water: '',
      notes: ''
    });
  };

  const oldHandleDelete = async (id) => {
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

  const getTotalSubsidy = () => {
    return distributions
      .filter(d => d.isPaid)
      .reduce((sum, d) => sum + (d.subsidyAmount || 0), 0);
  };

  const getTotalToPay = () => {
    return distributions
      .filter(d => d.isPaid)
      .reduce((sum, d) => sum + (d.amountToPay || 0), 0);
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

      {/* Success/Error Toast Notifications - Fixed Position at Top */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem 1.5rem',
          background: '#fed7d7',
          color: '#c53030',
          border: '2px solid #fc8181',
          borderRadius: '8px',
          zIndex: '2000',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem 1.5rem',
          background: '#c6f6d5',
          color: '#22543d',
          border: '2px solid #9ae6b4',
          borderRadius: '8px',
          zIndex: '2000',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease-out',
          fontWeight: '500'
        }}>
          {success}
        </div>
      )}

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '1000'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginTop: '0', marginBottom: '1rem' }}>🔒 Xác nhận mật khẩu</h3>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && executePasswordAction()}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1rem',
                border: '1px solid #cbd5e0',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPassword('');
                  setPendingAction(null);
                }}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={executePasswordAction}
              >
                Xác nhận
              </button>
            </div>
          </div>
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
        <div className="stat-card info" style={{ background: '#e6f7ff', borderColor: '#91d5ff', padding: '0.8rem' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Tổng hỗ trợ</h3>
          <div className="value" style={{ color: '#0050b3', fontSize: '1.2rem' }}>
            {getTotalSubsidy().toLocaleString('vi-VN')} VNĐ
          </div>
        </div>
        <div className="stat-card primary" style={{ background: '#f6f8fb', borderColor: '#bfdbfe', padding: '0.8rem' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Tổng phải đóng</h3>
          <div className="value" style={{ color: '#1e40af', fontSize: '1.2rem' }}>
            {getTotalToPay().toLocaleString('vi-VN')} VNĐ
          </div>
        </div>
      </div>

      {/* Utility Inputs Management Section - Always visible at top */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>📋 Thông tin nhập tính toán</h3>
        
        {utilityInputs.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            background: '#f7fafc',
            border: '2px dashed #cbd5e0',
            borderRadius: '8px',
            color: '#718096'
          }}>
            Chưa có thông tin nhập tính toán nào. Tính toán phí điện nước để tạo thông tin.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {utilityInputs.map(input => {
              const house = getHouse(input.houseId);
              const linkedDistributions = distributions.filter(d => d.inputId === input.id);
              
              return (
                <div 
                  key={input.id}
                  style={{
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  {editingInputId === input.id ? (
                    // Edit mode
                    <div>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#333' }}>✏️ Sửa thông tin</h4>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Dome</label>
                        <select
                          value={editingInputForm.houseId}
                          onChange={(e) => setEditingInputForm({...editingInputForm, houseId: e.target.value})}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                        >
                          <option value="">Chọn Dome</option>
                          {houses.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Tháng</label>
                        <input
                          type="month"
                          value={editingInputForm.month}
                          onChange={(e) => setEditingInputForm({...editingInputForm, month: e.target.value})}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>💡 Điện (VNĐ)</label>
                          <input
                            type="text"
                            value={formatNumberDisplay(editingInputForm.electricity)}
                            onChange={(e) => setEditingInputForm({...editingInputForm, electricity: removeNumberFormatting(e.target.value)})}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>💧 Nước (VNĐ)</label>
                          <input
                            type="text"
                            value={formatNumberDisplay(editingInputForm.water)}
                            onChange={(e) => setEditingInputForm({...editingInputForm, water: removeNumberFormatting(e.target.value)})}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Ghi chú</label>
                        <textarea
                          value={editingInputForm.notes}
                          onChange={(e) => setEditingInputForm({...editingInputForm, notes: e.target.value})}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e0', borderRadius: '4px', minHeight: '60px', fontFamily: 'inherit' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-primary"
                          onClick={handleSaveInput}
                          style={{ flex: 1 }}
                        >
                          💾 Lưu
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={handleCancelEdit}
                          style={{ flex: 1 }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div>
                      <h4 style={{ margin: '0 0 0.75rem 0' }}>
                        🏠 {house?.name || 'Dome'} • {input.month}
                      </h4>
                      <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#ebf8ff', borderRadius: '4px' }}>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#2c5aa0' }}>
                          💡 Điện: <strong>{parseFloat(input.electricity).toLocaleString('vi-VN')} VNĐ</strong>
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#2c5aa0' }}>
                          💧 Nước: <strong>{parseFloat(input.water).toLocaleString('vi-VN')} VNĐ</strong>
                        </p>
                      </div>
                      {input.notes && (
                        <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                          📝 {input.notes}
                        </p>
                      )}
                      <p style={{ margin: '0.75rem 0 1rem 0', fontSize: '0.85rem', color: '#48bb78', fontWeight: '500' }}>
                        {linkedDistributions.length} hóa đơn liên quan
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-small"
                          onClick={() => handleEditInput(input)}
                          style={{ flex: 1 }}
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteInput(input.id)}
                          style={{ flex: 1 }}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters and Distributions Section */}
      <div>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>📊 Danh sách hóa đơn phí điện nước</h3>
        
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' }}>
            {filteredDistributions.map(dist => {
              const room = getRoom(dist.roomId);
              const house = getHouse(dist.houseId);
              const contract = getContract(dist.contractId);
              return (
                <div 
                  key={dist.id} 
                  style={{ 
                    border: '1px solid #cbd5e0',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderTop: dist.isPaid ? '4px solid #48bb78' : '4px solid #3182ce'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{contract?.tenantName || 'N/A'}</h4>
                      <p style={{ fontSize: '0.9rem', color: '#666', margin: '0.25rem 0' }}>
                        📍 {house?.name} - {room?.name}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: '#718096', margin: '0.25rem 0' }}>
                        📞 {contract?.tenantPhone}
                      </p>
                    </div>
                    <div style={{ 
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      background: dist.isPaid ? '#48bb78' : '#3182ce',
                      color: 'white',
                      whiteSpace: 'nowrap'
                    }}>
                      {dist.isPaid ? '✓ Đã TT' : '⏳ Chờ'}
                    </div>
                  </div>
                  
                  <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.95rem' }}>
                      <strong>Tháng:</strong> {new Date(dist.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </p>
                    <p style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: '#e53e3e', fontWeight: '600' }}>
                      <strong>Phí phân bổ:</strong> {dist.amount.toLocaleString('vi-VN')} VNĐ
                    </p>
                    {dist.subsidyAmount > 0 && (
                      <p style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: '#38a169', fontWeight: '600' }}>
                        <strong>Hỗ trợ:</strong> -{dist.subsidyAmount.toLocaleString('vi-VN')} VNĐ
                      </p>
                    )}
                    <p style={{ margin: '0.5rem 0', fontSize: '0.95rem', color: '#d69e2e', fontWeight: '700' }}>
                      <strong>Phải đóng:</strong> {dist.amountToPay.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  
                  {dist.notes && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fffaf0', borderLeft: '3px solid #d69e2e', borderRadius: '4px' }}>
                      <p style={{ margin: '0', fontSize: '0.9rem', color: '#744210' }}>
                        📝 {dist.notes}
                      </p>
                    </div>
                  )}
                  
                  {dist.isPaid && dist.paidDate && (
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
                      <strong>Ngày TT:</strong> {new Date(dist.paidDate).toLocaleDateString('vi-VN')}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className={`btn ${dist.isPaid ? 'btn-warning' : 'btn-success'} btn-small`}
                      onClick={() => handleTogglePaid(dist)}
                      style={{ flex: 1 }}
                    >
                      {dist.isPaid ? '↩ Chưa TT' : '✓ Đã TT'}
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => handleDelete(dist.id)}
                      style={{ flex: 1 }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                  type="text"
                  required
                  min="0"
                  value={formatNumberDisplay(formData.electricity)}
                  onChange={(e) => setFormData({ ...formData, electricity: removeNumberFormatting(e.target.value) })}
                  placeholder="100 000"
                />
              </div>

              <div className="form-group">
                <label>Tiền Nước (VNĐ) *</label>
                <input
                  type="text"
                  required
                  min="0"
                  value={formatNumberDisplay(formData.water)}
                  onChange={(e) => setFormData({ ...formData, water: removeNumberFormatting(e.target.value) })}
                  placeholder="50 000"
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

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default UtilityBills;
