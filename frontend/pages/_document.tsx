import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Using Georgia serif font as fallback - no external font loading needed */}
      </Head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
