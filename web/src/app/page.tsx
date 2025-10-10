import styles from "./page.module.css";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="app-body">
      <Header />
      <main className={styles.main}>
        <h1>Hello World 5</h1>
        <p className={styles.subtitle}>
          Please sign in to get started.
        </p>
      </main>
    </div>
  );
}
