'use client';

import LoginForm from '@/app/components/LoginForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin');
  };

  return <LoginForm onSuccess={handleSuccess} />;
} 