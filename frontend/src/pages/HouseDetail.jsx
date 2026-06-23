import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getHouseById, 
  getRooms, 
  getBeds, 
  getAssignments, 
  getContracts,
  createRoom, 
  updateRoom, 
  deleteRoom,
  createBed,
  updateBed,
  deleteBed,
  createAssignment,
  deleteAssignmentByBedLevel
} from '../services/api';

function HouseDetail() {
  const { id } = useParams();
  const [house, setHouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBedModal, setShowBedModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBed, setEditingBed] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });

  const [roomFormData, setRoomFormData] = useState({
    name: '',
    description: ''
  });

  const [bedFormData, setBedFormData] = useState({
    name: '',
    description: ''
  });

  const [assignFormData, setAssignFormData] = useState({
    contractId: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [houseRes, roomsRes, bedsRes, assignmentsRes, contractsRes] = await Promise.all([
        getHouseById(id),
        getRooms(id),
        getBeds(),
        getAssignments(),
        getContracts()
      ]);

      setHouse(houseRes.data);
      setRooms(roomsRes.data);
      setBeds(bedsRes.data);
      setAssignments(assignmentsRes.data);
      setContracts(contractsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setRoomFormData({ name: '', description: '' });
    setShowRoomModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomFormData({ name: room.name, description: room.description || '' });
    setShowRoomModal(true);
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, roomFormData);
      } else {
        await createRoom({ ...roomFormData, houseId: id });
      }
      setShowRoomModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Bạn có chắc muốn xóa phòng này? Tất cả giường sẽ bị xóa.')) {
      try {
        await deleteRoom(roomId);
        loadData();
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        alert('Có lỗi xảy ra');
      }
    }
  };

  const handleAddBed = (room) => {
    setSelectedRoom(room);
    setEditingBed(null);
    setBedFormData({ name: '', description: '' });
    setShowBedModal(true);
  };

  const handleEditBed = (bed) => {
    setEditingBed(bed);
    setBedFormData({ 
      name: bed.name,
      description: bed.description || '' 
    });
    setShowBedModal(true);
  };

  const handleSubmitBed = async (e) => {
    e.preventDefault();
    try {
      if (editingBed) {
        await updateBed(editingBed.id, {
          ...bedFormData,
          roomId: editingBed.roomId
        });
      } else {
        await createBed({ 
          ...bedFormData, 
          roomId: selectedRoom.id
        });
      }
      setShowBedModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving bed:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const handleDeleteBed = async (bedId) => {
    if (window.confirm('Bạn có chắc muốn xóa giường này?')) {
      try {
        await deleteBed(bedId);
        loadData();
      } catch (error) {
        console.error('Error deleting bed:', error);
        alert('Có lỗi xảy ra');
      }
    }
  };

  const handleAssignContract = (bed, level) => {
    setSelectedBed(bed);
    setSelectedLevel(level);
    setAssignFormData({ contractId: '' });
    setShowAssignModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    try {
      await createAssignment({
        bedId: selectedBed.id,
        contractId: assignFormData.contractId,
        level: selectedLevel
      });
      setShowAssignModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert(error.response?.data?.detail || 'Có lỗi xảy ra');
    }
  };

  const handleRemoveAssignment = async (bedId, level) => {
    if (window.confirm('Bạn có chắc muốn gỡ hợp đồng khỏi vị trí này?')) {
      try {
        await deleteAssignmentByBedLevel(bedId, level);
        loadData();
      } catch (error) {
        console.error('Error removing assignment:', error);
        alert('Có lỗi xảy ra');
      }
    }
  };

  const getBedAssignmentByLevel = (bedId, level) => {
    return assignments.find(a => a.bedId === bedId && a.level === level);
  };

  const getContract = (contractId) => {
    return contracts.find(c => c.id === contractId);
  };

  const getUnassignedContracts = () => {
    // Get all assigned contract IDs
    const assignedContractIds = new Set(assignments.map(a => a.contractId));
    
    // Filter to get only unassigned contracts with active status
    return contracts.filter(c => c.status === 'active' && !assignedContractIds.has(c.id));
  };

  const handleMouseEnter = (e, assignment) => {
    if (assignment) {
      const contract = getContract(assignment.contractId);
      if (contract) {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          content: contract
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  if (!house) {
    return <div>Không tìm thấy Dome</div>;
  }

  const getRoomBeds = (roomId) => {
    return beds.filter(b => b.roomId === roomId);
  };

  const getLevelLabel = (level) => {
    return level === 'top' ? 'Tầng trên' : 'Tầng dưới';
  };

  return (
    <div>
      <Link to="/" className="back-btn">
        ← Quay lại Dashboard
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>{house.name}</h2>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>{house.description}</p>
      </div>

      <div className="rooms-view">
        <div className="rooms-header">
          <h3 style={{ fontSize: '1.5rem', color: '#333' }}>Phòng</h3>
          <button className="btn btn-primary" onClick={handleAddRoom}>
            + Thêm phòng
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="empty-state">
            <h3>Chưa có phòng nào</h3>
            <p>Hãy thêm phòng đầu tiên</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => {
              const roomBeds = getRoomBeds(room.id);
              const totalPositions = roomBeds.length * 2;
              const occupiedPositions = roomBeds.reduce((count, bed) => {
                const topAssignment = getBedAssignmentByLevel(bed.id, 'top');
                const bottomAssignment = getBedAssignmentByLevel(bed.id, 'bottom');
                return count + (topAssignment ? 1 : 0) + (bottomAssignment ? 1 : 0);
              }, 0);
              
              return (
                <div key={room.id}>
                  <div 
                    className="room-card"
                    onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
                  >
                    <h4>{room.name}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      {room.description || 'Không có mô tả'}
                    </p>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.75rem' }}>
                      Giường: {roomBeds.length} | Vị trí: {totalPositions} | Đã thuê: {occupiedPositions}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={(e) => { e.stopPropagation(); handleAddBed(room); }}
                      >
                        + Giường
                      </button>
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={(e) => { e.stopPropagation(); handleEditRoom(room); }}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-small"
                        onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  {selectedRoom?.id === room.id && roomBeds.length > 0 && (
                    <div className="beds-view">
                      <h4 style={{ marginBottom: '1rem' }}>Giường trong phòng {room.name}</h4>
                      <div className="beds-grid">
                        {roomBeds.map(bed => {
                          const topAssignment = getBedAssignmentByLevel(bed.id, 'top');
                          const bottomAssignment = getBedAssignmentByLevel(bed.id, 'bottom');
                          
                          return (
                            <div key={bed.id} className="bed-card-container" style={{ gridColumn: 'span 1' }}>
                              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0' }}>
                                <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>
                                  {bed.name}
                                </div>
                                {bed.description && (
                                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem', textAlign: 'center', fontStyle: 'italic' }}>
                                    {bed.description}
                                  </div>
                                )}
                                
                                {/* Top Level */}
                                <div 
                                  className={`bed-level ${topAssignment ? 'occupied' : 'available'}`}
                                  style={{ 
                                    padding: '0.75rem', 
                                    marginBottom: '0.5rem', 
                                    borderRadius: '6px',
                                    border: topAssignment ? '2px solid #ed8936' : '2px solid #48bb78',
                                    background: topAssignment ? '#fffaf0' : '#f0fdf4',
                                    cursor: topAssignment ? 'pointer' : 'default'
                                  }}
                                  onMouseEnter={(e) => handleMouseEnter(e, topAssignment)}
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    🛏️ Tầng trên
                                  </div>
                                  {topAssignment && (
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                      {getContract(topAssignment.contractId)?.tenantName}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {topAssignment ? (
                                      <button 
                                        className="btn btn-danger btn-small"
                                        style={{ flex: 1, padding: '0.4rem' }}
                                        onClick={() => handleRemoveAssignment(bed.id, 'top')}
                                      >
                                        Gỡ HĐ
                                      </button>
                                    ) : (
                                      <button 
                                        className="btn btn-success btn-small"
                                        style={{ flex: 1, padding: '0.4rem' }}
                                        onClick={() => handleAssignContract(bed, 'top')}
                                      >
                                        Gán HĐ
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Bottom Level */}
                                <div 
                                  className={`bed-level ${bottomAssignment ? 'occupied' : 'available'}`}
                                  style={{ 
                                    padding: '0.75rem', 
                                    marginBottom: '0.75rem', 
                                    borderRadius: '6px',
                                    border: bottomAssignment ? '2px solid #ed8936' : '2px solid #48bb78',
                                    background: bottomAssignment ? '#fffaf0' : '#f0fdf4',
                                    cursor: bottomAssignment ? 'pointer' : 'default'
                                  }}
                                  onMouseEnter={(e) => handleMouseEnter(e, bottomAssignment)}
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <div style={{ fontWeight: '500', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    🛏️ Tầng dưới
                                  </div>
                                  {bottomAssignment && (
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                      {getContract(bottomAssignment.contractId)?.tenantName}
                                    </div>
                                  )}
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {bottomAssignment ? (
                                      <button 
                                        className="btn btn-danger btn-small"
                                        style={{ flex: 1, padding: '0.4rem' }}
                                        onClick={() => handleRemoveAssignment(bed.id, 'bottom')}
                                      >
                                        Gỡ HĐ
                                      </button>
                                    ) : (
                                      <button 
                                        className="btn btn-success btn-small"
                                        style={{ flex: 1, padding: '0.4rem' }}
                                        onClick={() => handleAssignContract(bed, 'bottom')}
                                      >
                                        Gán HĐ
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Bed Actions */}
                                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                  <button 
                                    className="btn btn-secondary btn-small"
                                    onClick={() => handleEditBed(bed)}
                                  >
                                    Sửa
                                  </button>
                                  <button 
                                    className="btn btn-danger btn-small"
                                    onClick={() => handleDeleteBed(bed.id)}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div 
          className="tooltip" 
          style={{ 
            left: `${tooltip.x}px`, 
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <p><strong>{tooltip.content.tenantName}</strong></p>
          <p>SĐT: {tooltip.content.tenantPhone}</p>
          <p>Giá: {tooltip.content.price.toLocaleString('vi-VN')} VNĐ/tháng</p>
          <p>Từ: {new Date(tooltip.content.startDate).toLocaleDateString('vi-VN')}</p>
          <p>Đến: {new Date(tooltip.content.endDate).toLocaleDateString('vi-VN')}</p>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRoom ? 'Sửa phòng' : 'Thêm phòng mới'}</h2>
            <form onSubmit={handleSubmitRoom}>
              <div className="form-group">
                <label>Tên phòng *</label>
                <input
                  type="text"
                  required
                  value={roomFormData.name}
                  onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                  placeholder="Ví dụ: Phòng 101"
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={roomFormData.description}
                  onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                  placeholder="Mô tả về phòng..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoom ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bed Modal */}
      {showBedModal && (
        <div className="modal-overlay" onClick={() => setShowBedModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBed ? 'Sửa giường' : 'Thêm giường mới'}</h2>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
              ℹ️ Mỗi giường có 2 tầng (tầng trên và tầng dưới), mỗi tầng cho 1 người thuê
            </p>
            <form onSubmit={handleSubmitBed}>
              <div className="form-group">
                <label>Tên giường *</label>
                <input
                  type="text"
                  required
                  value={bedFormData.name}
                  onChange={(e) => setBedFormData({ ...bedFormData, name: e.target.value })}
                  placeholder="Ví dụ: Giường A1"
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={bedFormData.description}
                  onChange={(e) => setBedFormData({ ...bedFormData, description: e.target.value })}
                  placeholder="Mô tả về giường..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBedModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBed ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Gán hợp đồng cho {selectedBed?.name} - {getLevelLabel(selectedLevel)}</h2>
            <form onSubmit={handleSubmitAssignment}>
              <div className="form-group">
                <label>Chọn hợp đồng *</label>
                <select
                  required
                  value={assignFormData.contractId}
                  onChange={(e) => setAssignFormData({ contractId: e.target.value })}
                >
                  <option value="">-- Chọn hợp đồng --</option>
                  {getUnassignedContracts().map(contract => (
                    <option key={contract.id} value={contract.id}>
                      {contract.tenantName} - {contract.tenantPhone} ({contract.price.toLocaleString('vi-VN')} VNĐ)
                    </option>
                  ))}
                </select>
                {getUnassignedContracts().length === 0 && (
                  <p style={{ color: '#ed8936', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    Không có hợp đồng nào. Vui lòng tạo hoặc gỡ bỏ các gán hiện có.
                  </p>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Gán hợp đồng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HouseDetail;
