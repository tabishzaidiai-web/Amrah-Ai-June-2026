import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function DiagnosticDashboard() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/gemini-health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setStatus('ok');
        } else {
          setStatus('error');
          setMessage(data.message || 'Gemini API connection error');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error connecting to Gemini API');
      });
  }, []);

  if (status === 'ok') return null; // Silent if healthy

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-lg flex items-center gap-3">
      {status === 'checking' ? (
        <span className="text-xs">Checking API connectivity...</span>
      ) : (
        <>
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="text-xs">
            <p className="font-bold">API Connectivity Issue</p>
            <p>{message}</p>
          </div>
        </>
      )}
    </div>
  );
}
