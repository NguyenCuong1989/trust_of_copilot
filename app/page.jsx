'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function getBotUsername() {
  return process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'bot';
}

async function logEvent(eventType, referralCode) {
  await fetch('/api/affiliate/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType,
      referralCode,
      source: 'web-mini-app',
      payload: window.location.search,
    }),
  });
}

export default function ReferralLandingPage() {
  const searchParams = useSearchParams();
  const referralCode = useMemo(() => searchParams.get('ref') || searchParams.get('start') || 'ref', [searchParams]);
  const [status, setStatus] = useState('');
  const botUsername = getBotUsername();
  const telegramUrl = 'https://t.me/' + botUsername + '?start=' + encodeURIComponent(referralCode);

  const handleOpenTelegram = async () => {
    setStatus('Logging click...');
    try {
      await logEvent('click', referralCode);
      setStatus('Opening Telegram...');
    } catch {
      setStatus('Opening Telegram...');
    } finally {
      window.location.href = telegramUrl;
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
      <section style={{ width: 'min(720px, 100%)', background: 'linear-gradient(180deg, #121a33 0%, #0e1326 100%)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}>
        <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7dd3fc', marginTop: 0 }}>Telegram Stars Affiliate</p>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.05, margin: '0 0 16px' }}>Invite, track, and reward referrals in one flow.</h1>
        <p style={{ fontSize: '1.05rem', color: '#cbd5e1', maxWidth: 600 }}>
          Every click, referral, and reward is logged through the system log pipeline before it reaches affiliate tracking.
        </p>

        <div style={{ display: 'grid', gap: 12, marginTop: 28, padding: 20, borderRadius: 18, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.14)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: '#94a3b8' }}>Referral code</span>
            <strong style={{ fontSize: '1.1rem' }}>{referralCode}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: '#94a3b8' }}>Bot deep link</span>
            <code style={{ color: '#bae6fd' }}>{telegramUrl}</code>
          </div>
          <button
            type="button"
            onClick={handleOpenTelegram}
            style={{ marginTop: 8, border: 'none', borderRadius: 14, padding: '14px 18px', cursor: 'pointer', fontWeight: 700, background: '#22c55e', color: '#07210f' }}
          >
            Open Telegram and log the click
          </button>
          <p style={{ minHeight: 24, margin: 0, color: '#93c5fd' }}>{status}</p>
        </div>
      </section>
    </main>
  );
}

