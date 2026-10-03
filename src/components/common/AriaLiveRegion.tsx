import React from 'react';

interface AriaLiveRegionProps {
  message: string;
}

/**
 * Screen-reader live region. Announces calculation results dynamically
 * for users relying on assistive technologies (NVDA, TalkBack, VoiceOver).
 */
export const AriaLiveRegion: React.FC<AriaLiveRegionProps> = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
