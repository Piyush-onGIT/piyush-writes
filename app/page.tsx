import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { ProfileCard } from "@/components/ProfileCard";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
        {/* Main Content (Left) */}
        <main className="flex-1 space-y-12">
          <header className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-accent">
                PIYUSH WRITES HERE
              </p>
              <h1 className="text-4xl font-black text-white sm:text-6xl lg:text-7xl leading-tight tracking-tighter">
                A minimal blog that <span className="text-accent underline decoration-accent/30 underline-offset-8">lives in your repo.</span>
              </h1>
            </div>
            {/* <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
              Posts are just Markdown files in <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm text-accent">content/blogs</code>.
              Click any card to read the full entry. More features can layer on
              later without changing the source of truth.
            </p> */}
            {/* <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_10px_rgba(124,247,228,0.5)]" />
                Next.js 16 · File backed
              </span>
            </div> */}
          </header>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
            {posts.length === 0 && (
              <div className="card glass col-span-full p-12 text-center text-slate-400 border-dashed">
                <p className="text-lg">No posts yet.</p>
                <p className="mt-2 text-sm italic text-slate-500">
                  Drop a <code>*.md</code> file into <code>content/blogs</code> to get started.
                </p>
              </div>
            )}
          </section>
        </main>

        {/* Sidebar (Right) */}
        <aside className="w-full lg:w-[350px] lg:shrink-0 lg:sticky lg:top-12">
          <ProfileCard />
        </aside>
      </div>
    </div>
  );
}
