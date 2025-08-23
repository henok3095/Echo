import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../api/supabase.js';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    let unsub = () => {};

    const finalize = async () => {
      try {
        // Handle potential error from provider
        const search = new URLSearchParams(location.search);
        const errorDesc = search.get('error_description');
        if (errorDesc) {
          console.error('OAuth error:', errorDesc);
          setMessage('Sign-in failed. Redirecting…');
          setTimeout(() => navigate('/'), 500);
          return;
        }

        // If using PKCE, a `code` param will be present. Exchange it for a session.
        const code = search.get('code');
        if (code) {
          setMessage('Exchanging code…');
          const { data: exData, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            console.error('Code exchange failed:', exErr);
            setMessage('Sign-in failed. Redirecting…');
            setTimeout(() => navigate('/'), 600);
            return;
          }
        }

        // Ensure session is loaded
        const { data } = await supabase.auth.getSession();
        const hasSession = !!data?.session;
        setTimeout(() => {
          navigate(hasSession ? '/dashboard' : '/');
        }, 200);
      } catch (_) {
        setMessage('Sign-in failed. Redirecting…');
        navigate('/');
      }
    };

    // Also listen for any state changes just in case
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });
    unsub = () => sub.subscription.unsubscribe();

    finalize();
    return () => unsub();
  }, [navigate, location.search]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center text-gray-700 dark:text-gray-200">
        <div className="animate-pulse mb-2">{message}</div>
        <div className="text-sm opacity-70">Please wait a moment</div>
      </div>
    </div>
  );
}
