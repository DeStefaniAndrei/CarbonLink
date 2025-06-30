"use client"

import React from "react"
import { ThemeProvider } from "@/theme-provider"
import { Header } from "@/layout/header"
import { Web3Provider } from "@/providers/web3-provider"

export function ClientProviders({ children }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Web3Provider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>{children}</main>
        </div>
      </Web3Provider>
    </ThemeProvider>
  );
} 