import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientProviders } from "@/client-providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CarbonLink - Web3 Carbon Credit Platform",
  description: "Revolutionizing Carbon Credit Verification Through Blockchain & AI",
  generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
} 