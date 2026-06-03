import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DealCard from './components/DealCard';
import { fetchDeals, login, register, getList, addToList, removeFromList, fetchStores, fetchAIInsights } from './api';
import './App.css';

function App() {
  const [deals, setDeals] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [collection, setCollection] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('deals'); // deals, waitlist, collection
  const [theme, setTheme] = useState('dark');
  
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Filter state
  const [priceRange, setPriceRange] = useState(50);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortBy, setSortBy] = useState('Deal Rating');
  const [hideCollected, setHideCollected] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Stores metadata state
  const [storesMap, setStoresMap] = useState({});

  // Price Comparison Modal State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareGameTitle, setCompareGameTitle] = useState('');
  const [compareDeals, setCompareDeals] = useState([]);
  const [compareLoading, setCompareLoading] = useState(false);

  // AI Insights Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGameTitle, setAiGameTitle] = useState('');
  const [aiContent, setAiContent] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCache, setAiCache] = useState({});

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }

    // Load CheapShark Stores details
    const loadStores = async () => {
      const stores = await fetchStores();
      const map = {};
      stores.forEach(s => {
        if (s.isActive) {
          map[s.storeID] = {
            name: s.storeName,
            icon: s.images.icon
          };
        }
      });
      setStoresMap(map);
    };
    loadStores();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleResetFilters = () => {
    setPriceRange(50);
    setSelectedStore('');
    setSelectedGenre('');
    setSortBy('Deal Rating');
    setSearchTerm('');
    setSearchQuery('');
  };

  const handleShowCompare = async (gameID, gameTitle) => {
    setCompareGameTitle(gameTitle);
    setShowCompareModal(true);
    setCompareLoading(true);
    setCompareDeals([]);
    try {
      const response = await fetch(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
      if (response.ok) {
        const data = await response.json();
        setCompareDeals(data.deals || []);
      }
    } catch (error) {
      console.error("Failed to load other deals", error);
    } finally {
      setCompareLoading(false);
    }
  };

  const handleShowAI = (gameTitle) => {
    setAiGameTitle(gameTitle);
    setShowAIModal(true);
  };

  const fetchAIContent = async (title) => {
    if (aiCache[title]) {
      setAiContent(aiCache[title]);
      return;
    }
    setAiLoading(true);
    setAiContent(null);

    try {
      const data = await fetchAIInsights(title);
      setAiCache(prev => ({ ...prev, [title]: data }));
      setAiContent(data);
    } catch (e) {
      setAiContent({ error: e.message || "AI Insights not available. Make sure GEMINI_KEY is configured in your server .env file." });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (showAIModal && aiGameTitle) {
      fetchAIContent(aiGameTitle);
    }
  }, [showAIModal, aiGameTitle]);

  useEffect(() => {
    if (activeTab === 'deals') {
      loadDeals();
    }
  }, [priceRange, searchQuery, selectedStore, selectedGenre, sortBy, activeTab]);

  useEffect(() => {
    if (user) {
      loadUserLists();
    } else {
      setWaitlist([]);
      setCollection([]);
    }
  }, [user]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const storeIDParam = selectedStore || undefined;
      let titleParam = searchQuery;
      if (selectedGenre) {
        titleParam = titleParam ? `${titleParam} ${selectedGenre}` : selectedGenre;
      }
      
      const data = await fetchDeals({ 
        upperPrice: priceRange,
        title: titleParam,
        storeID: storeIDParam,
        sortBy: sortBy
      });
      setDeals(data || []);
    } catch (error) {
      console.error("Failed to load deals", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLists = async () => {
    try {
      const wl = await getList('waitlist');
      setWaitlist(wl);
      const col = await getList('collection');
      setCollection(col);
    } catch (error) {
      console.error("Failed to load user lists", error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      let data;
      if (authMode === 'login') {
        data = await login(authUsername, authPassword);
      } else {
        data = await register(authUsername, authPassword);
        // auto login after register
        data = await login(authUsername, authPassword);
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setShowAuthModal(false);
      setAuthUsername('');
      setAuthPassword('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfileDrawer(false);
    if (activeTab !== 'deals') setActiveTab('deals');
  };

  const handleToggleWaitlist = async (deal) => {
    if (!user) return setShowAuthModal(true);
    const inList = waitlist.find(item => item.dealID === deal.dealID);
    try {
      if (inList) {
        await removeFromList('waitlist', deal.dealID);
        setWaitlist(waitlist.filter(item => item.dealID !== deal.dealID));
      } else {
        await addToList('waitlist', deal);
        setWaitlist([...waitlist, deal]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleCollection = async (deal) => {
    if (!user) return setShowAuthModal(true);
    const inList = collection.find(item => item.dealID === deal.dealID);
    try {
      if (inList) {
        await removeFromList('collection', deal.dealID);
        setCollection(collection.filter(item => item.dealID !== deal.dealID));
      } else {
        await addToList('collection', deal);
        setCollection([...collection, deal]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const renderDealsGrid = (items) => {
    if (loading) {
      return (
        <div className="deals-grid">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="deal-card skeleton" style={{ height: '320px', animationDelay: `${idx * 0.05}s` }}>
              <div style={{ height: '160px', background: 'var(--border-color)', opacity: 0.5 }}></div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <div style={{ height: '24px', background: 'var(--border-color)', borderRadius: '4px', opacity: 0.5 }}></div>
                <div style={{ height: '24px', width: '70%', background: 'var(--border-color)', borderRadius: '4px', opacity: 0.5 }}></div>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ height: '20px', width: '40%', background: 'var(--border-color)', borderRadius: '4px', opacity: 0.5 }}></div>
                  <div style={{ height: '20px', width: '30%', background: 'var(--border-color)', borderRadius: '4px', opacity: 0.5 }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (items.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>No deals found.</div>;
    }
    return (
      <div className="deals-grid">
        {items.map((deal, index) => (
          <DealCard 
            key={deal.dealID} 
            deal={deal} 
            index={index}
            inWaitlist={!!waitlist.find(item => item.dealID === deal.dealID)}
            inCollection={!!collection.find(item => item.dealID === deal.dealID)}
            onToggleWaitlist={handleToggleWaitlist}
            onToggleCollection={handleToggleCollection}
            onShowStores={handleShowCompare}
            onShowAI={handleShowAI}
            storesMap={storesMap}
          />
        ))}
      </div>
    );
  };

  // Filter deals based on frontend toggles (like hideCollected)
  const getVisibleDeals = () => {
    let visible = deals;
    if (hideCollected) {
      visible = visible.filter(deal => !collection.find(c => c.dealID === deal.dealID));
    }
    return visible;
  };

  return (
    <div className="app-container">
      {/* Basic Navbar replacement to support tabs and auth easily */}
      <nav className="navbar">
        <div className="nav-brand">
          <span>IsThere<span className="accent">Any</span>Deal</span>
        </div>
        
        {activeTab === 'deals' && (
          <div className="search-section">
            <button 
              onClick={() => setShowFilters(true)} 
              className="filter-toggle-btn" 
              title="Filters"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
            <form className="search-container" style={{ flex: 1, margin: 0 }} onSubmit={(e) => { 
              e.preventDefault(); 
              setSearchQuery(searchTerm);
            }}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search for games... (Press Enter)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
        )}

        <div className="nav-links">
          <button 
            onClick={toggleTheme} 
            className="btn-icon" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--bg-main)', borderRadius: '50%', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <button 
            onClick={() => setShowProfileDrawer(true)} 
            className="btn-icon" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user ? user.username : 'Menu'}</span>
          </button>
        </div>
      </nav>
      
      <main className="container main-content">
        <div 
          className={`drawer-overlay ${(showFilters || showProfileDrawer) ? 'open' : ''}`} 
          onClick={() => { setShowFilters(false); setShowProfileDrawer(false); }}
        ></div>
        
        {/* Left Filter Drawer */}
        <div className={`filter-drawer ${showFilters ? 'open' : ''}`}>
          <div className="drawer-header">
            <h2 className="filter-title">Filters</h2>
            <button className="close-drawer-btn" onClick={() => setShowFilters(false)}>✕</button>
          </div>
          
          <div className="filter-group">
            <h3 className="filter-group-title">Max Price: ${priceRange}</h3>
            <input type="range" min="0" max="100" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div className="filter-group">
            <h3 className="filter-group-title">Store</h3>
            <div className="store-select-wrapper">
              <select 
                value={selectedStore} 
                onChange={(e) => setSelectedStore(e.target.value)} 
                className="store-select"
              >
                <option value="">All Stores</option>
                <option value="1">Steam</option>
                <option value="2">GamersGate</option>
                <option value="3">GreenManGaming</option>
                <option value="7">GOG</option>
                <option value="11">Humble Store</option>
                <option value="13">Uplay</option>
                <option value="15">Fanatical</option>
                <option value="21">WinGameStore</option>
                <option value="23">GameBillet</option>
                <option value="25">Epic Games Store</option>
                <option value="27">Gamesplanet</option>
                <option value="28">Gamesload</option>
                <option value="29">2Game</option>
                <option value="30">IndieGala</option>
                <option value="35">DreamGame</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <h3 className="filter-group-title">Category / Genre</h3>
            <div className="store-select-wrapper">
              <select 
                value={selectedGenre} 
                onChange={(e) => setSelectedGenre(e.target.value)} 
                className="store-select"
              >
                <option value="">All Categories</option>
                <option value="Action">Action</option>
                <option value="RPG">RPG</option>
                <option value="Strategy">Strategy</option>
                <option value="Horror">Horror</option>
                <option value="Shooter">Shooter</option>
                <option value="Indie">Indie</option>
                <option value="Racing">Racing</option>
                <option value="Sim">Sim</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <h3 className="filter-group-title">Sort By</h3>
            <div className="store-select-wrapper">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="store-select"
              >
                <option value="Deal Rating">Deal Rating</option>
                <option value="Price">Price</option>
                <option value="Savings">Savings %</option>
                <option value="Metacritic">Metacritic</option>
                <option value="Title">Title</option>
                <option value="Release">Release Date</option>
              </select>
            </div>
          </div>

          <button onClick={handleResetFilters} className="reset-filters-btn">
            Reset All Filters
          </button>
        </div>

        {/* Right Profile Drawer */}
        <div className={`profile-drawer ${showProfileDrawer ? 'open' : ''}`}>
          <div className="drawer-header">
            <h2 className="filter-title">Menu</h2>
            <button className="close-drawer-btn" onClick={() => setShowProfileDrawer(false)}>✕</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button onClick={() => { setActiveTab('deals'); setShowProfileDrawer(false); }} className={`nav-link ${activeTab === 'deals' ? 'active' : ''}`} style={{ textAlign: 'left', padding: '12px', background: activeTab === 'deals' ? 'var(--bg-card-hover)' : 'none', borderRadius: '8px', width: '100%' }}>
              🔥 Top Deals
            </button>
            <button onClick={() => { if(user) { setActiveTab('waitlist'); setShowProfileDrawer(false); } else { setShowAuthModal(true); setShowProfileDrawer(false); } }} className={`nav-link ${activeTab === 'waitlist' ? 'active' : ''}`} style={{ textAlign: 'left', padding: '12px', background: activeTab === 'waitlist' ? 'var(--bg-card-hover)' : 'none', borderRadius: '8px', width: '100%' }}>
              🕒 My Waitlist
            </button>
            <button onClick={() => { if(user) { setActiveTab('collection'); setShowProfileDrawer(false); } else { setShowAuthModal(true); setShowProfileDrawer(false); } }} className={`nav-link ${activeTab === 'collection' ? 'active' : ''}`} style={{ textAlign: 'left', padding: '12px', background: activeTab === 'collection' ? 'var(--bg-card-hover)' : 'none', borderRadius: '8px', width: '100%' }}>
              🎮 My Collection
            </button>
            
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
              {user ? (
                <div>
                  <div className="logged-in-status">Logged in as <strong>{user.username}</strong></div>
                  <button onClick={handleLogout} className="btn-primary" style={{ width: '100%' }}>Logout</button>
                </div>
              ) : (
                <button onClick={() => { setShowAuthModal(true); setShowProfileDrawer(false); }} className="btn-primary" style={{ width: '100%' }}>Login / Register</button>
              )}
            </div>
          </div>
        </div>
        
        <section className="deals-section" style={{ width: activeTab !== 'deals' ? '100%' : 'auto' }}>
          <div className="deals-header">
            <h1 className="deals-title">
              {activeTab === 'deals' && (searchTerm ? `Results for "${searchTerm}"` : 'Top Deals')}
              {activeTab === 'waitlist' && 'My Waitlist'}
              {activeTab === 'collection' && 'My Collection'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {activeTab === 'deals' && user && (
                <button 
                  onClick={() => setHideCollected(!hideCollected)}
                  className={`subtle-toggle ${hideCollected ? 'active' : ''}`}
                >
                  {hideCollected ? 'Showing Uncollected' : 'Hide Collected'}
                </button>
              )}
              <span className="deals-count">
                {activeTab === 'deals' && `${getVisibleDeals().length} deals found`}
                {activeTab === 'waitlist' && `${waitlist.length} games`}
                {activeTab === 'collection' && `${collection.length} games`}
              </span>
            </div>
          </div>

          {activeTab === 'deals' && renderDealsGrid(getVisibleDeals())}
          {activeTab === 'waitlist' && renderDealsGrid(waitlist)}
          {activeTab === 'collection' && renderDealsGrid(collection)}
        </section>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
            {authError && <div style={{ color: '#ef4444', marginBottom: '16px' }}>{authError}</div>}
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <input 
                type="text" 
                placeholder="Username" 
                value={authUsername} 
                onChange={e => setAuthUsername(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: 'none' }}
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: 'none' }}
                required 
              />
              <button type="submit" className="btn-primary">{authMode === 'login' ? 'Login' : 'Create Account'}</button>
            </form>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} style={{ color: 'var(--bg-accent)' }}>
                {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
              </button>
            </div>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-main)' }}>✕</button>
          </div>
        </div>
      )}
      {/* Compare Prices Modal */}
      {showCompareModal && (
        <div className="modal-overlay" onClick={() => setShowCompareModal(false)}>
          <div className="modal-card compare-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Compare Prices: {compareGameTitle}</h3>
              <button className="close-modal-btn" onClick={() => setShowCompareModal(false)}>✕</button>
            </div>
            <div className="modal-body scrollable-modal-body">
              {compareLoading ? (
                <div className="loading-spinner-container">
                  <div className="spinner"></div>
                </div>
              ) : compareDeals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {compareDeals.map(d => {
                    const store = storesMap[d.storeID];
                    const storeName = store ? store.name : `Store #${d.storeID}`;
                    const storeIcon = store ? `https://www.cheapshark.com${store.icon}` : null;
                    return (
                      <div key={d.dealID} className="compare-store-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {storeIcon && <img src={storeIcon} alt={storeName} className="compare-store-icon" />}
                          <span style={{ fontWeight: '600' }}>{storeName}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: '800', color: 'var(--deal-green)', fontSize: '1.1rem' }}>${d.price}</span>
                          <button onClick={() => window.open(`https://www.cheapshark.com/redirect?dealID=${d.dealID}`, '_blank', 'noopener,noreferrer')} className="visit-store-btn">
                            Visit Store
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No other offers found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI View Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-card ai-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="font-display font-bold text-2xl mb-1">{aiGameTitle}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI Game Review & Insights</p>
              </div>
              <button className="close-modal-btn" onClick={() => setShowAIModal(false)}>✕</button>
            </div>
            
            <div className="modal-body scrollable-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {aiLoading ? (
                <div className="loading-spinner-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="spinner"></div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generating AI Insights...</p>
                </div>
              ) : aiContent?.error ? (
                <div className="ai-error-box" style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: '700' }}>Error:</span> {aiContent.error}
                </div>
              ) : aiContent ? (
                <div className="ai-content-layout" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <section>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>Summary</h4>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)' }}>{aiContent.summary}</p>
                  </section>
                  
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  
                  <section>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>Pros & Cons</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="pros-cons-grid-responsive">
                      <div className="ai-pros-box">
                        <h5 className="ai-pros-title">✓ Pros</h5>
                        <ul style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {aiContent.pros?.map((pro, idx) => (
                            <li key={idx} style={{ listStyleType: 'disc' }}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="ai-cons-box">
                        <h5 className="ai-cons-title">✗ Cons</h5>
                        <ul style={{ fontSize: '0.85rem', color: 'var(--text-main)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {aiContent.cons?.map((con, idx) => (
                            <li key={idx} style={{ listStyleType: 'disc' }}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                  
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                  
                  <section>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>Similar Titles</h4>
                    <ul style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }} className="similar-grid-responsive">
                      {aiContent.similar?.map((sim, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                          <span>🎮</span> {sim}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
