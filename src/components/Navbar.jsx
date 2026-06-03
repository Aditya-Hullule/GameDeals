import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span>IsThere<span className="accent">Any</span>Deal</span>
      </div>
      
      <form className="search-container" onSubmit={handleSearch}>
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search for games..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      <div className="nav-links">
        <a href="#" className="nav-link active">Deals</a>
        <a href="#" className="nav-link">Waitlist</a>
        <a href="#" className="nav-link">Collection</a>
      </div>
    </nav>
  );
};

export default Navbar;
