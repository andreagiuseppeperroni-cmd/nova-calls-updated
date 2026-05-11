import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Square',
  description: 'Il social delle piazze, delle stanze e dei momenti locali.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        {children}

        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />

        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "faab59fe-2bcc-4ea1-93e2-6b0c940c7240",
                safari_web_id: "web.onesignal.auto.012c2ba4-f65b-47d9-b245-c87f55979016",
                notifyButton: {
                  enable: true
                },
                serviceWorkerPath: "OneSignalSDKWorker.js",
                serviceWorkerUpdaterPath: "OneSignalSDKUpdaterWorker.js"
              });
            });
          `}
        </Script>
      </body>
    </html>
  );
}
