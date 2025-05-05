import React, { useState, useRef, useEffect } from 'react';
// import { Navigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './styles/Carousel.css';
import axios from '../api/axios';
import { renderPixelDataToImage } from '../utils/pixelRenderer';

const Carousel = ({ userRole }) => {
  const isAdmin = userRole === 'admin';

  const [items, setItems] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const carouselRef = useRef(null);
  const [scrollAmount, setScrollAmount] = useState(200);

  // const [redirectToEdit, setRedirectToEdit] = useState(null);
  const queueRef = useRef([]); // persistent visual queue
  const previousActiveIdRef = useRef(null);

  useEffect(() => {
    // Adjust scroll amount based on first item's width and gap
    if (carouselRef.current && carouselRef.current.children.length > 0) {
      const firstItem = carouselRef.current.children[0];
      const itemWidth = firstItem.offsetWidth;
      const computedStyle = window.getComputedStyle(carouselRef.current);
      const gap = parseInt(computedStyle.columnGap || '16', 10);
      setScrollAmount(itemWidth + gap);
    }
    fetchRotationItems();
    
    // Set up polling to refresh data every 5 seconds
    const intervalId = setInterval(() => {
      fetchRotationItems();
    }, 5000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

const fetchRotationItems = async () => {
  try {
    const currentResponse = await axios.get('/rotation/current');
    const activeItem = currentResponse.data?.image;
    const activeItemId = activeItem?.item_id;
    setCurrentImage(activeItem);

    const response = await axios.get('/rotation/items');
    const data = response.data.items || [];

    const sorted = [...data].sort((a, b) => a.display_order - b.display_order);

    if (queueRef.current.length === 0) {
      queueRef.current = sorted.filter(item => item.item_id !== activeItemId);
      previousActiveIdRef.current = activeItemId;
    }

    // If active item changed
    if (previousActiveIdRef.current !== activeItemId) {
      // Remove new active item
      queueRef.current = queueRef.current.filter(item => item.item_id !== activeItemId);

      // Add the old active item back to the end if it's not already in the queue
      const oldActive = sorted.find(item => item.item_id === previousActiveIdRef.current);
      if (oldActive && !queueRef.current.find(i => i.item_id === oldActive.item_id)) {
        queueRef.current.push(oldActive);
      }

      previousActiveIdRef.current = activeItemId;
    }

    // Parse and map for rendering
    const transformed = queueRef.current.map((item) => {
      let pixelData = {};
      try {
        pixelData =
          typeof item.pixel_data === 'string'
            ? JSON.parse(item.pixel_data)
            : item.pixel_data;
      } catch (e) {
        console.error('Failed to parse pixel data', e);
      }

      return {
        id: item.item_id,
        design_id: item.design_id,
        title: item.title,
        pixel_data: pixelData,
        duration: item.duration,
        display_order: item.display_order,
        expiry_time: item.expiry_time,
        imageUrl: renderPixelDataToImage(pixelData, 64, 64, 1),
      };
    });

    setItems(transformed);
  } catch (error) {
    console.error('Error fetching rotation items:', error);
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

  // const handleItemClick = (item) => {
  //   if (isAdmin) {
  //     setRedirectToEdit({
  //       design: {
  //         design_id: item.design_id,
  //         title: item.title,
  //         pixel_data: item.pixel_data
  //       }
  //     });
  //   }
  // };

  const handleMouseEnter = (id) => {
    setHoveredItem(id);
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // if (redirectToEdit) {
  //   return <Navigate to="/edit" state={redirectToEdit} replace />;
  // }

  return (
    <div className="carousel-container">
      <div className="up-next-label">Up Next:</div>
      <div className="carousel">
        <button className="carousel-button prev-button" onClick={scrollPrev}>
          <ChevronLeft className="chevron-icon" />
        </button>

        <div className="carousel-items" ref={carouselRef}>
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="carousel-item"
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Use pre-rendered image URL */}
                <img
                  src={item.imageUrl}
                  alt={item.title || `Design ${item.design_id}`}
                  className="placeholder-image"
                />              
                
                {/* Display duration information on hover */}
                <div className={`schedule-overlay ${hoveredItem === item.id ? 'visible' : ''}`}>
                  <span>{item.duration}s</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-items-message">No upcoming images in the rotation</div>
          )}
        </div>

        <button className="carousel-button next-button" onClick={scrollNext}>
          <ChevronRight className="chevron-icon" />
        </button>
      </div>
    </div>
  );
};

export default Carousel;