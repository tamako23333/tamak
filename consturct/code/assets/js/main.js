// Image lightbox for album pages
document.querySelectorAll('.album-images img').forEach(img => {
  img.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  });
});
