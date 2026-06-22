import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Renders Google's own "Sign in with Google" button via the Google Identity
// Services script (loaded in index.html). Quietly renders nothing if no
// client ID is configured, so local dev without Google set up still works.
export default function GoogleSignInButton({ onSuccess }) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;
    let attempts = 0;

    // The GSI script loads async; poll briefly until window.google is available.
    const check = () => {
      if (cancelled) return;
      if (window.google?.accounts?.id) {
        setScriptReady(true);
        return;
      }
      if (attempts++ < 40) setTimeout(check, 100);
    };
    check();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        try {
          await loginWithGoogle(response.credential);
          toast.success('Signed in with Google');
          onSuccess?.();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Google sign-in failed');
        }
      }
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      width: 320
    });
  }, [scriptReady, loginWithGoogle, onSuccess]);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-sand-dark" />
        <span className="text-xs text-ink/40 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-sand-dark" />
      </div>
      <div ref={buttonRef} className="flex justify-center" />
    </div>
  );
}
