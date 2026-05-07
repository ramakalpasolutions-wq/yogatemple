'use client';
import { SessionProvider as NextSessionProvider } from 'next-auth/react';

export default function SessionProvider({ children }) {
  return <NextSessionProvider>{children}</NextSessionProvider>;
}
