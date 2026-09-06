/* Wischgesten fuer Karten – Pointer-Events, funktioniert mit Maus und Finger. */

export function attachSwipe(node, {
  onSwipe = () => {},
  onMove = () => {},
  onCancel = () => {},
  threshold = 90,
  allowUp = true,
  allowDown = false,
} = {}) {
  let startX = 0, startY = 0, dragging = false, pointerId = null;

  const down = (e) => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('button, a, input, textarea, select')) return;
    dragging = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    node.setPointerCapture?.(e.pointerId);
    node.style.transition = 'none';
  };

  const move = (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    node.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx / 22}deg)`;
    onMove({ dx, dy });
  };

  const up = (e) => {
    if (!dragging || (pointerId !== null && e.pointerId !== pointerId)) return;
    dragging = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    node.style.transition = 'transform .25s ease';
    const horizontal = Math.abs(dx) > Math.abs(dy);

    let dir = null;
    if (horizontal && Math.abs(dx) > threshold) dir = dx > 0 ? 'right' : 'left';
    else if (!horizontal && allowUp && dy < -threshold) dir = 'up';
    else if (!horizontal && allowDown && dy > threshold) dir = 'down';

    if (dir) {
      const flyX = dir === 'right' ? innerWidth : dir === 'left' ? -innerWidth : dx;
      const flyY = dir === 'up' ? -innerHeight : dir === 'down' ? innerHeight : dy;
      node.style.transform = `translate(${flyX}px, ${flyY}px) rotate(${flyX / 22}deg)`;
      onSwipe(dir);
    } else {
      node.style.transform = '';
      onMove({ dx: 0, dy: 0 });
      onCancel();
    }
  };

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);

  return () => {
    node.removeEventListener('pointerdown', down);
    node.removeEventListener('pointermove', move);
    node.removeEventListener('pointerup', up);
    node.removeEventListener('pointercancel', up);
  };
}

export const resetCard = (node) => { node.style.transition = 'none'; node.style.transform = ''; };
