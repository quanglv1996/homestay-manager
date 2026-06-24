import React, { useState, useEffect } from 'react';
import { getRentCollections, getContractsWithAssignments } from '../services/api';

function RentCollections() {
  const [collections, setCollections] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterByDome, setFilterByDome] = useState('');
  const [sortBy, setSortBy] = useState('month'); // 'month', 'dome', 'tenantName'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collectionsRes, contractsRes] = await Promise.all([
        getRentCollections(),
        getContractsWithAssignments()
      ]);
      
      setCollections(collectionsRes.data.filter(c => c.isCollected));
      setContracts(contractsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const getContractName = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract ? contract.tenantName : 'N/A';
  };

  const getContractPrice = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    return contract ? contract.price : 0;
  };

  const getDomeForContract = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    if (contract && contract.assignments && contract.assignments.length > 0) {
      return contract.assignments[0].houseName;
    }
    return 'N/A';
  };

  // Get collection month from collectionDate (tháng ghi nhận tiền)
  const getCollectionMonth = (collectionDate) => {
    if (!collectionDate) return '';
    const date = new Date(collectionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  // Get unique domes (filter out N/A)
  const getUniqueDomes = () => {
    const domes = new Set();
    contracts.forEach(contract => {
      if (contract.assignments && contract.assignments.length > 0) {
        contract.assignments.forEach(assignment => {
          if (assignment.houseName && assignment.houseName !== 'N/A') {
            domes.add(assignment.houseName);
          }
        });
      }
    });
    return Array.from(domes).sort();
  };

  // Filter and sort collections
  const getProcessedCollections = () => {
    let filtered = collections;

    // Filter out N/A entries
    filtered = filtered.filter(collection => {
      const dome = getDomeForContract(collection.contractId);
      return dome && dome !== 'N/A';
    });

    // Apply collection month filter (based on collectionDate)
    if (filterMonth) {
      filtered = filtered.filter(c => {
        const collectionMonth = getCollectionMonth(c.collectionDate);
        return collectionMonth === filterMonth;
      });
    }

    // Apply dome filter
    if (filterByDome) {
      filtered = filtered.filter(collection => {
        return getDomeForContract(collection.contractId) === filterByDome;
      });
    }

    // Apply sorting by collection date descending (newest first)
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'month') {
        // Sort by collection date (from collectionDate field)
        const aCollectionDate = new Date(a.collectionDate || '');
        const bCollectionDate = new Date(b.collectionDate || '');
        compareValue = bCollectionDate - aCollectionDate; // Descending by default
      } else if (sortBy === 'dome') {
        const aDome = getDomeForContract(a.contractId);
        const bDome = getDomeForContract(b.contractId);
        compareValue = aDome.localeCompare(bDome);
      } else if (sortBy === 'tenantName') {
        const aName = getContractName(a.contractId);
        const bName = getContractName(b.contractId);
        compareValue = aName.localeCompare(bName);
      }

      if (sortBy !== 'month') {
        return sortOrder === 'asc' ? compareValue : -compareValue;
      }
      return sortOrder === 'asc' ? -compareValue : compareValue;
    });

    return sorted;
  };

  const filteredCollections = getProcessedCollections();

  // Get unique collection months for filter (from collectionDate)
  const uniqueCollectionMonths = [...new Set(collections
    .map(c => getCollectionMonth(c.collectionDate))
    .filter(m => m)
  )].sort().reverse();

  const totalCollected = filteredCollections.reduce((sum, collection) => {
    return sum + getContractPrice(collection.contractId);
  }, 0);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📋 Danh sách tiền nhà đã thu</h2>
        <button
          onClick={() => setFilterMonth('')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Filter and Sort Section */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#2d3748' }}>
            Lọc theo tháng ghi nhận:
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}
          >
            <option value="">Tất cả các tháng</option>
            {uniqueCollectionMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
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
            <option value="month">Ngày tháng</option>
            <option value="dome">Dome</option>
            <option value="tenantName">Tên khách hàng</option>
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

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            onClick={() => {
              setFilterMonth('');
              setFilterByDome('');
              setSortBy('month');
              setSortOrder('desc');
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

      {/* Summary Section */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#d1fae5',
        border: '1px solid #10b981',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Tổng số lần thu</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#047857' }}>
            {filteredCollections.length}
          </div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Tổng tiền thu</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#047857' }}>
            {totalCollected.toLocaleString('vi-VN')} ₫
          </div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>Trung bình mỗi lần</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#047857' }}>
            {filteredCollections.length > 0 ? Math.round(totalCollected / filteredCollections.length).toLocaleString('vi-VN') : '0'} ₫
          </div>
        </div>
      </div>

      {/* Collections Table */}
      {filteredCollections.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          color: '#6b7280'
        }}>
          Không có dữ liệu tiền nhà đã thu
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tên khách</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Dome</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tháng tiền</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tháng ghi nhận</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Tiền nhà</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Ngày thu</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.map((collection, index) => (
                <tr
                  key={collection.id}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f9fafb';
                  }}
                >
                  <td style={{ padding: '1rem', color: '#1f2937' }}>
                    <strong>{getContractName(collection.contractId)}</strong>
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {getDomeForContract(collection.contractId)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {collection.month}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#6b7280' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#d1fae5',
                      color: '#065f46',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}>
                      {getCollectionMonth(collection.collectionDate)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#1f2937', fontWeight: '600' }}>
                    {getContractPrice(collection.contractId).toLocaleString('vi-VN')} ₫
                  </td>
                  <td style={{ padding: '1rem', color: '#047857', fontWeight: '500' }}>
                    📅 {new Date(collection.collectionDate).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RentCollections;
