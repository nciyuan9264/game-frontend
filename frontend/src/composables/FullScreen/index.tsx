import React, { useEffect } from 'react';

const FullscreenButton = () => {
    const handleFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen(); // iOS Safari
    } else if ((el as any).msRequestFullscreen) {
      (el as any).msRequestFullscreen(); // IE
    }
  };

  useEffect(() => {
    handleFullscreen();
  }, []);

  return (
    <button onClick={handleFullscreen} style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '10px 14px',
      fontSize: '14px',
      borderRadius: '8px',
      backgroundColor: '#1890ff',
      color: '#fff',
      border: 'none',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      zIndex: 9999
    }}>
      全屏
    </button>
  );
};

export default FullscreenButton;
