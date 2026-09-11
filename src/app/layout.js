// Root layout for the Next.js App Router application.
// Wires the ported Navbar + Footer (Story 1.9) around every page and imports the ported
// CSS so the migrated app carries the existing Conduit look.

import "./index.css";
import "./styles.css";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

export const metadata = {
  title: "Conduit",
  description: "A place to share your knowledge.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Navbar is an async Server Component (reads the session). */}
        {/* @ts-expect-error Async Server Component */}
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
