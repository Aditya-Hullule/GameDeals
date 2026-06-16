import React from 'react';
import './DealCard.css';

const DealCard = ({ 
  deal, 
  inWaitlist, 
  inCollection, 
  onToggleWaitlist, 
  onToggleCollection, 
  onShowStores, 
  onShowAI, 
  storesMap = {}, 
  index = 0,
  currency = 'USD',
  exchangeRate = 1
}) => {
  const { title, salePrice, normalPrice, savings, thumb, storeID, dealID, gameID, metacriticScore } = deal;
  
  const formatPrice = (priceStr) => {
    const priceVal = parseFloat(priceStr);
    if (isNaN(priceVal)) return 'N/A';
    if (currency === 'INR') {
      return `₹${(priceVal * exchangeRate).toFixed(2)}`;
    }
    return `$${priceVal.toFixed(2)}`;
  };
  
  // Format savings to integer
  const discount = Math.round(parseFloat(savings));
  
  // Lookup store details
  const store = storesMap[storeID];
  const storeName = store ? store.name : `Store #${storeID}`; 
  const storeIcon = store ? `https://www.cheapshark.com${store.icon}` : null;

  // Metacritic rating
  const score = parseInt(metacriticScore);
  const scoreColor = score >= 75 ? 'mc-high' : (score >= 50 ? 'mc-medium' : 'mc-low');

  const handleWaitlistClick = (e) => {
    e.stopPropagation();
    if (onToggleWaitlist) onToggleWaitlist(deal);
  };

  const handleCollectionClick = (e) => {
    e.stopPropagation();
    if (onToggleCollection) onToggleCollection(deal);
  };

  const handleBuyNowClick = (e) => {
    e.stopPropagation();
    window.open(`https://www.cheapshark.com/redirect?dealID=${dealID}`, '_blank', 'noopener,noreferrer');
  };

  const handleStoresClick = (e) => {
    e.stopPropagation();
    if (onShowStores) onShowStores(gameID, title);
  };

  const handleAIClick = (e) => {
    e.stopPropagation();
    if (onShowAI) onShowAI(title);
  };

  return (
    <div className="deal-card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="deal-image-container">
        {discount > 0 && (
          <div className="deal-discount-badge">
            {discount}% Off
          </div>
        )}
        <img 
          src={thumb} 
          alt={title} 
          className="deal-image" 
          loading="lazy" 
          onError={(e) => { e.target.src = 'https://placehold.co/400x200/111/fff?text=No+Image'; }}
        />
      </div>
      
      <div className="deal-content">
        <h3 className="deal-title" title={title}>{title}</h3>
        
        <div className="list-buttons-container">
          <button onClick={handleWaitlistClick} className="deal-card-btn list-btn" style={{ 
              backgroundColor: inWaitlist ? 'var(--deal-green)' : 'var(--bg-main)',
              color: inWaitlist ? 'white' : 'var(--text-main)',
              borderColor: inWaitlist ? 'var(--deal-green)' : 'var(--border-color)'
            }}>
            {inWaitlist ? '✓ Waitlisted' : '+ Waitlist'}
          </button>
          <button onClick={handleCollectionClick} className="deal-card-btn list-btn" style={{ 
              backgroundColor: inCollection ? 'var(--bg-accent)' : 'var(--bg-main)',
              color: inCollection ? 'white' : 'var(--text-main)',
              borderColor: inCollection ? 'var(--bg-accent)' : 'var(--border-color)'
            }}>
            {inCollection ? '✓ Collected' : '+ Collection'}
          </button>
        </div>

        <div className="deal-store-info">
          {storeIcon && <img src={storeIcon} alt={storeName} className="deal-store-icon" />}
          <span className="deal-store-name">{storeName}</span>
          <span className={`deal-mc-score ${scoreColor}`}>MC: {score || 'N/A'}</span>
        </div>

        <div className="price-section">
          <div>
            <span className="price-label">Deal Price</span>
            <span className="sale-price">{formatPrice(salePrice)}</span>
          </div>
          <span className="normal-price">{formatPrice(normalPrice)}</span>
        </div>

        <div className="deal-card-actions">
          <button onClick={handleBuyNowClick} className="btn-primary buy-now-btn">
            Buy Now
          </button>
          <div className="secondary-actions">
            <button onClick={handleStoresClick} className="deal-card-btn stores-btn">
              Stores
            </button>
            <button onClick={handleAIClick} className="deal-card-btn ai-btn">
              AI VIEW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealCard;
