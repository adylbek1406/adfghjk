import { cookies } from 'next/headers';

export const getServerLanguage = () => {
  const cookieStore = cookies();
  const languageCookie = cookieStore.get('preferred_language');
  return (languageCookie?.value as 'ru' | 'ky') || 'ru';
}; 