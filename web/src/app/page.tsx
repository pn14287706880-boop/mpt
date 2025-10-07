import styles from "./page.module.css";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className={styles.main}>
      <h1>Hello World</h1>
      <p className={styles.subtitle}>
        {user ? `Welcome back, ${user.email}` : "Please sign in to get started."}
      </p>
    </main>
  );
}
