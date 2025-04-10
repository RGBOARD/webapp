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

  useEffect(() => {
    // Calculate scroll amount once the component is rendered
    if (carouselRef.current && carouselRef.current.children.length > 0) {
      const firstItem = carouselRef.current.children[0];
      const itemWidth = firstItem.offsetWidth;
      const computedStyle = window.getComputedStyle(carouselRef.current);
      const gap = parseInt(computedStyle.columnGap || '16', 10);
      setScrollAmount(itemWidth + gap);
    }

    // Fetch images from the /design endpoint
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get('/queue_item/scheduled');
      const data = response.data; // array of design objects

      // Convert each design record into an object with `id` and `url`
      const transformedItems = data.map((design) => ({
        id: design.design_id,
        // base64 image turned into a data URL
        url: `data:image/jpeg;base64,${design.image}`,
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
      // Implement edit functionality as needed
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
