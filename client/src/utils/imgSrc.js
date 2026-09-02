const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function imgSrc(img) {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  return `${API_BASE.replace(/\/api$/, '')}${img}`;
}

export function preloadImages(images, resolver = imgSrc) {
  images.forEach((img) => {
    const url = resolver(img);
    if (url) {
      const pre = new Image();
      pre.src = url;
    }
  });
}
