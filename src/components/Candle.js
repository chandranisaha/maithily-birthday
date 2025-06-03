// src/components/Candle.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Confetti from './Confetti';

const Candle = ({ onBlowDetected }) => {
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const audioStream = useRef(null);
  const dataArray = useRef(null);
  const animationFrameId = useRef(null);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isBlown, setIsBlown] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [flameClass, setFlameClass] = useState('active');
  const [showInstruction, setShowInstruction] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const handleBlow = useCallback(() => {
    if (isBlown) return;
    
    setIsBlown(true);
    setShowMessage(true);
    setFlameClass('extinguishing');
    setShowInstruction(false);
    
    // Play blow sound if needed
    try {
      const blowSound = new Audio('/sounds/blow.mp3');
      blowSound.play().catch(e => console.error('Error playing blow sound:', e));
    } catch (err) {
      console.error('Error with audio:', err);
    }
    
    // Call the completion handler after a longer delay
    setTimeout(() => {
      if (onBlowDetected) onBlowDetected();
    }, 5000); // Increased from 1s to 5s
    
    // Hide message after 8 seconds (increased from 3s)
    setTimeout(() => {
      setShowMessage(false);
    }, 8000);
  }, [isBlown, onBlowDetected]);
  
  const handleManualBlow = () => {
    handleBlow();
  };

  // Function to detect blow based on audio input
  const detectBlow = useCallback(() => {
    if (isBlown || !analyser.current || !dataArray.current) return;
    
    analyser.current.getByteFrequencyData(dataArray.current);
    
    // Calculate average volume (focus on lower frequencies where blowing is more prominent)
    let sum = 0;
    const length = Math.min(50, dataArray.current.length); // Only check lower frequencies
    
    for (let i = 0; i < length; i++) {
      sum += dataArray.current[i];
    }
    
    const average = sum / length;
    
    // Check for blow (threshold may need adjustment)
    if (average > 40) { // Reduced threshold for better detection
      console.log('Blow detected with level:', average);
      handleBlow();
      return;
    }
    
    // Continue monitoring
    animationFrameId.current = requestAnimationFrame(detectBlow);
  }, [isBlown]);

  // Initialize audio and start blow detection
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Request microphone access with more permissive constraints
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        audioStream.current = stream;
        
        // Create AudioContext (resume it first if it was suspended)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext.current = new AudioContext();
        
        // Wait for audio context to be ready
        if (audioContext.current.state === 'suspended') {
          await audioContext.current.resume();
        }
        
        const source = audioContext.current.createMediaStreamSource(stream);
        analyser.current = audioContext.current.createAnalyser();
        
        // Configure analyser for better blow detection
        analyser.current.fftSize = 256; // Smaller FFT size for faster processing
        analyser.current.smoothingTimeConstant = 0.2; // More responsive to changes
        
        // Set up audio processing
        source.connect(analyser.current);
        dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
        
        setIsListening(true);
        setError(null);
        setFlameClass('active');
        
        // Start blow detection
        detectBlow();
        
      } catch (err) {
        console.error('Error initializing audio:', err);
        
        // Retry a few times if there's an error
        if (retryCount < 3) {
          console.log(`Retrying microphone access (${retryCount + 1}/3)...`);
          setRetryCount(prev => prev + 1);
          const timer = setTimeout(() => {
            initAudio();
          }, 1000);
          return () => clearTimeout(timer);
        } else {
          setError('Could not access microphone. Please check your browser permissions and refresh the page.');
          setIsListening(false);
        }
      }
    };

    // Only initialize if not already initialized and not blown
    if (!isBlown && !audioContext.current) {
      initAudio();
    }

    // Cleanup function
    return () => {
      // Cancel any pending animation frames
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Stop all audio tracks
      if (audioStream.current) {
        audioStream.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Close audio context if it exists
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close().catch(console.error);
      }
    };
  }, [isBlown, retryCount, detectBlow]);

  return (
    <div className="candle-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
      color: 'white',
      textAlign: 'center'
    }}>
      {/* Microphone status indicator */}
      <div style={{
        marginBottom: '20px',
        padding: '8px 16px',
        borderRadius: '20px',
        background: isListening ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
        color: isListening ? '#8BC34A' : '#FF8A80',
        border: `1px solid ${isListening ? '#8BC34A' : '#FF8A80'}`,
        fontSize: '0.9rem',
        fontWeight: 'bold'
      }}>
        {isListening ? '🎤 Microphone Ready - Blow to extinguish!' : '🎤 Click to allow microphone access'}
      </div>
      
      {/* Candle */}
      <div style={{
        position: 'relative',
        width: '60px',
        height: '220px',
        background: 'linear-gradient(to bottom, #F8BBD0, #F06292)',
        borderRadius: '30px 30px 5px 5px',
        margin: '20px 0',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        zIndex: 1
      }}>
        {/* Candle wax drips */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '10px',
          width: '15px',
          height: '25px',
          background: 'rgba(255,255,255,0.7)',
          borderRadius: '0 0 10px 10px',
          transform: 'rotate(10deg)'
        }}></div>
        
        {/* Flame and smoke */}
        {!isBlown && (
          <div className={`flame ${flameClass}`} style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '30px',
            height: '60px',
            background: 'linear-gradient(to bottom, #FFEB3B, #FF9800)',
            borderRadius: '50% 50% 20% 20%',
            boxShadow: '0 0 20px #FF9800, 0 0 40px #FFC107',
            filter: 'blur(1px)',
            transformOrigin: 'center bottom',
            zIndex: 2
          }}></div>
        )}
        
        {isBlown && (
          <div className="smoke" style={{
            position: 'absolute',
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '10px',
            height: '100px',
            background: 'linear-gradient(to bottom, rgba(200,200,200,0.8), transparent)',
            borderRadius: '50%',
            filter: 'blur(4px)',
            animation: 'smoke 3s ease-out forwards',
            zIndex: 3
          }}></div>
        )}
        
        {/* Candle wick */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4px',
          height: '20px',
          background: '#333',
          borderRadius: '2px'
        }}></div>
      </div>
      
      {/* Instruction */}
      {showInstruction && !isBlown && (
        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: 'rgba(255, 215, 64, 0.2)',
          borderRadius: '10px',
          border: '1px solid #FFD700',
          color: '#FFD700',
          maxWidth: '300px',
          fontSize: '1.1rem',
          lineHeight: '1.5'
        }}>
          💨 Blow on the candle to celebrate!
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div style={{
          color: '#FF8A80',
          margin: '20px 0',
          padding: '10px',
          background: 'rgba(244, 67, 54, 0.1)',
          borderRadius: '5px',
          maxWidth: '300px'
        }}>
          {error}
        </div>
      )}
      
      {/* Manual blow button */}
      <button 
        onClick={handleManualBlow}
        disabled={isBlown}
        style={{
          marginTop: '30px',
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: 'white',
          background: isBlown ? '#81C784' : '#FF4081',
          border: 'none',
          borderRadius: '25px',
          cursor: isBlown ? 'default' : 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          ':hover': !isBlown ? {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
            background: '#F50057'
          } : {}
        }}
      >
        {isBlown ?  'Happy buddayyyy' : 'Click to Blow Out Candle (microphone skill issue sorriii'}
      </button>
      
      {/* Birthday message */}
      {showMessage && (
        <motion.div 
          className="birthday-message"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            marginTop: '40px',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '15px',
            border: '2px solid rgb(221, 217, 78)',
            maxWidth: '90%',
            animation: 'pulse 2s infinite'
          }}
        >
          HAPPY BIRTHDAY MAITHULULUUUUU
        </motion.div>
      )}
      
      {/* Confetti */}
      <Confetti isActive={isBlown} />
      
      {/* Debug info - uncomment if needed */}
      {/* <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        left: '10px',
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '0.8rem',
        fontFamily: 'monospace'
      }}>
        Audio Level: {Math.round(audioLevel)}
      </div> */}
    </div>
  );
};

export default Candle;