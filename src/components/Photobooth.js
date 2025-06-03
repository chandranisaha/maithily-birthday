// src/components/Photobooth.js
import React, { useState, useRef, useEffect, useCallback } from 'react';

const Photobooth = ({ onPhotosCaptured }) => {
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  // Fallback sound in case the file isn't found
  const shutterSound = useRef({
    play: () => {
      try {
        new Audio('/sounds/shutter-click.mp3').play().catch(() => {
          // Silent error if audio can't play
        });
      } catch (e) {
        console.log('Audio playback error:', e);
      }
    }
  });

  // Cleanup function for camera
  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    console.log('Attempting to capture photo...');
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return null;
    }
    
    try {
      // Play shutter sound
      if (shutterSound.current) {
        try {
          shutterSound.current.play().catch(e => console.log('Could not play sound:', e));
        } catch (e) {
          console.log('Error playing sound:', e);
        }
      }
      
      // Flash effect
      const flash = document.createElement('div');
      flash.style.position = 'fixed';
      flash.style.top = '0';
      flash.style.left = '0';
      flash.style.width = '100%';
      flash.style.height = '100%';
      flash.style.backgroundColor = 'white';
      flash.style.opacity = '0.8';
      flash.style.zIndex = '9999';
      flash.style.transition = 'opacity 0.5s';
      document.body.appendChild(flash);
      
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(flash)) {
            document.body.removeChild(flash);
          }
        }, 500);
      }, 100);
      
      // Draw video frame to canvas
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const video = videoRef.current;
      
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageData = canvas.toDataURL('image/png');
        console.log('Photo captured successfully');
        return imageData;
      } else {
        console.error('Video not ready for capture');
        return null;
      }
    } catch (err) {
      console.error("Error in capturePhoto:", err);
      return null;
    }
  }, []);

  const startPhotoSequence = useCallback(async () => {
    console.log('Starting photo sequence...');
    const photos = [];
    
    const takePhoto = async (count) => {
      console.log(`Taking photo ${4 - count} of 3`);
      if (count <= 0) return photos;
      
      setCountdown(count);
      
      // Wait for countdown
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        // Take photo
        const photo = capturePhoto();
        if (photo) {
          photos.push(photo);
          setCapturedPhotos(prev => [...prev, photo]);
          console.log('Photo captured successfully');
        }
        
        // Take next photo if needed
        if (count > 1) {
          return takePhoto(count - 1);
        }
        
        return photos;
      } catch (err) {
        console.error('Error in takePhoto:', err);
        return photos;
      }
    };
    
    try {
      console.log('Starting photo capture sequence');
      const captured = await takePhoto(3);
      console.log('Photo sequence complete. Photos captured:', captured.length);
      
      // Clean up and notify parent
      if (onPhotosCaptured && captured.length > 0) {
        console.log('Notifying parent component of captured photos');
        onPhotosCaptured(captured);
      }
      
      return captured;
    } catch (err) {
      console.error("Error in photo sequence:", err);
      setError("Error capturing photos. Please try again.");
      return [];
    }
  }, [capturePhoto, onPhotosCaptured]);

  const initCamera = useCallback(async () => {
    try {
      setError(null);
      setCameraActive(false);
      
      // Clean up any existing stream
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      }
      
      // Request camera access with error handling for unsupported browsers
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      // First try with ideal constraints
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });
      } catch (err) {
        console.warn('Camera access with ideal constraints failed, trying basic constraints:', err);
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }
      
      if (!stream) {
        throw new Error('Could not access camera');
      }
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Set up video element
      const video = videoRef.current;
      if (video) {
        // First remove any existing srcObject
        if (video.srcObject) {
          video.srcObject = null;
        }
        
        // Set the new stream
        video.srcObject = stream;
        
        // Set required attributes
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        
        // Play the video
        await video.play().catch(err => {
          console.error('Error playing video:', err);
          throw new Error('Could not start camera preview');
        });
        
        setCameraActive(true);
      } else {
        throw new Error('Video element not found');
      }
    } catch (err) {
      console.error('Error initializing camera:', err);
      setError('Could not access camera. Please check permissions and try again.');
      setCameraActive(false);
      
      // Clean up on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, []);

  // Initialize camera when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      try {
        await initCamera();
        // Small delay to ensure camera is fully ready before starting sequence
        setTimeout(() => {
          if (isMounted) {
            startPhotoSequence().catch(err => {
              console.error('Error in photo sequence:', err);
              if (isMounted) {
                setError('Failed to start photo sequence. Please try again.');
              }
            });
          }
        }, 1000);
      } catch (err) {
        console.error('Failed to initialize camera:', err);
        if (isMounted) {
          setError('Failed to initialize camera. Please refresh the page and try again.');
        }
      }
    };
    
    // Add a small delay to prevent race conditions
    const timer = setTimeout(initialize, 100);
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupCamera();
    };
  }, [initCamera, cleanupCamera, startPhotoSequence]);



  return (
    <div className="photobooth-container" style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className="camera-preview" style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        maxWidth: '800px',
        maxHeight: '600px',
        backgroundColor: '#000',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)'
          }}
        />
        
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }} 
        />
        
        {countdown > 0 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10
          }}>
            <div style={{
              fontSize: '120px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 0 20px rgba(255, 255, 255, 0.7)',
              animation: 'pulse 0.8s ease-in-out'
            }}>
              {countdown}
            </div>
          </div>
        )}
        
        {!cameraActive && !error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 5
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '5px solid #f3f3f3',
              borderTop: '5px solid #8B5A2B',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }}></div>
            <p>Loading camera...</p>
          </div>
        )}
        
        {error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '20px',
            textAlign: 'center',
            zIndex: 5
          }}>
            <p style={{ marginBottom: '20px' }}>{error}</p>
            <button 
              onClick={initCamera}
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                border: 'none',
                background: 'linear-gradient(45deg, #8B5A2B, #D2B48C)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    
    {/* Photo strip */}
    {capturedPhotos.length > 0 && (
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0',
        width: 'auto',
        maxWidth: '95%',
        overflowX: 'auto',
        zIndex: 10,
        backgroundColor: '#000000',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.7)',
        borderRadius: '0',
        boxSizing: 'border-box',
        borderBottom: '5px solid #000',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none'
      }}>
        {capturedPhotos.map((photo, index) => (
          <div 
            key={index} 
            style={{
              width: '85px',
              height: '85px',
              overflow: 'hidden',
              border: '2px solid #000',
              borderRight: index < capturedPhotos.length - 1 ? '2px solid #000' : '2px solid #000',
              flexShrink: 0,
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              borderRadius: 0,
              borderBottom: index === capturedPhotos.length - 1 ? '5px solid #000' : '2px solid #000'
            }}
          >
            <img 
              src={photo} 
              alt={`Captured ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 0,
                display: 'block',
                border: 'none',
                outline: 'none',
                padding: 0,
                margin: 0,
                boxSizing: 'border-box'
              }} 
            />
          </div>
        ))}
      </div>
    )}
    
    <style jsx global>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    `}</style>
    </div>
  );
};

export default Photobooth;