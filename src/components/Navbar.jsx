// Navbar (ported from frontend/src/components/Navbar). Server Component — reads the
// session server-side and renders auth-conditional links (no client AuthContext).

import Link from "next/link";
import { getServerSession } from "../lib/session.js";

export default async function Navbar() {
  const user = await getServerSession();

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link href="/" className="navbar-brand">
          conduit helix aire test
        </Link>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <Link href="/" className="nav-link">
              Home
            </Link>
          </li>
          {user ? (
            <>
              <li className="nav-item">
                <Link href="/editor" className="nav-link">
                  New Article
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/settings" className="nav-link">
                  Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link href={`/profile/${user.username}`} className="nav-link">
                  {user.username}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link href="/login" className="nav-link">
                  Sign in
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/register" className="nav-link">
                  Sign up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
