export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <a href="/" className="font-semibold text-sm">BoardFoot</a>
        <a href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</a>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
