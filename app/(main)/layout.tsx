import { Sidebar } from '@/components/nav/sidebar';
import { Header } from '@/components/nav/header';
import { MobileNav } from '@/components/nav/mobile-nav';
import { MobileHeader } from '@/components/nav/mobile-header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-light">
      {/* Pink side accent bar */}
      <div className="side-accent hidden md:block" />

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-[320px_1fr] border border-dark m-4 max-w-[1600px] mx-auto" style={{ minHeight: 'calc(100dvh - 2rem)' }}>
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <main className="flex-1 overflow-auto bg-light">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col min-h-dvh">
        <MobileHeader />
        <main className="flex-1 overflow-auto bg-beige pb-20">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
