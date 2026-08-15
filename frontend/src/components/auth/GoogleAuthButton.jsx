import React, { useEffect, useRef, useState } from 'react';

// Module-level singleton to ensure GIS is initialized exactly ONCE across app lifecycle
let gsiInitializedClientId = null;
let activeSuccessCallback = null;

export const GoogleAuthButton = ({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false,
  className = '',
}) => {
  const containerRef = useRef(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [gsiError, setGsiError] = useState(null);

  // Keep the active callback reference updated without re-initializing GIS
  useEffect(() => {
    activeSuccessCallback = onSuccess;
  }, [onSuccess]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    let checkInterval = null;
    let isMounted = true;

    const initGsi = () => {
      if (!isMounted) return;

      if (!googleClientId) {
        setGsiError('MISSING_CLIENT_ID');
        return;
      }

      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);

        try {
          // Initialize once per clientId
          if (gsiInitializedClientId !== googleClientId) {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: (response) => {
                if (response?.credential && activeSuccessCallback) {
                  activeSuccessCallback(response.credential);
                } else if (onError) {
                  onError(new Error('No Google credential returned in response'));
                }
              },
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            gsiInitializedClientId = googleClientId;
          }

          // Render button into container
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(containerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 320,
              text: text === 'signup_with' ? 'signup_with' : 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
        } catch (err) {
          console.warn('[Google Auth] GIS render warning:', err);
          setGsiError('RENDER_FAILED');
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGsi();
        } else if (attempts > 20) {
          clearInterval(checkInterval);
          if (isMounted) setGsiError('GSI_SCRIPT_UNAVAILABLE');
        }
      }, 200);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [googleClientId, text]);

  // If GIS is not loaded or missing Client ID, render a graceful fallback button
  const handleFallbackClick = () => {
    if (!googleClientId) {
      if (onError) {
        onError(
          new Error(
            'Google Sign-In is currently disabled because VITE_GOOGLE_CLIENT_ID is not configured. Please sign in using your email and password.'
          )
        );
      }
      return;
    }

    // Attempt interactive prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          if (onError) {
            onError(
              new Error(
                'Google One-Tap is not supported or origin http://localhost:5173 is not authorized on Google Cloud Console.'
              )
            );
          }
        }
      });
    } else if (onError) {
      onError(new Error('Google Identity Services script is still loading. Please try again.'));
    }
  };

  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      {/* Official GIS Button Container */}
      <div
        ref={containerRef}
        className="w-full flex justify-center min-h-[40px]"
        style={{ display: gsiError ? 'none' : 'flex' }}
      />

      {/* Fallback Button if GIS container failed to render or Client ID is unconfigured */}
      {gsiError && (
        <button
          type="button"
          disabled={disabled}
          onClick={handleFallbackClick}
          className="w-full max-w-[320px] py-2 px-4 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{text === 'signup_with' ? 'Sign up with Google' : 'Continue with Google'}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleAuthButton;
