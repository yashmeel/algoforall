import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
    title: 'Quant Portal',
    description: 'Institutional Full-Stack Quant Architecture',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
            <head>
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-G9D7LV8XYH"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-G9D7LV8XYH');
                    `}
                </Script>
            </head>
            <body className="font-sans antialiased text-slate-50">
                <main className="min-h-screen bg-slate-950 relative selection:bg-emerald-500/30">
                    {children}
                </main>
            </body>
        </html>
    )
}
