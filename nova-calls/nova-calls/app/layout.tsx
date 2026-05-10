import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Square — Il social che risolve momenti',
  description: 'Apri uno Spunto, entra nella piazza, genera un Outcome.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />

        <Script
          id="onesignal-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "faab59fe-2bcc-4ea1-93e2-6b0c940c7240",
                  safari_web_id: "web.onesignal.auto.012c2ba4-f65b-47d9-b245-c87f55979016",
                  notifyButton: {
                    enable: true,
                  },
                });
              });
            `,
          }}
        />

        {children}
      </body>
    </html>
  );
}
