import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DealCard from './components/DealCard';
import { fetchDeals, getList, addToList, removeFromList, fetchStores, fetchAIInsights, deleteAccount } from './api';
import { useUser, useAuth, useClerk, SignIn, SignUp } from '@clerk/clerk-react';
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
  
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { openSignIn, signOut } = useClerk();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const token = await getToken();
      const wl = await getList('waitlist', token);
      setWaitlist(wl);
      const col = await getList('collection', token);
      setCollection(col);
    } catch (error) {
      console.error("Failed to load user lists", error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowProfileDrawer(false);
    if (activeTab !== 'deals') setActiveTab('deals');
  };

  const handleToggleWaitlist = async (deal) => {
    if (!isSignedIn) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    const inList = waitlist.find(item => item.dealID === deal.dealID);
    try {
      const token = await getToken();
      if (inList) {
        await removeFromList('waitlist', deal.dealID, token);
        setWaitlist(waitlist.filter(item => item.dealID !== deal.dealID));
      } else {
        await addToList('waitlist', deal, token);
        setWaitlist([...waitlist, deal]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleCollection = async (deal) => {
    if (!isSignedIn) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    const inList = collection.find(item => item.dealID === deal.dealID);
    try {
      const token = await getToken();
      if (inList) {
        await removeFromList('collection', deal.dealID, token);
        setCollection(collection.filter(item => item.dealID !== deal.dealID));
      } else {
        await addToList('collection', deal, token);
        setCollection([...collection, deal]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }
    try {
      await user.update({ username: newUsername.trim() });
      setUsernameSuccess('Username updated successfully!');
      setIsEditingUsername(false);
    } catch (err) {
      console.error('Error updating username:', err);
      setUsernameError(err.errors?.[0]?.message || 'Failed to update username. Username may be taken.');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmModal(true);
    setShowProfileDrawer(false);
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const token = await getToken();
      await deleteAccount(token);
      setIsDeleting(false);
      setShowDeleteConfirmModal(false);
      await signOut();
      if (activeTab !== 'deals') setActiveTab('deals');
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
      setShowDeleteConfirmModal(false);
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
            <button onClick={() => { if(isSignedIn) { setActiveTab('waitlist'); setShowProfileDrawer(false); } else { setAuthMode('login'); setShowAuthModal(true); setShowProfileDrawer(false); } }} className={`nav-link ${activeTab === 'waitlist' ? 'active' : ''}`} style={{ textAlign: 'left', padding: '12px', background: activeTab === 'waitlist' ? 'var(--bg-card-hover)' : 'none', borderRadius: '8px', width: '100%' }}>
              🕒 My Waitlist
            </button>
            <button onClick={() => { if(isSignedIn) { setActiveTab('collection'); setShowProfileDrawer(false); } else { setAuthMode('login'); setShowAuthModal(true); setShowProfileDrawer(false); } }} className={`nav-link ${activeTab === 'collection' ? 'active' : ''}`} style={{ textAlign: 'left', padding: '12px', background: activeTab === 'collection' ? 'var(--bg-card-hover)' : 'none', borderRadius: '8px', width: '100%' }}>
              🎮 My Collection
            </button>
            
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '32px' }}>
              {isSignedIn ? (
                <div>
                  <div className="logged-in-status" style={{ marginBottom: '16px' }}>
                    {isEditingUsername ? (
                      <form onSubmit={handleUpdateUsername} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="New username" 
                          value={newUsername} 
                          onChange={e => setNewUsername(e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                          required
                        />
                        {usernameError && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{usernameError}</div>}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Save</button>
                          <button type="button" onClick={() => { setIsEditingUsername(false); setUsernameError(''); }} className="reset-filters-btn" style={{ padding: '6px 12px', margin: 0, fontSize: '0.9rem' }}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                        <span style={{ fontSize: '0.95rem', wordBreak: 'break-all' }}>
                          Logged in as <strong>{user?.username || user?.primaryEmailAddress?.emailAddress || 'User'}</strong>
                        </span>
                        <button 
                          onClick={() => { setIsEditingUsername(true); setNewUsername(user?.username || ''); }} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', display: 'flex', alignItems: 'center' }}
                          title="Edit Username"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    {usernameSuccess && <div style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '8px' }}>{usernameSuccess}</div>}
                  </div>
                  <button onClick={handleLogout} className="btn-primary" style={{ width: '100%', marginBottom: '12px' }}>Logout</button>
                  <button onClick={handleDeleteAccount} className="btn-primary" style={{ width: '100%', backgroundColor: '#ef4444', color: 'white' }}>Delete Account</button>
                </div>
              ) : (
                <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); setShowProfileDrawer(false); }} className="btn-primary" style={{ width: '100%' }}>Login / Register</button>
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

      {/* Custom Auth Modal with Clerk embedded components */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: 'none', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent' }}>
              {authMode === 'login' ? (
                <>
                  <SignIn 
                    routing="virtual"
                    fallbackRedirectUrl="/"
                    appearance={{
                      layout: {
                        showOptionalFields: false
                      },
                      elements: {
                        footerAction: { display: 'none' },
                        footer: { display: 'none' }
                      }
                    }}
                  />
                  <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('register')} 
                      style={{ color: 'var(--deal-green)', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Sign up
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <SignUp 
                    routing="virtual"
                    fallbackRedirectUrl="/"
                    appearance={{
                      layout: {
                        showOptionalFields: false
                      },
                      elements: {
                        footerAction: { display: 'none' },
                        footer: { display: 'none' },
                        formFieldRow__firstName: { display: 'none' },
                        formFieldRow__lastName: { display: 'none' },
                        formFieldRow__emailAddress: { display: 'none' },
                        formField__firstName: { display: 'none' },
                        formField__lastName: { display: 'none' },
                        formField__emailAddress: { display: 'none' }
                      }
                    }}
                  />
                  <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('login')} 
                      style={{ color: 'var(--deal-green)', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Sign in
                    </button>
                  </div>
                </>
              )}
            </div>
            <button className="close-modal-btn" onClick={() => setShowAuthModal(false)} style={{ top: '16px', right: '16px', zIndex: 10 }}>✕</button>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={() => !isDeleting && setShowDeleteConfirmModal(false)}>
          <div className="glass-panel" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', width: '450px', maxWidth: '95%', textAlign: 'center', backgroundColor: 'var(--bg-card)', border: '1.5px solid var(--border-color)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginBottom: '12px', color: 'var(--text-main)', marginTop: '8px' }}>Delete Account?</h3>
            <p style={{ fontSize: '0.95rem', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '28px' }}>
              Are you sure you want to permanently delete your account? This will delete your profile and all your waitlisted and collected games from our database. 
              <span style={{ display: 'block', marginTop: '10px', color: 'var(--deal-red)', fontWeight: '700' }}>This action cannot be undone.</span>
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                disabled={isDeleting}
                onClick={confirmDeleteAccount} 
                className="btn-primary" 
                style={{ backgroundColor: 'var(--deal-red)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', flex: 1 }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
              <button 
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirmModal(false)} 
                style={{ backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border-color)', padding: '12px 24px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600', flex: 1, transition: 'all var(--transition-fast)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
