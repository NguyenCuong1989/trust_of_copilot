export const metadata = {
  title: 'Telegram Stars Affiliate',
  description: 'Affiliate landing page for Telegram Stars referrals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#0b1020', color: '#e5eefc' }}>
        {children}
      </body>
    </html>
  );
}

