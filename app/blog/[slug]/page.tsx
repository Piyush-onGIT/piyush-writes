import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, markdownToHtml, getAllPosts } from "@/lib/posts";
import { ProfileCard } from "@/components/ProfileCard";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: encodeURIComponent(post.slug),
  }));
}

// export const dynamicParams = false;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  console.log(slug);
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) {
    return notFound();
  }

  const html = await markdownToHtml(post.content);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
        {/* Main Content (Left) */}
        <main className="flex-1 max-w-4xl">
          <div className="space-y-8">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
              <Link href="/" className="group flex items-center gap-2 text-accent transition hover:text-white">
                <span className="inline-block transform transition-transform group-hover:-translate-x-1">←</span>
                <span className="text-xs uppercase tracking-[0.3em]">Back Home</span>
              </Link>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <time className="text-slate-500">{new Date(post.meta.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</time>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white sm:text-6xl tracking-tighter leading-tight">
                {post.meta.title}
              </h1>
              <p className="text-xl text-slate-400 font-light leading-relaxed">
                {post.meta.description}
              </p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-accent/50 via-accent/5 to-transparent" />

            <article
              className="prose prose-invert prose-lg max-w-none 
                prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-white
                prose-a:text-accent prose-a:no-underline hover:prose-a:underline
                prose-code:text-accent prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl
                prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </main>

        {/* Sidebar (Right) */}
        <aside className="w-full lg:w-[350px] lg:shrink-0 lg:sticky lg:top-12">
          <ProfileCard>
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Reading now</p>
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "Liked this? Share a thought or reach out—new ideas keep the posts flowing."
              </p>
            </div>
          </ProfileCard>
        </aside>
      </div>
    </div>
  );
}
