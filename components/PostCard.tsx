import Link from "next/link";
import { PostMeta } from "@/lib/posts";

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="glass group relative block overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:shadow-[0_0_80px_rgba(124,247,228,0.1)] hover:-translate-y-2 hover:border-accent/40"
    >
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/5 blur-3xl transition-all duration-700 group-hover:bg-accent/10" />
      
      <div className="relative space-y-4">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-accent">
          <span className="relative h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgba(124,247,228,0.6)]">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-75" />
          </span>
          <span>{new Date(post.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
        </div>
        
        <h3 className="text-2xl font-black text-white leading-tight group-hover:text-accent transition-colors duration-300 tracking-tight">
          {post.title}
        </h3>
        
        <p className="text-base text-slate-400 leading-relaxed font-light line-clamp-3">
          {post.description}
        </p>
        
        <div className="flex items-center gap-2 pt-2 text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-accent group-hover:gap-4 transition-all duration-300">
          Read Story 
          <span className="text-lg">→</span>
        </div>
      </div>
    </Link>
  );
}
