import Header from "@/components/layout/Header"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-body">
      <Header />
      {children}
    </div>
  )
}
