const fs = require('fs');
const path = require('path');

// Create components directory if it doesn't exist
const componentsDir = path.join(__dirname, 'src', 'components');
if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
}

// Create Confetti component
const confettiContent = `import React, { useRef, useEffect } from 'react';

const Confetti = ({ isActive }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      const container = containerRef.current;
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
      const shapes = ['circle', 'square', 'star'];

      const createConfetti = () => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 10 + 5;
        const rotation = Math.random() * 360;
        const delay = Math.random() * 1000;
        
        // Set styles
        confetti.style.backgroundColor = color;
        confetti.style.width = \`\${size}px\`;
        confetti.style.height = \`\${size}px\`;
        confetti.style.left = \`\${Math.random() * 100}%\`;
        confetti.style.transform = \`rotate(\${rotation}deg)\`;
        
        // Add shape class
        confetti.classList.add(\`shape-\${shape}\`);
        
        // Add to container
        container.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
          confetti.remove();
        }, 3000);
      };

      // Create multiple confetti pieces
      for (let i = 0; i < 50; i++) {
        setTimeout(createConfetti, i * 20);
      }

      // Stop after 3 seconds
      setTimeout(() => {
        const confettiElements = container.querySelectorAll('.confetti');
        confettiElements.forEach(el => el.remove());
      }, 3000);
    }
  }, [isActive]);

  return (
    <div ref={containerRef} className="confetti-container">
      {/* Confetti pieces will be added here dynamically */}
    </div>
  );
};

export default Confetti;`;

fs.writeFileSync(path.join(componentsDir, 'Confetti.js'), confettiContent);

// Update App.css
const appCssContent = `.App {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.confetti {
  position: absolute;
  bottom: 0;
  animation: flyUp 3s ease-out forwards;
}

@keyframes flyUp {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

.shape-circle {
  border-radius: 50%;
}

.shape-square {
  transform: rotate(45deg);
}

.shape-star {
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
}

.birthday-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: bold;
  color: #FF6B6B;
  text-shadow: 
    0 0 10px #FF6B6B,
    0 0 20px #FF6B6B,
    0 0 30px #FF6B6B;
  animation: pulse 2s infinite;
  z-index: 1000;
}

@keyframes pulse {
  0% { opacity: 1; text-shadow: 0 0 10px #FF6B6B; }
  50% { opacity: 0.8; text-shadow: 0 0 20px #FF6B6B; }
  100% { opacity: 1; text-shadow: 0 0 10px #FF6B6B; }
}

/* Existing styles */
{{ ... }}`;

fs.writeFileSync(path.join(__dirname, 'src', 'App.css'), appCssContent);

// Update Candle component
const candleContent = `import React, { useRef, useEffect, useState } from 'react';
import Confetti from './Confetti';

const Candle = ({ onBlowDetected }) => {
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const audioStream = useRef(null);
  const dataArray = useRef(new Uint8Array(1024));
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isBlown, setIsBlown] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.current = stream;
        audioContext.current = new AudioContext();
        
        const source = audioContext.current.createMediaStreamSource(stream);
        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 2048;
        
        source.connect(analyser.current);
        setIsListening(true);
        
        const checkBlow = () => {
          analyser.current.getByteFrequencyData(dataArray.current);
          const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length;
          
          if (average > 128 && !isBlown) { // Adjust this threshold as needed
            setIsBlown(true);
            setShowMessage(true);
            onBlowDetected();
            
            // Add confetti and message
            setTimeout(() => {
              setShowMessage(false);
            }, 3000);
          }
          
          requestAnimationFrame(checkBlow);
        };

        checkBlow();
      } catch (err) {
        setError(err.message);
        setIsListening(false);
      }
    };

    initAudio();

    return () => {
      if (audioStream.current) {
        audioStream.current.getTracks().forEach(track => track.stop());
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [onBlowDetected]);

  return (
    <div className="candle-container">
      <div className="candle">
        <div className="flame" style={{
          animation: isListening && !isBlown ? 'flicker 0.5s infinite' : 'none'
        }}></div>
      </div>
      
      {error && (
        <p className="error-message">{error}</p>
      )}
      {!error && !isListening && (
        <p>Please allow microphone access to detect blowing.</p>
      )}
      
      <Confetti isActive={isBlown} />
      
      {showMessage && (
        <div className="birthday-message">
          HAPPY BIRTHDAY MAITHILY!
        </div>
      )}
    </div>
  );
};

export default Candle;`;

fs.writeFileSync(path.join(componentsDir, 'Candle.js'), candleContent);

console.log('All changes have been applied successfully!');
