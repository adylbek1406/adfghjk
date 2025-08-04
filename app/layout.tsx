import './globals.css';
import { Inter } from 'next/font/google';
import { LanguageProvider } from './contexts/LanguageContext';
import { getServerLanguage } from './utils/serverLanguage';
import FloatingCart from './components/FloatingCart';
import Header from './components/Header';
import CategoriesHeader from './components/CategoriesHeader';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = getServerLanguage();
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <html lang={initialLanguage}>
      <body className={inter.className}>
        <LanguageProvider initialLanguage={initialLanguage}>
          {!isAdminPage && (
            <>
              <Header />
              <CategoriesHeader />
            </>
          )}
          {children}
          {!isAdminPage && <FloatingCart />}
        </LanguageProvider>
      </body>
    </html>
  );
} 