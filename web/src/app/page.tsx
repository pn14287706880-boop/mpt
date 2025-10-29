import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import Image from "next/image";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="app-body">
      <Header />
      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">MedPage Today</h1>
            <p className="hero-subtitle">
              Your comprehensive platform for managing medical content, 
              analytics, and data-driven insights.
            </p>
            <div className="hero-actions">
              <Link href="/login" className="hero-button primary">
                Get Started
              </Link>
              <Link href="/signup" className="hero-button secondary">
                Sign Up
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <Image
              src="/mpt-hero-light.png"
              alt="MedPage Today Platform"
              width={600}
              height={400}
              priority
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
