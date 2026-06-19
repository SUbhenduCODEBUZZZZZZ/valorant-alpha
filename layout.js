import './globals.css';

export const metadata = {
  title: 'VALORANT • Agent Encyclopedia',
  description: 'A cinematic, AAA-quality interactive Valorant agent encyclopedia featuring all 26 agents with lore, abilities, and immersive presentation. Built by Alpha Man.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white overflow-hidden">{children}</body>
    </html>
  );
}
