import React, { useState, useEffect } from 'react';
import { getRentCollections, createRentCollection, updateRentCollection } from '../services/api';

function RentCollectionPanel({ contractId, contractPrice, startDate, endDate }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadCollections();
  }, [contractId]);

  const loadCollections = async () => {
    try {
      const response = await getRentCollections(contractId);
      setCollections(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading collections:', error);
      setLoading(false);
    }
  };

  // Generate months from contract start to end date
  const generateMonths = () => {
    const months = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const monthStr = current.toISOString().slice(0, 7); // YYYY-MM
      months.push(monthStr);
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  const getCollectionForMonth = (month) => {
    return collections.find(c => c.month === month);
  };

  const handleToggleCollection = async (month) => {
    const existing = getCollectionForMonth(month);
    
    if (existing && existing.isCollected) {
      // Show password prompt to edit date
      setSelectedMonth(month);
      setShowPasswordDialog(true);
      setPassword('');
      setPasswordError('');
    } else {
      // Show date picker to mark as collected
      setSelectedMonth(month);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setShowDateDialog(true);
    }
  };

  const handlePasswordSubmit = async () => {
    if (password === 'quang@2305') {
      // Close password dialog and show date picker
      setShowPasswordDialog(false);
      setPassword('');
      const existing = getCollectionForMonth(selectedMonth);
      setSelectedDate(existing?.collectionDate || new Date().toISOString().split('T')[0]);
      setShowDateDialog(true);
    } else {
      setPasswordError('Mật khẩu không chính xác');
    }
  };

  const handleDateSubmit = async () => {
    await saveCollection(selectedMonth, true, selectedDate);
    setShowDateDialog(false);
    setSelectedDate('');
  };

  const saveCollection = async (month, isCollected, collectionDate) => {
    try {
      const existing = getCollectionForMonth(month);
      
      if (existing) {
        await updateRentCollection(existing.id, {
          contractId,
          month,
          isCollected,
          collectionDate: collectionDate || null,
          notes: existing.notes || ''
        });
      } else {
        await createRentCollection({
          contractId,
          month,
          isCollected,
          collectionDate: collectionDate || null
        });
      }
      
      await loadCollections();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Có lỗi xảy ra');
    }
  };

  const months = generateMonths();
  
  if (loading || months.length === 0) {
    return null;
  }

  // Get current month
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <h4 style={{ marginBottom: '1rem', color: '#1f2937' }}>💰 Thu tiền nhà hàng tháng</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {months.map(month => {
          const collection = getCollectionForMonth(month);
          const isCollected = collection?.isCollected || false;
          const isPast = month < currentMonth;
          
          return (
            <div
              key={month}
              style={{
                padding: '0.75rem',
                backgroundColor: isCollected ? '#d1fae5' : isPast ? '#fee2e2' : '#dbeafe',
                borderRadius: '6px',
                border: `2px solid ${isCollected ? '#10b981' : isPast ? '#ef4444' : '#3b82f6'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
              onClick={() => handleToggleCollection(month)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ marginBottom: '0.25rem' }}>{month}</div>
              <div style={{
                fontSize: '0.75rem',
                color: isCollected ? '#047857' : isPast ? '#991b1b' : '#1e40af',
                fontWeight: '600'
              }}>
                {isCollected ? '✓ Đã thu' : isPast ? '⚠ Chưa thu' : '○ Chờ'}
              </div>
              {isCollected && collection?.collectionDate && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#047857',
                  marginTop: '0.3rem',
                  paddingTop: '0.3rem',
                  borderTop: '1px solid rgba(4, 120, 87, 0.2)'
                }}>
                  📅 {new Date(collection.collectionDate).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{
        marginTop: '1rem',
        fontSize: '0.85rem',
        color: '#6b7280',
        fontStyle: 'italic'
      }}>
        💡 Nhấp vào tháng để chọn ngày thu tiền. Để sửa ngày đã qua, cần nhập mật khẩu.
      </p>

      {showPasswordDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Xác nhận sửa ngày thu</h3>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Để sửa ngày thu tháng <strong>{selectedMonth}</strong>, vui lòng nhập mật khẩu:
            </p>
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
            />

            {passwordError && (
              <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                ❌ {passwordError}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPasswordDialog(false)}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handlePasswordSubmit}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showDateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Chọn ngày thu tiền</h3>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              Ngày thu tiền cho tháng <strong>{selectedMonth}</strong>:
            </p>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDateDialog(false);
                  setSelectedDate('');
                }}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#e5e7eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleDateSubmit}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✓ Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentCollectionPanel;
