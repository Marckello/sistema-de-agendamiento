import { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'error-callback'?: () => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
        size?: 'normal' | 'compact';
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

// Track if script is loading globally to prevent duplicate loads
let isScriptLoading = false;
let isScriptLoaded = false;
const pendingCallbacks: (() => void)[] = [];

function loadTurnstileScript(callback: () => void) {
  // If already loaded, call callback immediately
  if (isScriptLoaded && window.turnstile) {
    callback();
    return;
  }

  // Add to pending callbacks
  pendingCallbacks.push(callback);

  // If already loading, just wait
  if (isScriptLoading) {
    return;
  }

  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
  if (existingScript) {
    // Script exists but might not be loaded yet
    if (window.turnstile) {
      isScriptLoaded = true;
      pendingCallbacks.forEach(cb => cb());
      pendingCallbacks.length = 0;
    } else {
      // Wait for it to load
      window.onTurnstileLoad = () => {
        isScriptLoaded = true;
        pendingCallbacks.forEach(cb => cb());
        pendingCallbacks.length = 0;
      };
    }
    return;
  }

  // Start loading
  isScriptLoading = true;

  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
  script.async = true;

  window.onTurnstileLoad = () => {
    isScriptLoading = false;
    isScriptLoaded = true;
    pendingCallbacks.forEach(cb => cb());
    pendingCallbacks.length = 0;
  };

  script.onerror = () => {
    isScriptLoading = false;
    console.error('Failed to load Turnstile script');
  };

  document.head.appendChild(script);
}

export default function Turnstile({ siteKey, onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const isRenderedRef = useRef(false);
  
  // Store callbacks in refs to avoid dependency changes
  const onVerifyRef = useRef(onVerify);
  const onErrorRef = useRef(onError);
  const onExpireRef = useRef(onExpire);
  
  // Update refs when props change
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;
  }, [onVerify, onError, onExpire]);

  useEffect(() => {
    // Prevent double rendering
    if (isRenderedRef.current) return;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || isRenderedRef.current) return;

      // Clean up any existing widget
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore
        }
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerifyRef.current(token),
          'error-callback': () => onErrorRef.current?.(),
          'expired-callback': () => onExpireRef.current?.(),
          theme: 'dark',
          size: 'normal',
        });
        isRenderedRef.current = true;
      } catch (e) {
        console.error('Error rendering Turnstile:', e);
      }
    };

    loadTurnstileScript(renderWidget);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignore
        }
      }
      widgetIdRef.current = null;
      isRenderedRef.current = false;
    };
  }, [siteKey]); // Only depend on siteKey

  return (
    <div ref={containerRef} className="flex justify-center my-4" />
  );
}
