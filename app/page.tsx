import Link from "next/link";
import PlayerView from "@/components/PlayerView";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎲</span>
            <div>
              <h1 className="font-black text-zinc-100 leading-none">ForzaDice</h1>
              <p className="text-xs text-zinc-500">Forza Motorsport 2023</p>
            </div>
          </div>
          <Link
            href="/admin"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Admin →
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <PlayerView />
      </div>

      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-700">
        ForzaDice — private lobby tool
      </footer>
    </main>
  );
}
