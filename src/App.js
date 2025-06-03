import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Flipbook from './components/Flipbook';
import Candle from './components/Candle';
import Photobooth from './components/Photobooth';
import BirthdayMessage from './components/BirthdayMessage';
import './App.css';

// Import images directly
import img1 from './assets/1.png';
import img2 from './assets/2.png';
import img3 from './assets/3.png';
import img4 from './assets/4.png';
import img5 from './assets/5.png';
import img6 from './assets/6.png';
import img7 from './assets/7.png';
import img8 from './assets/8.png';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: '100vw' },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: '-100vw' }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5
};

function App() {
  const [currentPhase, setCurrentPhase] = useState('loading');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [testMode, setTestMode] = useState(false);
  const [showBirthdayMessage, setShowBirthdayMessage] = useState(false);

  useEffect(() => {
    // Load images
    const imagePaths = [
      img1,
      img2,
      img3,
      img4,
      img5,
      img6,
      img7,
      img8
    ];

    Promise.all(
      imagePaths.map(path => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
          img.src = path;
        });
      })
    ).then(imgs => {
      setImages(imgs.map(img => img.src));
      setCurrentPhase('flipbook');
    }).catch(error => {
      setError(error);
      setCurrentPhase('error');
    });
  }, []);

  const handleFlip = (newPage) => {
    setCurrentPage(newPage);
    
    // If this is the last page, wait 5 seconds then go to photobooth
    if (newPage === images.length - 1) {
      setTimeout(() => {
        setCurrentPhase('photobooth');
        setCurrentPage(0);
      }, 5000);
    }
  };

  const handleBlowDetected = () => {
    // This will be called when the user blows the candle if using that flow
    setCurrentPhase('photobooth');
    setCurrentPage(0);
  };

  const handlePhotosCaptured = (capturedPhotos) => {
    setPhotos(capturedPhotos);
    setCurrentPhase('results');
  };

  const toggleTestMode = () => {
    if (testMode) {
      // If exiting test mode, go back to flipbook
      setCurrentPhase('flipbook');
      setTestMode(false);
    } else {
      // If entering test mode, go to candle
      setTestMode(true);
      setCurrentPhase('candle');
    }
  };

  if (currentPhase === 'loading') {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your flipbook...</p>
        </div>
      </div>
    );
  }

  if (currentPhase === 'error') {
    return (
      <div className="App">
        <div className="error-container">
          <p>Error: {error.message}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  // Render the current phase with animations
  const renderPhase = () => {
    switch (currentPhase) {
      case 'loading':
        return (
          <motion.div 
            className="loading-screen"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <div className="spinner"></div>
            <p>Loading your birthday experience...</p>
          </motion.div>
        );
      case 'flipbook':
        return (
          <motion.div
            key="flipbook"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Flipbook 
              onPageFlip={handleFlip} 
              onPageComplete={() => handleFlip(images.length - 1)}
              images={images}
            />
          </motion.div>
        );
      case 'photobooth':
        return (
          <motion.div
            key="photobooth"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Photobooth onPhotosCaptured={handlePhotosCaptured} />
          </motion.div>
        );
      case 'results':
        return (
          <motion.div 
            className="results-container"
            key="results"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <h1 className="title">Your Photobooth Strip</h1>
            <div className="photo-strip">
              {photos.map((photo, index) => (
                <motion.div 
                  key={index} 
                  className="photo-frame"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <img src={photo} alt="" />
                </motion.div>
              ))}
            </div>
            <motion.button 
              onClick={() => setCurrentPhase('flipbook')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="action-button"
            >
              Create Another Memory
            </motion.button>
          </motion.div>
        );
      case 'candle':
        return (
          <motion.div
            key="candle"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Candle onBlowDetected={handleBlowDetected} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      {/* Top Right Buttons */}
      {/* Top Left: Birthday Message Button */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 1100,
        display: 'flex',
        gap: '10px',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}>
        <button 
          onClick={() => setShowBirthdayMessage(true)}
          style={{
            padding: '10px 20px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(45deg, #8B5A2B, #D2B48C)',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            fontWeight: 'bold',
            fontSize: '14px',
            transition: 'all 0.3s ease',
          }}
        >
          Birthday Message
        </button>
      </div>

      {/* Top Right: Birthday Candle/Test Mode Button (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
        }}>
          <button 
            onClick={toggleTestMode}
            className={`test-button ${testMode ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              background: 'linear-gradient(45deg, #8B5A2B, #D2B48C)',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s ease',
            }}
          >
            {testMode ? 'Exit Test Mode' : 'Birthday Candle'}
          </button>
        </div>
      )}

      {/* Birthday Message Overlay */}
      {showBirthdayMessage && (
        <BirthdayMessage onExit={() => setShowBirthdayMessage(false)} />
      )}

      <AnimatePresence mode="wait">
        {renderPhase()}
      </AnimatePresence>

      {/* Background decoration elements */}
      <div className="decoration top-left"></div>
      <div className="decoration top-right"></div>
      <div className="decoration bottom-left"></div>
      <div className="decoration bottom-right"></div>
    </div>
  );
}

export default App;
