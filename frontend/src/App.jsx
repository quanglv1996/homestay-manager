import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Houses from './pages/Houses';
import HouseDetail from './pages/HouseDetail';
import Contracts from './pages/Contracts';
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
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>🏠 Dome Homestay Manager</h1>
        </header>
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/houses" element={<Houses />} />
            <Route path="/houses/:id" element={<HouseDetail />} />
            <Route path="/contracts" element={<Contracts />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
