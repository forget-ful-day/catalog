(() => {
  const logo = document.getElementById('secret-logo');
  const modal = document.getElementById('admin-modal');
  const closeBtn = document.getElementById('close-modal');

  if (!logo || !modal) return;

  let tapCount = 0;
  let timer;

  logo.addEventListener('click', (event) => {
    tapCount += 1;

    clearTimeout(timer);
    timer = setTimeout(() => {
      tapCount = 0;
    }, 1800);

    if (tapCount >= 5) {
      event.preventDefault();
      tapCount = 0;
      modal.hidden = false;
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.hidden = true;
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.hidden = true;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      modal.hidden = true;
    }
  });
})();
