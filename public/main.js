(() => {
  const logo = document.getElementById('secret-logo');
  const modal = document.getElementById('admin-modal');
  const closeBtn = document.getElementById('close-modal');

  if (!logo || !modal) return;

  let tapCount = 0;
  let timer;

  logo.addEventListener('click', (event) => {
    event.preventDefault();
    tapCount += 1;

    clearTimeout(timer);
    timer = setTimeout(() => {
      tapCount = 0;
    }, 1800);

    if (tapCount >= 5) {
      tapCount = 0;
      modal.hidden = false;
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.hidden = true;
    });
  }
})();
