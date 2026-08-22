import React, { useEffect } from 'react';

/**
 * Session expiry is intentionally handled as a silent security boundary.
 * The user should never be trapped behind a modal or stale protected UI.
 */
export const SessionExpiredModal = ({ isOpen }) => {
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    // Remove the protected page from browser history so Back does not reopen it.
    window.location.replace('/');
  }, [isOpen]);

  return null;
};

export default SessionExpiredModal;
