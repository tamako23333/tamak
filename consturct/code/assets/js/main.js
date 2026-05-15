// Image lightbox for album pages
document.querySelectorAll('.album-images img').forEach(function(img) {
  img.addEventListener('click', function() {
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<img src="' + img.src + '" alt="' + img.alt + '">';
    overlay.addEventListener('click', function() { overlay.remove(); });
    document.body.appendChild(overlay);
  });
});
