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
      // Get the current image first
      const currentResponse = await axios.get('/rotation/current');
      if (currentResponse.status === 200) {
        setCurrentImage(currentResponse.data);
      }
      
      // Then get all items in the rotation
      const response = await axios.get('/rotation/items');
      const data = response.data.items;
      
      if (!data || !Array.isArray(data)) {
        console.error('Invalid data format received:', response.data);
        return;
      }
      
      // Filter out the current active item
      const activeItemId = currentResponse.data?.image?.item_id;
      const upcomingItems = activeItemId
        ? data.filter(item => item.item_id !== activeItemId)
        : data;
      
      // Sort by display_order
      upcomingItems.sort((a, b) => a.display_order - b.display_order);
      
      const transformedItems = upcomingItems.map((item) => {
        // Parse the pixel data if it's a string
        let pixelData = {};
        if (item.pixel_data) {
          try {
            pixelData = typeof item.pixel_data === 'string'
              ? JSON.parse(item.pixel_data)
              : item.pixel_data;
          } catch (error) {
            console.error('Error parsing pixel data:', error);
          }
        }
        
        return {
          id: item.item_id,
          design_id: item.design_id,
          title: item.title,
          pixel_data: pixelData,
          duration: item.duration,
          display_order: item.display_order,
          expiry_time: item.expiry_time,
          imageUrl: renderPixelDataToImage(pixelData, 64, 64, 1)
        };
      });
      
      setItems(transformedItems);
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
                
                {/* Conditional overlay for admin edit or regular view */}
                {isAdmin ? (
                  <div className={`edit-overlay ${hoveredItem === item.id ? 'visible' : ''}`}>
                    <span>Edit</span>
                  </div>
                ) : (
                  <div className={`view-overlay ${hoveredItem === item.id ? 'visible' : ''}`} />
                )}
                
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