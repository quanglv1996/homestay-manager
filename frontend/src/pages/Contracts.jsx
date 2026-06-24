import React, { useState, useEffect } from 'react';
import { getContractsWithAssignments, createContract, updateContract, deleteContract } from '../services/api';
import RentCollectionPanel from '../components/RentCollectionPanel';

// Fixed equipment list for handover
const FIXED_EQUIPMENT = ['Chăn', 'Ga', 'Vỏ gối', 'Ruột gối', 'Chìa khóa tủ', 'Chìa khóa nhà'];

function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('tenantName'); // 'tenantName', 'startDate', 'price', 'dome'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [filterByDome, setFilterByDome] = useState(''); // empty = all domes
  const [filterByStatus, setFilterByStatus] = useState('all'); // 'all', 'expiring', 'active'
  const [passwordInput, setPasswordInput] = useState(''); // Password for editing
  const [showExtensionModal, setShowExtensionModal] = useState(false); // Extension modal
  const [extensionContract, setExtensionContract] = useState(null); // Contract to extend
  const [extensionMonths, setExtensionMonths] = useState(1); // Months to extend
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantPhone: '',
    tenantEmail: 'no_email@gmail.com',
    tenantIdCard: '',
    startDate: '',
    durationMonths: 1,
    price: '',
    deposit: '',
    equipment: [],
    images: [],
    hasParking: false,
    parkingInfo: null,
    notes: '',
    status: 'active',
    utilitySubsidy: 200000
  });
  const [newEquipment, setNewEquipment] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageInputRef, setImageInputRef] = useState(null);

  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setFormData({
          ...formData,
          images: [...formData.images, base64]
        });
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const response = await getContractsWithAssignments();
      setContracts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading contracts:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      // Validation
      if (!formData.tenantName.trim()) {
        throw new Error('Vui lòng nhập tên người thuê');
      }
      if (!formData.tenantPhone.trim()) {
        throw new Error('Vui lòng nhập số điện thoại');
      }
      if (!formData.startDate) {
        throw new Error('Vui lòng chọn ngày bắt đầu');
      }
      if (!formData.durationMonths || formData.durationMonths <= 0) {
        throw new Error('Vui lòng nhập số tháng hợp lệ (> 0)');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Vui lòng nhập giá thuê hợp lệ');
      }
      if (editingContract && !passwordInput) {
        // For editing, only require password if it was previously set
        // For now, allow editing without password (backend can still validate if needed)
        console.warn('No password provided for contract edit');
      }
      if (formData.hasParking && (!formData.parkingInfo?.vehicleInfo?.trim() || !formData.parkingInfo?.cardNumber?.trim() || !formData.parkingInfo?.parkingFee)) {
        throw new Error('Vui lòng điền đầy đủ thông tin gửi xe');
      }
      
      // Calculate end date based on start date and duration months
      const startDate = new Date(formData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.durationMonths));
      
      const contractData = {
        ...formData,
        durationMonths: parseInt(formData.durationMonths),
        price: parseFloat(formData.price),
        deposit: parseFloat(formData.deposit) || parseFloat(formData.price),
        endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        parkingInfo: formData.hasParking && formData.parkingInfo ? {
          ...formData.parkingInfo,
          parkingFee: parseFloat(formData.parkingInfo.parkingFee)
        } : null
      };
      
      if (editingContract) {
        // Add password to request for verification
        await updateContract(editingContract.id, { ...contractData, password: passwordInput });
      } else {
        await createContract(contractData);
      }
      setShowModal(false);
      setEditingContract(null);
      resetForm();
      setError('');
      await loadContracts();
    } catch (error) {
      console.error('Error saving contract:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Có lỗi xảy ra khi lưu dữ liệu';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setFormData({
      tenantName: contract.tenantName,
      tenantPhone: contract.tenantPhone,
      tenantEmail: contract.tenantEmail || '',
      tenantIdCard: contract.tenantIdCard || '',
      images: contract.images || [],
      hasParking: contract.hasParking || false,
      parkingInfo: contract.parkingInfo || null,
      startDate: contract.startDate.split('T')[0],
      durationMonths: contract.durationMonths || 1,
      price: contract.price,
      deposit: contract.deposit || contract.price,
      equipment: contract.equipment || [],
      notes: contract.notes || '',
      status: contract.status,
      utilitySubsidy: contract.utilitySubsidy || 200000
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

  const handleExtend = (contract) => {
    setExtensionContract(contract);
    setExtensionMonths(1);
    setShowExtensionModal(true);
  };

  const handleCancelExtension = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy gia hạn? Sẽ trở lại ngày hết hạn ban đầu?')) {
      return;
    }

    try {
      setSubmitting(true);
      // Revert to original end date (using start date + original duration months)
      const originalEndDate = new Date(extensionContract.startDate);
      originalEndDate.setMonth(originalEndDate.getMonth() + extensionContract.durationMonths);
      
      const contractUpdateData = {
        tenantName: extensionContract.tenantName,
        tenantPhone: extensionContract.tenantPhone,
        startDate: extensionContract.startDate,
        endDate: originalEndDate.toISOString().split('T')[0],
        durationMonths: extensionContract.durationMonths || 1,
        price: extensionContract.price || 0,
        password: 'quang@2305'
      };
      
      await updateContract(extensionContract.id, contractUpdateData);
      
      setShowExtensionModal(false);
      setExtensionContract(null);
      setExtensionMonths(1);
      await loadContracts();
      alert('Hủy gia hạn hợp đồng thành công!');
    } catch (error) {
      console.error('Error canceling extension:', error);
      alert('Có lỗi xảy ra khi hủy gia hạn: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExtensionHistory = async (contractId, indexToDelete) => {
    if (!window.confirm('Xóa lần gia hạn này sẽ khôi phục về lần gia hạn trước đó. Bạn có chắc không?')) {
      return;
    }

    try {
      // Find the contract
      const contract = contracts.find(c => c.id === contractId);
      if (!contract) return;

      const extensionHistory = contract.extensionHistory || [];
      
      // Get the extension record to delete
      const deletedRecord = extensionHistory[indexToDelete];
      
      // Remove from history
      const newHistory = extensionHistory.filter((_, idx) => idx !== indexToDelete);
      
      // Determine new end date
      let newEndDate;
      if (newHistory.length === 0) {
        // No more extensions - restore to original end date
        const originalEnd = new Date(contract.startDate);
        originalEnd.setMonth(originalEnd.getMonth() + contract.durationMonths);
        newEndDate = originalEnd.toISOString().split('T')[0];
      } else {
        // Restore to the previous extension's end date
        newEndDate = newHistory[newHistory.length - 1].newEndDate;
      }

      // Update contract
      const contractUpdateData = {
        tenantName: contract.tenantName,
        tenantPhone: contract.tenantPhone,
        startDate: contract.startDate,
        endDate: newEndDate,
        durationMonths: contract.durationMonths || 1,
        price: contract.price || 0,
        extensionHistory: newHistory,
        password: 'quang@2305'
      };

      await updateContract(contractId, contractUpdateData);
      await loadContracts();
      alert('Xóa lần gia hạn thành công! Đã khôi phục về trạng thái trước đó.');
    } catch (error) {
      console.error('Error deleting extension history:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extensionMonths || extensionMonths <= 0) {
      alert('Vui lòng nhập số tháng hợp lệ');
      return;
    }

    try {
      setSubmitting(true);
      // Calculate new end date
      const endDate = new Date(extensionContract.endDate);
      endDate.setMonth(endDate.getMonth() + parseInt(extensionMonths));
      
      // Create extension record for history
      const today = new Date().toISOString().split('T')[0];
      const newExtensionRecord = {
        extendedDate: today,
        previousEndDate: extensionContract.endDate,
        newEndDate: endDate.toISOString().split('T')[0],
        extensionMonths: parseInt(extensionMonths),
        notes: ''
      };
      
      // Add to extension history
      const extensionHistory = extensionContract.extensionHistory || [];
      extensionHistory.push(newExtensionRecord);
      
      // Prepare contract data with updated extension history
      const contractUpdateData = {
        tenantName: extensionContract.tenantName,
        tenantPhone: extensionContract.tenantPhone,
        startDate: extensionContract.startDate,
        endDate: endDate.toISOString().split('T')[0],
        durationMonths: extensionContract.durationMonths || 1,
        price: extensionContract.price || 0,
        extensionHistory: extensionHistory,
        password: 'quang@2305'
      };
      
      // Update contract with new end date and extension history
      await updateContract(extensionContract.id, contractUpdateData);
      
      setShowExtensionModal(false);
      setExtensionContract(null);
      setExtensionMonths(1);
      await loadContracts();
      alert('Gia hạn hợp đồng thành công!');
    } catch (error) {
      console.error('Error extending contract:', error);
      alert('Có lỗi xảy ra khi gia hạn: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNew = () => {
    setEditingContract(null);
    setError('');
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      tenantName: '',
      tenantPhone: '',
      tenantEmail: 'no_email@gmail.com',
      tenantIdCard: '',
      startDate: '',
      durationMonths: 1,
      price: '',
      deposit: '',
      equipment: [],
      images: [],
      hasParking: false,
      parkingInfo: null,
      notes: '',
      status: 'active'
    });
    setPasswordInput('');
    setNewEquipment('');
    setNewImageUrl('');
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

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()]
      });
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleParkingToggle = (checked) => {
    setFormData({
      ...formData,
      hasParking: checked,
      parkingInfo: checked ? { vehicleInfo: '', cardNumber: '', parkingFee: '' } : null
    });
  };

  const handleParkingInfoChange = (field, value) => {
    setFormData({
      ...formData,
      parkingInfo: {
        ...formData.parkingInfo,
        [field]: value
      }
    });
  };

  const getTotalMonthlyFee = () => {
    let total = parseFloat(formData.price) || 0;
    if (formData.hasParking && formData.parkingInfo) {
      total += parseFloat(formData.parkingInfo.parkingFee) || 0;
    }
    return total;
  };

  // Check if contract is expiring (within 30 days from now)
  const isContractExpiring = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const daysLeft = Math.floor((end - today) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  };

  // Get days until expiry
  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>;
  }

  // Get unique domes from contracts
  const getUniqueDomes = () => {
    const domes = new Set();
    contracts.forEach(contract => {
      if (contract.assignments && contract.assignments.length > 0) {
        contract.assignments.forEach(assignment => {
          domes.add(assignment.houseName);
        });
      }
    });
    return Array.from(domes).sort();
  };

  // Filter and sort contracts
  const getProcessedContracts = () => {
    let filtered = contracts;

    // Apply dome filter
    if (filterByDome) {
      filtered = filtered.filter(contract => {
        return contract.assignments && 
               contract.assignments.some(a => a.houseName === filterByDome);
      });
    }

    // Apply status filter
    if (filterByStatus === 'expiring') {
      filtered = filtered.filter(contract => isContractExpiring(contract.endDate));
    } else if (filterByStatus === 'active') {
      filtered = filtered.filter(contract => !isContractExpiring(contract.endDate));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;
      
      if (sortBy === 'tenantName') {
        compareValue = a.tenantName.localeCompare(b.tenantName);
      } else if (sortBy === 'startDate') {
        compareValue = new Date(a.startDate) - new Date(b.startDate);
      } else if (sortBy === 'price') {
        compareValue = a.price - b.price;
      } else if (sortBy === 'dome') {
        const aDome = a.assignments?.[0]?.houseName || '';
        const bDome = b.assignments?.[0]?.houseName || '';
        compareValue = aDome.localeCompare(bDome);
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: '#333' }}>Quản lý Hợp đồng</h2>
        <button className="btn btn-primary" onClick={handleAddNew}>
          + Thêm hợp đồng mới
        </button>
      </div>

      {/* Sort and Filter Controls */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f7fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
            Sắp xếp theo:
          </label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="tenantName">Tên khách hàng</option>
            <option value="startDate">Ngày ký hợp đồng</option>
            <option value="price">Giá thuê</option>
            <option value="dome">Dome</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
            Thứ tự:
          </label>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
            Lọc theo Dome:
          </label>
          <select 
            value={filterByDome}
            onChange={(e) => setFilterByDome(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Tất cả Dome</option>
            {getUniqueDomes().map(dome => (
              <option key={dome} value={dome}>{dome}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
            Trạng thái:
          </label>
          <select 
            value={filterByStatus}
            onChange={(e) => setFilterByStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">Tất cả hợp đồng</option>
            <option value="active">Còn hoạt động</option>
            <option value="expiring">Sắp hết hạn (≤30 ngày)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            onClick={() => {
              setSortBy('tenantName');
              setSortOrder('asc');
              setFilterByDome('');
              setFilterByStatus('all');
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: '#cbd5e0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              color: '#2d3748'
            }}
          >
            🔄 Đặt lại
          </button>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có hợp đồng nào</h3>
          <p>Hãy thêm hợp đồng đầu tiên</p>
        </div>
      ) : (
        <div className="contract-list">
          {getProcessedContracts().map(contract => (
            <div key={contract.id} className="contract-item">
              {/* Header with Name and Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{contract.tenantName}</h3>
                <div 
                  style={{ 
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: contract.status === 'active' ? '#48bb78' : '#718096',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    padding: '0.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                  title={contract.status === 'active' ? 'Đang hiệu lực' : 'Hết hiệu lực'}
                >
                  {contract.status === 'active' ? '✓ HOẠT\nĐỘNG' : 'HẾT\nHIỆU LỰC'}
                </div>
              </div>

              {/* Thông Tin Section */}
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f7fafc',
                borderLeft: '4px solid #4299e1',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <strong style={{ color: '#2d3748', fontSize: '1rem' }}>ℹ️ Thông tin</strong>
                <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.95rem' }}>
                  <div>
                    <strong>Điện thoại:</strong>
                    <div style={{ color: '#4a5568' }}>{contract.tenantPhone}</div>
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <div style={{ color: '#4a5568' }}>{contract.tenantEmail || 'N/A'}</div>
                  </div>
                  <div>
                    <strong>CMND/CCCD:</strong>
                    <div style={{ color: '#4a5568' }}>{contract.tenantIdCard || 'N/A'}</div>
                  </div>
                  <div>
                    <strong>Giá thuê:</strong>
                    <div style={{ color: '#4a5568' }}>{contract.price.toLocaleString('vi-VN')} VNĐ/tháng</div>
                  </div>
                  <div>
                    <strong>Từ ngày:</strong>
                    <div style={{ color: '#4a5568' }}>{new Date(contract.startDate).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div>
                    <strong>Đến ngày:</strong>
                    <div style={{ color: '#4a5568' }}>{new Date(contract.endDate).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>

                {/* Equipment in Thông tin section */}
                {contract.equipment && contract.equipment.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #cbd5e0' }}>
                    <strong style={{ color: '#2d3748' }}>Thiết bị bàn giao:</strong>
                    <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem', fontSize: '0.95rem' }}>
                      {contract.equipment.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes in Thông tin section */}
                {contract.notes && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #cbd5e0' }}>
                    <strong style={{ color: '#2d3748' }}>Ghi chú:</strong>
                    <div style={{ color: '#4a5568', marginTop: '0.5rem', fontSize: '0.95rem' }}>{contract.notes}</div>
                  </div>
                )}

                {/* Parking Info in Thông tin section */}
                {contract.hasParking && contract.parkingInfo && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #cbd5e0' }}>
                    <div style={{ color: '#3182ce', fontWeight: '500', marginBottom: '0.5rem' }}>
                      🅿️ Có đăng ký gửi xe
                    </div>
                    <div style={{ marginLeft: '1.5rem', fontSize: '0.95rem' }}>
                      <div><strong>Thông tin xe:</strong> {contract.parkingInfo.vehicleInfo}</div>
                      <div><strong>Mã thẻ:</strong> {contract.parkingInfo.cardNumber}</div>
                      <div><strong>Phí gửi xe:</strong> {contract.parkingInfo.parkingFee.toLocaleString('vi-VN')} VNĐ/tháng</div>
                    </div>
                    <div style={{ color: '#48bb78', fontWeight: '600', marginTop: '0.5rem' }}>
                      <strong>Tổng phí hàng tháng:</strong> {(contract.price + contract.parkingInfo.parkingFee).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                )}
              </div>

              {/* Dates and Parking */}
              <div className="contract-info" style={{ marginBottom: '1rem', display: 'none' }}>
                <div>
                  <strong>Từ ngày:</strong> {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                </div>
                <div>
                  <strong>Đến ngày:</strong> {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                </div>
                {contract.hasParking && contract.parkingInfo && (
                  <>
                    <div style={{ color: '#3182ce', fontWeight: '500', marginTop: '0.5rem' }}>
                      🅿️ Có đăng ký gửi xe
                    </div>
                    <div style={{ marginLeft: '1.5rem' }}>
                      <div><strong>Thông tin xe:</strong> {contract.parkingInfo.vehicleInfo}</div>
                      <div><strong>Mã thẻ:</strong> {contract.parkingInfo.cardNumber}</div>
                      <div><strong>Phí gửi xe:</strong> {contract.parkingInfo.parkingFee.toLocaleString('vi-VN')} VNĐ/tháng</div>
                    </div>
                    <div style={{ color: '#48bb78', fontWeight: '600', marginTop: '0.5rem' }}>
                      <strong>Tổng phí hàng tháng:</strong> {(contract.price + contract.parkingInfo.parkingFee).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </>
                )}
              </div>

              {/* Extension History */}
              {contract.extensionHistory && contract.extensionHistory.length > 0 && (
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#fef5e7',
                  borderLeft: '4px solid #f39c12',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <strong style={{ color: '#7d6608', fontSize: '0.95rem' }}>📅 Lịch sử gia hạn:</strong>
                  <div style={{ marginTop: '0.75rem' }}>
                    {contract.extensionHistory.map((record, idx) => (
                      <div 
                        key={idx}
                        style={{
                          padding: '0.75rem',
                          marginBottom: idx < contract.extensionHistory.length - 1 ? '0.5rem' : '0',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          fontSize: '0.9rem',
                          border: '1px solid #f0d5a8',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div><strong>Ngày gia hạn:</strong> {new Date(record.extendedDate).toLocaleDateString('vi-VN')}</div>
                          <div><strong>Từ:</strong> {new Date(record.previousEndDate).toLocaleDateString('vi-VN')} → <strong>Đến:</strong> {new Date(record.newEndDate).toLocaleDateString('vi-VN')} (+{record.extensionMonths} tháng)</div>
                          {record.notes && <div><strong>Ghi chú:</strong> {record.notes}</div>}
                        </div>
                        <button
                          onClick={() => handleDeleteExtensionHistory(contract.id, idx)}
                          style={{
                            marginLeft: '1rem',
                            padding: '0.4rem 0.8rem',
                            backgroundColor: '#f56565',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            flexShrink: 0
                          }}
                          title="Xóa lần gia hạn này"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isContractExpiring(contract.endDate) && (
                <div style={{
                  marginTop: '1rem',
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  background: '#fed7d7',
                  border: '2px solid #fc8181',
                  borderRadius: '6px',
                  color: '#c53030'
                }}>
                  ⏰ <strong>Sắp hết hạn:</strong> Còn {getDaysUntilExpiry(contract.endDate)} ngày
                </div>
              )}
              
              {contract.images && contract.images.length > 0 && (
                <div style={{ 
                  marginTop: '1rem', 
                  marginBottom: '1rem',
                  padding: '1rem', 
                  backgroundColor: '#f0f7ff',
                  borderLeft: '4px solid #3182ce',
                  borderRadius: '4px'
                }}>
                  <strong style={{ color: '#3182ce' }}>📍 Vị trí gán:</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    {contract.assignments.map((assignment, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '0.75rem',
                          marginBottom: index < contract.assignments.length - 1 ? '0.5rem' : '0',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <div><strong>Dome:</strong> {assignment.houseName}</div>
                        <div><strong>Phòng:</strong> {assignment.roomName}</div>
                        <div><strong>Giường:</strong> {assignment.bedName} - {assignment.level === 'top' ? '🛏️ Tầng trên' : '🛏️ Tầng dưới'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contract.assignments && contract.assignments.length > 0 && (
                <RentCollectionPanel 
                  contractId={contract.id}
                  contractPrice={contract.price}
                  startDate={contract.startDate}
                  endDate={contract.endDate}
                />
              )}

              <div className="contract-actions">
                <button 
                  className="btn btn-secondary btn-small"
                  onClick={() => handleEdit(contract)}
                >
                  Sửa
                </button>
                <button 
                  className="btn btn-primary btn-small"
                  onClick={() => handleExtend(contract)}
                  style={{ backgroundColor: '#4299e1' }}
                >
                  📅 Gia hạn
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => handleDelete(contract.id)}
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
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          setError('');
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingContract ? 'Sửa hợp đồng' : 'Thêm hợp đồng mới'}</h2>
            
            {error && (
              <div style={{
                background: '#fed7d7',
                color: '#c53030',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                border: '1px solid #fc8181',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
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
                <label>Số tháng muốn kí *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                  placeholder="1, 2, 3, 6, 12..."
                />
              </div>

              <div className="form-group">
                <label>Giá thuê (VNĐ/tháng) *</label>
                <input
                  type="text"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1000000"
                />
              </div>

              <div className="form-group">
                <label>Tiền cọc (VNĐ)</label>
                <input
                  type="text"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  placeholder={formData.price || '0'}
                />
                <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>
                  Mặc định: {(parseFloat(formData.price) || 0).toLocaleString('vi-VN')} VNĐ (bằng giá thuê)
                </small>
              </div>

              <div className="form-group" style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasParking}
                    onChange={(e) => handleParkingToggle(e.target.checked)}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: '#3182ce' }}>
                    🅿️ Có đăng ký gửi xe
                  </span>
                </label>
                
                {formData.hasParking && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '6px' }}>
                    <div className="form-group">
                      <label>Thông tin xe (loại xe, biển số) *</label>
                      <input
                        type="text"
                        required={formData.hasParking}
                        value={formData.parkingInfo?.vehicleInfo || ''}
                        onChange={(e) => handleParkingInfoChange('vehicleInfo', e.target.value)}
                        placeholder="Honda SH 29A-12345"
                      />
                    </div>
                    <div className="form-group">
                      <label>Mã thẻ xe *</label>
                      <input
                        type="text"
                        required={formData.hasParking}
                        value={formData.parkingInfo?.cardNumber || ''}
                        onChange={(e) => handleParkingInfoChange('cardNumber', e.target.value)}
                        placeholder="P001"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phí gửi xe (VNĐ/tháng) *</label>
                      <input
                        type="number"
                        required={formData.hasParking}
                        value={formData.parkingInfo?.parkingFee || ''}
                        onChange={(e) => handleParkingInfoChange('parkingFee', e.target.value)}
                        placeholder="100000"
                      />
                    </div>
                  </div>
                )}
              </div>

              {formData.hasParking && formData.parkingInfo?.parkingFee && (
                <div style={{ 
                  background: '#f0fff4', 
                  padding: '1rem', 
                  borderRadius: '6px',
                  border: '2px solid #48bb78',
                  marginBottom: '1rem'
                }}>
                  <strong style={{ color: '#22543d' }}>Tổng phí hàng tháng:</strong>
                  <span style={{ fontSize: '1.2rem', fontWeight: '700', color: '#22543d', marginLeft: '0.5rem' }}>
                    {getTotalMonthlyFee().toLocaleString('vi-VN')} VNĐ
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#2f855a', marginTop: '0.25rem' }}>
                    = Giá thuê {parseFloat(formData.price || 0).toLocaleString('vi-VN')} + Phí gửi xe {parseFloat(formData.parkingInfo.parkingFee).toLocaleString('vi-VN')}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>🖼️ Ảnh hợp đồng</label>
                <div className="equipment-list">
                  {formData.images.map((img, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', width: '100%' }}>
                      {img.startsWith('data:') ? (
                        <img src={img} alt={`Preview ${index}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                      ) : (
                        <img src={img} alt={`Preview ${index}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                      )}
                      <input type="text" value={img.startsWith('data:') ? `[Ảnh từ thiết bị]` : img} readOnly style={{ flex: 1, fontSize: '0.85rem' }} />
                      <button type="button" onClick={() => handleRemoveImage(index)} style={{ padding: '0.4rem 0.75rem', background: '#f56565', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0 }}>
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Image Upload Options */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                  {/* File Input */}
                  <div>
                    <input
                      ref={(input) => setImageInputRef(input)}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef?.click()}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.95rem'
                      }}
                    >
                      📱 Chọn từ thiết bị
                    </button>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Hoặc dán URL ảnh"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '0.95rem'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImage();
                        }
                      }}
                    />
                  </div>
                </div>
                
                {newImageUrl && (
                  <button
                    type="button"
                    onClick={handleAddImage}
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.6rem',
                      background: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}
                  >
                    ✅ Thêm URL ảnh
                  </button>
                )}
              </div>

              <div className="form-group">
                <label style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>📋 Thiết bị bàn giao</label>
                
                {/* Fixed Equipment Checklist */}
                <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #cbd5e0' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem', color: '#2d3748' }}>Danh sách cố định:</div>
                  {FIXED_EQUIPMENT.map((item) => (
                    <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.equipment.includes(item)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (!formData.equipment.includes(item)) {
                              setFormData({
                                ...formData,
                                equipment: [...formData.equipment, item]
                              });
                            }
                          } else {
                            setFormData({
                              ...formData,
                              equipment: formData.equipment.filter(eq => eq !== item)
                            });
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                {/* Custom Equipment Items */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: '#2d3748' }}>Thiết bị khác:</div>
                  <div className="equipment-list">
                    {formData.equipment
                      .filter(item => !FIXED_EQUIPMENT.includes(item))
                      .map((item, index) => (
                        <div key={`custom-${index}`} className="equipment-item">
                          <input type="text" value={item} readOnly />
                          <button type="button" onClick={() => handleRemoveEquipment(formData.equipment.indexOf(item))}>
                            Xóa
                          </button>
                        </div>
                      ))}
                    <div className="equipment-item">
                      <input
                        type="text"
                        value={newEquipment}
                        onChange={(e) => setNewEquipment(e.target.value)}
                        placeholder="Nhập tên thiết bị khác..."
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
              </div>

              <div className="form-group">
                <label>Mức hỗ trợ điện nước/tháng (VNĐ)</label>
                <input
                  type="number"
                  value={formData.utilitySubsidy}
                  onChange={(e) => setFormData({ ...formData, utilitySubsidy: parseFloat(e.target.value) || 0 })}
                  placeholder="Ví dụ: 200000"
                  min="0"
                />
                <small style={{ color: '#666' }}>Mỗi ngày sẽ hỗ trợ = Mức hỗ trợ / số ngày trong tháng × số ngày ở</small>
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

              {editingContract && (
                <div className="form-group" style={{ background: '#fff5f5', padding: '1rem', borderRadius: '6px', border: '2px solid #fc8181' }}>
                  <label style={{ color: '#c53030', fontWeight: '600' }}>Mật khẩu xác nhận</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu (nếu có)"
                    style={{ marginTop: '0.5rem' }}
                  />
                  <small style={{ color: '#742a2a', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                    💡 Nếu bạn có mật khẩu, hãy nhập để xác minh sửa đổi
                  </small>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false);
                  setError('');
                }}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (editingContract ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {showExtensionModal && extensionContract && (
        <div className="modal-overlay" onClick={() => setShowExtensionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Gia hạn hợp đồng</h2>
            
            <div style={{ padding: '1rem', backgroundColor: '#f0f7ff', borderRadius: '8px', marginBottom: '1.5rem', border: '2px solid #3182ce' }}>
              <div><strong>Tên khách hàng:</strong> {extensionContract.tenantName}</div>
              <div><strong>Ngày hết hạn hiện tại:</strong> {new Date(extensionContract.endDate).toLocaleDateString('vi-VN')}</div>
              <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                <em>Ngày bắt đầu: {new Date(extensionContract.startDate).toLocaleDateString('vi-VN')}</em>
              </div>
            </div>
            
            <form onSubmit={handleExtendSubmit}>
              <div className="form-group">
                <label>Số tháng gia hạn thêm *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(e.target.value)}
                  placeholder="1, 3, 6, 12..."
                />
                <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                  Ngày hết hạn mới sẽ là: <strong>{new Date(new Date(extensionContract.endDate).setMonth(new Date(extensionContract.endDate).getMonth() + parseInt(extensionMonths || 0))).toLocaleDateString('vi-VN')}</strong>
                </small>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExtensionModal(false)}>
                  Đóng
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang cập nhật...' : '✏️ Sửa gia hạn'}
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
