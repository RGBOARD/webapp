import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './styles/Carousel.css';
import axios from '../api/axios';

const Carousel = ({ userRole }) => {
  const isAdmin = userRole === 'admin';

  const [items, setItems] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const carouselRef = useRef(null);
  const [scrollAmount, setScrollAmount] = useState(200);

  // Helper function to format date/time strings into a friendly format.
  const formatDateTime = (datetimeString) => {
    if (!datetimeString) return '';
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(datetimeString).toLocaleString(undefined, options);
  };

  useEffect(() => {
    // Adjust scroll amount based on first item's width and gap.
    if (carouselRef.current && carouselRef.current.children.length > 0) {
      const firstItem = carouselRef.current.children[0];
      const itemWidth = firstItem.offsetWidth;
      const computedStyle = window.getComputedStyle(carouselRef.current);
      const gap = parseInt(computedStyle.columnGap || '16', 10);
      setScrollAmount(itemWidth + gap);
    }
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get('/queue_item/scheduled');
      const data = response.data;
      const transformedItems = data.map((record) => ({
        id: record.queue_id, // or record.design_id, as needed
        url: `data:image/jpeg;base64,${record.image}`,
        start_time: record.start_time,
        end_time: record.end_time,
      }));
      setItems(transformedItems);
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
    if (isAdmin) {
      console.log('Edit item:', item);
    }
  };

  const handleMouseEnter = (id) => {
    setHoveredItem(id);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return (
    <div className="carousel-container">
      <div className="up-next-label">Up Next:</div>
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
              <img
                src={item.url}
                alt={`Image ${item.id}`}
                className="placeholder-image"
              />
              {/* Conditional overlay for admin edit or regular view */}
              {isAdmin ? (
                <div className={`edit-overlay ${hoveredItem === item.id ? 'visible' : ''}`}>
                  <span>Edit</span>
                </div>
              ) : (
                <div className={`view-overlay ${hoveredItem === item.id ? 'visible' : ''}`} />
              )}
              {/* Schedule overlay: only becomes visible on hover */}
              {item.start_time && (
                <div className={`schedule-overlay ${hoveredItem === item.id ? 'visible' : ''}`}>
                  <span>{formatDateTime(item.start_time)}</span>
                </div>
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
