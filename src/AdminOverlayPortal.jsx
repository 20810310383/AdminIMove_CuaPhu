import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Mount each Admin popup immediately beneath <body> so that a scrolling,
// transformed or overflow-hidden dashboard panel can never clip it.
let activeModalCount = 0;

export default function AdminOverlayPortal({ children }) {
  useEffect(() => {
    activeModalCount += 1;
    document.body.classList.add('imove-has-modal-v22');
    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) document.body.classList.remove('imove-has-modal-v22');
    };
  }, []);

  if (typeof document === 'undefined' || !React.isValidElement(children)) return null;
  // Preserve the existing backdrop's close handlers and child React events.
  const className = [children.props.className, 'imove-portal-overlay-v22'].filter(Boolean).join(' ');
  return createPortal(React.cloneElement(children, { className }), document.body);
}
