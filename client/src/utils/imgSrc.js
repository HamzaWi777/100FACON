const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function imgSrc(img, { width } = {}) {
  if (!img) return '';
  const url = img.startsWith('http') ? img : `${API_BASE.replace(/\/api$/, '')}${img}`;
  if (!width || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
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
