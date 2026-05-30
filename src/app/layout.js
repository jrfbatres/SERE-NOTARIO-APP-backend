import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './ThemeContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata = {
  title: 'Seré Notario Elite',
  description: 'Plataforma de estudio para notarios',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
