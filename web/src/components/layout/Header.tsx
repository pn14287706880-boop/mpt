import Link from "next/link";

import { logoutAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="site-header">
      <Link className="site-logo" href="/">
        MPT
      </Link>
      <nav className="site-nav">
        {user ? (
          <>
            <span className="site-user">{user.email}</span>
            <form action={logoutAction}>
              <button className="site-link" type="submit">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link className="site-link" href="/login">
              Log in
            </Link>
            <Link className="site-link primary" href="/signup">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
