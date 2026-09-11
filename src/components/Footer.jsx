// Footer (ported from frontend/src/components/Footer). react-router Link -> next/link.

import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <Link href="/" className="logo-font">
          conduit helix aire test
        </Link>
      </div>
    </footer>
  );
}
