import { useState, useEffect } from 'react';

declare global {
  interface Window {
    paypal?: any;
  }
}

export function usePayPal() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (window.paypal) {
      setIsReady(true);
      return;
    }

    const scriptId = 'paypal-sdk';
    if (document.getElementById(scriptId)) {
      return;
    }

    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError(new Error("PayPal client ID missing in environment"));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=AUD&components=buttons`;
    script.async = true;

    script.onload = () => {
      setIsReady(true);
    };

    script.onerror = () => {
      setError(new Error("Failed to load PayPal SDK"));
    };

    document.body.appendChild(script);

    return () => {};
  }, []);

  return { isReady, error };
}
