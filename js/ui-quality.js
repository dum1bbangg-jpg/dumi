// Keyboard activation for the existing click cards, without changing routing.
document.addEventListener('keydown', event => {
  if(event.key !== 'Enter' && event.key !== ' ') return;
  const target = event.target.closest('[role="button"][tabindex="0"]');
  if(!target || target.closest('[hidden]')) return;
  event.preventDefault();
  target.click();
});
