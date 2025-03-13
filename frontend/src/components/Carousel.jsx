import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import './styles/Carousel.css';

const Carousel = ({ userRole }) => {
  const isAdmin = userRole === 'admin';

  // eslint-disable-next-line no-unused-vars
  const [items, setItems] = useState([
    { id: 1, url: 'https://picsum.photos/500/400?random=1' },
    { id: 2, url: 'https://picsum.photos/500/400?random=2' },
    { id: 3, url: 'https://picsum.photos/500/400?random=3' },
    { id: 4, url: 'https://picsum.photos/500/400?random=4' },
    { id: 5, url: 'https://picsum.photos/500/400?random=5' },
    { id: 6, url: 'https://picsum.photos/500/400?random=6' },
    { id: 7, url: 'https://picsum.photos/500/400?random=7' },
    { id: 8, url: 'https://picsum.photos/500/400?random=8' },
    { id: 9, url: 'https://picsum.photos/500/400?random=9' },
    { id: 10, url: 'https://picsum.photos/500/400?random=10' }
  ]);
  
  // Track which item is being hovered (for mobile support)
  const [hoveredItem, setHoveredItem] = useState(null);
  
  const carouselRef = useRef(null);
  const [scrollAmount, setScrollAmount] = useState(200); // Updated estimate for larger items
  
  useEffect(() => {
    // Calculate actual scroll amount once component is mounted
    if (carouselRef.current && carouselRef.current.children.length > 0) {
      const firstItem = carouselRef.current.children[0];
      const itemWidth = firstItem.offsetWidth;
      const computedStyle = window.getComputedStyle(carouselRef.current);
      const gap = parseInt(computedStyle.columnGap || '16', 10);
      setScrollAmount(itemWidth + gap);
    }
    
    // Simulate fetching images from an API
    fetchImages();
  }, []);
  
  const fetchImages = async () => {
    try {
      // In a real app, you would fetch data here
      console.log('Images would be fetched here');
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };
  
  const scrollPrev = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };
  
  const scrollNext = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  const handleItemClick = (item) => {
    if (isAdmin){
        console.log('Edit item:', item);
    }
    // Implement your edit functionality here
  };
  
  // Mouse enter/leave handlers to support mobile devices
  const handleMouseEnter = (id) => {
    setHoveredItem(id);
  };
  
  const handleMouseLeave = () => {
    setHoveredItem(null);
  };
  
  return (
    <div className="carousel-container">
      <div className="carousel">
        <button className="carousel-button prev-button" onClick={scrollPrev}>
          <ChevronLeft className="chevron-icon" />
        </button>
        
        <div className="carousel-items" ref={carouselRef}>
          {items.map((item) => (
            <div 
              key={item.id} 
              className="carousel-item"
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={handleMouseLeave}
            >
              <img src={item.url} alt={`Image ${item.id}`} className="placeholder-image" />
              {isAdmin ? (
                <div className={`edit-overlay ${hoveredItem === item.id ? 'visible' : ''}`}>
                  <span>Edit</span>
                </div>
              ) : (
                <div className={`view-overlay ${hoveredItem === item.id ? 'visible' : ''}`} />
              )}
            </div>
          ))}
        </div>
        
        <button className="carousel-button next-button" onClick={scrollNext}>
          <ChevronRight className="chevron-icon" />
        </button>
      </div>
    </div>
  );
};

export default Carousel;