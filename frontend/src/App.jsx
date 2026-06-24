import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Houses from './pages/Houses';
import HouseDetail from './pages/HouseDetail';
import Contracts from './pages/Contracts';
import UtilityBills from './pages/UtilityBills';
import Expenses from './pages/Expenses';
import RentCollections from './pages/RentCollections';
import Login from './pages/Login';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="nav">
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        Dashboard
      </Link>
      <Link 
        to="/houses" 
        className={`nav-link ${location.pathname === '/houses' ? 'active' : ''}`}
      >
        Dome
      </Link>
      <Link 
        to="/contracts" 
        className={`nav-link ${location.pathname === '/contracts' ? 'active' : ''}`}
      >
        Hợp đồng
      </Link>
      <Link 
        to="/utility-bills" 
        className={`nav-link ${location.pathname === '/utility-bills' ? 'active' : ''}`}
      >
        Phí điện nước
      </Link>
      <Link 
        to="/expenses" 
        className={`nav-link ${location.pathname === '/expenses' ? 'active' : ''}`}
      >
        Khoản chi
      </Link>
      <Link 
        to="/rent-collections" 
        className={`nav-link ${location.pathname === '/rent-collections' ? 'active' : ''}`}
      >
        📋 Thu tiền nhà
      </Link>
    </nav>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('authToken') === 'authenticated';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>🏠 Dome Homestay Manager</h1>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Đăng xuất"
          >
            🚪 Đăng xuất
          </button>
        </header>
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/houses" element={<Houses />} />
            <Route path="/houses/:id" element={<HouseDetail />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/utility-bills" element={<UtilityBills />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/rent-collections" element={<RentCollections />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
