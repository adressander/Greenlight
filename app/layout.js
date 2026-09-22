import { Baloo_2, Karla } from 'next/font/google';
import './globals.css';

const baloo2 = Baloo_2({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' });
const karla = Karla({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });

export const metadata = {
  title: 'Greenlight — Stay Green. Stay Rolling.',
  description: 'Track UCR, IFTA, IRP, insurance, and medical card deadlines for your trucks and get texted before you\'re at risk.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${baloo2.variable} ${karla.variable}`}>
      <body>{children}</body>
    </html>
  );
}
