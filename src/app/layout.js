// Root layout for the Next.js App Router application (Story 1.1, REQ-F-01).
// Minimal bootable shell — the real navbar/footer/pages arrive in later stories
// (Home in Story 1.7, shared components in Story 1.9).

export const metadata = {
  title: "Conduit",
  description: "A place to share your knowledge.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
