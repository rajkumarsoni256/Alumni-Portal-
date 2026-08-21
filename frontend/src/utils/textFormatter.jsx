import React from 'react';

/**
 * Parses post/comment text and renders:
 * 1. Mentions (@Name or @username) highlighted in BOLD + RED
 * 2. Hashtags (#tag) highlighted as clickable or styled tags
 * 3. Preserves surrounding text, spaces, and line breaks safely
 * 
 * @param {string} text - Raw input string
 * @param {Function} [onTagClick] - Optional callback when a hashtag is clicked
 * @returns {React.ReactNode}
 */
export const renderFormattedContent = (text, onTagClick = null) => {
  if (!text || typeof text !== 'string') return null;

  // Regex to match @mentions (e.g. @Tokir Khan, @John Doe, @alumni_user) and #hashtags
  const tokenRegex = /(@[a-zA-Z0-9_]+(?:\s[a-zA-Z0-9_]+)?|#[a-zA-Z0-9_]+)/g;

  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('@')) {
      return (
        <span 
          key={index} 
          className="font-bold text-red-700 tracking-tight select-text inline"
        >
          {part}
        </span>
      );
    }

    if (part.startsWith('#')) {
      if (onTagClick) {
        return (
          <button
            key={index}
            type="button"
            onClick={() => onTagClick(part)}
            className="font-semibold text-red-700 hover:text-red-800 hover:underline cursor-pointer inline"
          >
            {part}
          </button>
        );
      }
      return (
        <span key={index} className="font-semibold text-red-700">
          {part}
        </span>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};
