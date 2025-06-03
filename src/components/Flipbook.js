import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

// Import default images
import img1 from '../assets/1.png';
import img2 from '../assets/2.png';
import img3 from '../assets/3.png';
import img4 from '../assets/4.png';
import img5 from '../assets/5.png';
import img6 from '../assets/6.png';
import img7 from '../assets/7.png';
import img8 from '../assets/8.png';

const Flipbook = ({ onPageFlip, onPageComplete, images: propImages = [] }) => {
  const [images, setImages] = useState(propImages.length ? propImages : [img1, img2, img3, img4, img5, img6, img7, img8]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  // Update images when propImages changes
  useEffect(() => {
    if (propImages && propImages.length > 0) {
      // Ensure we have exactly 8 images by filling with default images if needed
      const paddedImages = [...propImages];
      const defaultImages = [img1, img2, img3, img4, img5, img6, img7, img8];
      
      // Fill with default images if needed, but don't exceed 8 images
      for (let i = paddedImages.length; i < 8 && i < defaultImages.length; i++) {
        if (defaultImages[i]) {
          paddedImages.push(defaultImages[i]);
        }
      }
      
      // Always update if we have images to prevent any missing images
      if (paddedImages.length > 0) {
        setImages(paddedImages);
        setCurrentPage(0);
      }
    }
  }, [propImages]); // Removed images from dependencies to prevent infinite loop

  // Handle page flip
  const flipPage = useCallback((dir) => {
    if (isAnimating) return;
    
    const newPage = currentPage + dir;
    if (newPage >= 0 && newPage < images.length) {
      setDirection(dir);
      setCurrentPage(newPage);
      setIsAnimating(true);
      
      if (onPageFlip) onPageFlip(newPage);
      
      if (newPage === images.length - 1 && onPageComplete) {
        onPageComplete();
      }
    }
  }, [currentPage, isAnimating, images.length, onPageFlip, onPageComplete]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') flipPage(1);
    else if (e.key === 'ArrowLeft') flipPage(-1);
  }, [flipPage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Touch and mouse events for swiping
  const handleTouchStart = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (!isDragging.current) return;
    
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const diffX = touch.clientX - startX.current;
    const diffY = touch.clientY - startY.current;
    
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      flipPage(diffX > 0 ? -1 : 1);
    }
    
    isDragging.current = false;
  };

  // Animation variants for page transitions with flip effect
  const pageVariants = {
    enter: (direction) => ({
      rotateY: direction > 0 ? 180 : -180,
      scale: 0.9,
      opacity: 0,
      position: 'absolute',
      zIndex: 0,
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    }),
    center: {
      rotateY: 0,
      scale: 1,
      opacity: 1,
      position: 'relative',
      zIndex: 1,
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    },
    exit: (direction) => ({
      rotateY: direction < 0 ? 180 : -180,
      scale: 0.9,
      opacity: 0,
      position: 'absolute',
      zIndex: 0,
      backfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d'
    })
  };

  const pageTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 0.5
  };
  
  // Track animation direction
  const [direction, setDirection] = useState(1);

  if (images.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Loading images...</div>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      position: 'relative',
      padding: '20px 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px',
        boxSizing: 'border-box'
      }}>
        {/* Left Arrow */}
        <motion.button
          onClick={() => flipPage(-1)}
          disabled={currentPage === 0 || isAnimating}
          style={{
            background: 'linear-gradient(135deg, #8B5A2B, #D2B48C)',
            border: '2px solid #FFB6C1',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 0 ? 0.5 : 1,
            outline: 'none',
            padding: 0,
            margin: 0
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaArrowLeft style={{ color: '#FFB6C1', fontSize: '24px' }} />
        </motion.button>

        {/* Flipbook Content */}
        <div 
          ref={containerRef}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            flex: 1,
            height: '80vh',
            width: '100%',
            margin: 0,
            position: 'relative',
            overflow: 'visible',
            backgroundColor: 'transparent',
            perspective: '1000px',
            transformStyle: 'preserve-3d',
            padding: 0,
            border: 'none',
            borderRadius: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              onAnimationComplete={() => setIsAnimating(false)}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
                borderRadius: 0
              }}
            >
              {images[currentPage] && (
                <img
                  src={images[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    transform: 'translateZ(0)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    padding: 0,
                    margin: 0,
                    borderRadius: 0,
                    backgroundColor: 'transparent',
                    opacity: 1,
                    transition: 'opacity 0.3s ease'
                  }}
                  draggable={false}
                  onError={(e) => {
                    console.error(`Failed to load image: ${images[currentPage]}`);
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.button
          onClick={() => flipPage(1)}
          disabled={currentPage === images.length - 1 || isAnimating}
          style={{
            background: 'linear-gradient(135deg, #8B5A2B, #D2B48C)',
            border: '2px solid #FFB6C1',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage === images.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === images.length - 1 ? 0.5 : 1,
            outline: 'none',
            padding: 0,
            margin: 0
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaArrowRight style={{ color: '#FFB6C1', fontSize: '24px' }} />
        </motion.button>
      </div>

      {/* Page Indicator */}
      <div style={{
        marginTop: '20px',
        padding: '8px 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: '20px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#8B5A2B',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        {currentPage + 1} / {images.length}
      </div>
    </div>
  );
};

export default Flipbook;
