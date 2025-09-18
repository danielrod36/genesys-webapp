import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import InitializeClient from '@/components/InitializeClient'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Genesys RPG Manager',
  description: 'Self‑hosted management tool for Genesys characters and game data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        {/* Initialize client-side helpers such as fetch header injection */}
        <InitializeClient />
        {children}
      </body>
    </html>
  )
}