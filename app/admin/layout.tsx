import { cookies } from 'next/headers';
import ClientCookieCleaner from './components/ClientCookieCleaner';
import ClientLayout from './components/ClientLayout';
import LoginForm from './components/LoginForm';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = cookies().has('auth_token');

  if (!isAuthenticated) {
    return (
      <>
        <ClientCookieCleaner />
        <LoginForm />
      </>
    );
  }

  return <ClientLayout>{children}</ClientLayout>;
} 