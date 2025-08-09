import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { DeploymentProvider } from '../contexts/DeploymentContext';
import { CreditIntelligenceProvider } from '../contexts/CreditIntelligenceContext';

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DeploymentProvider>
      <CreditIntelligenceProvider>
        <Component {...pageProps} />
      </CreditIntelligenceProvider>
    </DeploymentProvider>
  );
}