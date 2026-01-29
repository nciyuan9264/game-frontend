export const isTabletLandscape = window.matchMedia('(min-width: 768px) and (max-width: 1024px) and (orientation: landscape)').matches;

export const handleFullscreen = () => {
  const el = document.documentElement;
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if ((el as any).webkitRequestFullscreen) {
    (el as any).webkitRequestFullscreen(); // iOS Safari
  } else if ((el as any).msRequestFullscreen) {
    (el as any).msRequestFullscreen(); // IE
  }
};