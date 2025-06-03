import React, { useRef, useEffect } from 'react';

const Confetti = ({ isActive, duration = 10000 }) => {
  const containerRef = useRef(null);
  const confettiInterval = useRef(null);

  const createConfetti = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FFD700', '#FF9F1C', '#FF6B6B'];
    const confetti = document.createElement('div');
    
    // Random properties
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 15 + 5;
    const rotation = Math.random() * 360;
    const left = Math.random() * 100;
    const animationDuration = Math.random() * 3 + 2;
    
    // Set styles
    confetti.style.position = 'fixed';
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.backgroundColor = color;
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.left = `${left}%`;
    confetti.style.top = '-20px';
    confetti.style.opacity = '0.9';
    confetti.style.transform = `rotate(${rotation}deg)`;
    confetti.style.zIndex = '1000';
    confetti.style.pointerEvents = 'none';
    
    // Animation
    confetti.style.transition = `transform ${animationDuration}s linear, opacity ${animationDuration}s ease-out`;
    
    container.appendChild(confetti);
    
    // Trigger reflow
    setTimeout(() => {
      confetti.style.transform = `translateY(${window.innerHeight + 20}px) rotate(${rotation + 360}deg)`;
      confetti.style.opacity = '0';
    }, 10);
    
    // Remove after animation
    setTimeout(() => {
      if (container.contains(confetti)) {
        container.removeChild(confetti);
      }
    }, animationDuration * 1000);
  };
  
  useEffect(() => {
    if (isActive) {
      // Create initial burst of confetti
      for (let i = 0; i < 50; i++) {
        setTimeout(createConfetti, i * 100);
      }
      
      // Continue with lighter confetti rain
      confettiInterval.current = setInterval(() => {
        if (Math.random() > 0.5) createConfetti();
      }, 300);
      
      // Stop after duration
      const timeout = setTimeout(() => {
        if (confettiInterval.current) {
          clearInterval(confettiInterval.current);
        }
      }, duration);
      
      return () => {
        clearInterval(confettiInterval.current);
        clearTimeout(timeout);
      };
    }
  }, [isActive, duration]);
  
  return (
    <div 
      ref={containerRef} 
      className="confetti-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden'
      }} 
    />
  );
};

export default Confetti;
