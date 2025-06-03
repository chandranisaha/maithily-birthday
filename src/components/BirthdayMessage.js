import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import note1 from '../assets/note1.png';
import note2 from '../assets/note2.png';
import birthdaySong from '../assets/happy-birthday-instrumental.mp3';

const BirthdayMessage = ({ onExit }) => {
  const audioRef = useRef(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showNote1, setShowNote1] = useState(false);

  // Play/pause handler
  const handleMusicToggle = () => {
    if (audioRef.current) {
      if (musicPlaying) {
        audioRef.current.pause();
        setMusicPlaying(false);
      } else {
        audioRef.current.volume = 0.5;
        audioRef.current.play();
        setMusicPlaying(true);
      }
    }
  };

  const handleExit = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setShowNote1(false);
    setMusicPlaying(false);
    onExit();
  };

  // When note2 is clicked, show note1 (full size), hide note2
  const handleNote2Click = () => {
    setShowNote1(true);
  };

  return (
    <div className="birthday-message-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#5D4037', // Brown background
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      overflow: 'hidden',
    }}>
      {/* Audio element */}
      <audio ref={audioRef} loop>
        <source src={birthdaySong} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Pink Play/Pause Button */}
      <motion.button
        onClick={handleMusicToggle}
        style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ff69b4, #ffb6c1)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '70px',
          height: '70px',
          fontSize: '32px',
          cursor: 'pointer',
          boxShadow: musicPlaying ? '0 0 24px 8px #ff69b4cc' : '0 4px 16px rgba(255, 105, 180, 0.3)',
          zIndex: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.3s',
        }}
        whileHover={{ boxShadow: '0 0 32px 16px #ff69b4ee' }}
        aria-label={musicPlaying ? 'Pause Birthday Song' : 'Play Birthday Song'}
      >
        {musicPlaying ? (
          <span style={{ fontWeight: 'bold', fontSize: '34px' }}>&#10073;&#10073;</span> // Pause icon
        ) : (
          <span style={{ fontWeight: 'bold', fontSize: '34px' }}>▶</span>
        )}
      </motion.button>

      {/* Notes Stack */}
      <div style={{
        position: 'relative',
        width: showNote1 ? '90vw' : '480px',
        height: showNote1 ? '90vh' : '480px',
        marginBottom: showNote1 ? '0' : '40px',
        transition: 'width 0.7s cubic-bezier(.68,-0.55,.27,1.55), height 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Note1 (shows full size after click) */}
        {showNote1 && (
          <motion.img
            src={note1}
            alt="Musical Note 1"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 11,
              cursor: 'default',
              transition: 'all 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
              boxShadow: '0 0 100px 40px #ff69b4aa',
            }}
            animate={{ scale: 1.05 }}
          />
        )}
        {/* Note2 (shows initially, hides on click) */}
        {!showNote1 && (
          <motion.img
            src={note2}
            alt="Musical Note 2"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 10,
              cursor: 'pointer',
              transition: 'all 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
            }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNote2Click}
          />
        )}
      </div>

      {/* Exit button (shows only when note1 is visible) */}
      {showNote1 && (
        <motion.button
          onClick={handleExit}
          style={{
            position: 'absolute',
            top: '60px',
            right: '60px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#8D6E63',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            zIndex: 20,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Exit
        </motion.button>
      )}
    </div>
  );
};

export default BirthdayMessage;

