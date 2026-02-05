import Image from "next/image";
import { ReactNode } from "react";
import { Github, Linkedin, Twitter, Mail, X, TwitterIcon } from "lucide-react";import me from "@/public/me.jpeg";
type Props = {
  children?: ReactNode;
};

const socialLinks = [
  { label: "GitHub", href: "https://github.com/Piyush-onGIT", icon: Github },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/piyush-in/", icon: Linkedin },
  { label: "X", href: "https://x.com/piyushh_2510", icon: TwitterIcon },
  { label: "Mail", href: "mailto:thisissahupiyush@gmail.com", icon: Mail },
];

export function ProfileCard({ children }: Props) {
  return (
    <aside className="glass group relative overflow-hidden rounded-3xl p-8 sm:p-10 transition-all duration-500 hover:shadow-[0_0_80px_rgba(124,247,228,0.15)] w-full">
      {/* Decorative background element */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/5 blur-[80px] transition-all duration-700 group-hover:bg-accent/10" />
      
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 shrink-0">
            <div className="absolute inset-0 animate-pulse rounded-2xl bg-accent/20 blur-md transition-all duration-500 group-hover:bg-accent/40" />
            <div className="relative h-full w-full overflow-hidden rounded-2xl border-2 border-white/10 bg-black shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:border-accent/50">
              <Image
                src={me}
                alt="Profile picture"
                fill
                sizes="120px"
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div>
            {/* <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">
              DEVELOPER
            </p> */}
            <h2 className="mt-1 text-2xl font-black text-white tracking-tight">Piyush Kumar</h2>
            <p className="text-sm font-medium text-slate-400">Engineer | Builder | Reader | SWE@Cisco</p>
          </div>
        </div>

        <p className="text-base text-slate-300 leading-relaxed font-light">
          I read what I love, and as I contemplate, I write to learn more about it.
        </p>

        <div className="flex flex-wrap gap-3">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-200 transition-all duration-300 hover:bg-accent hover:text-black hover:border-accent hover:shadow-[0_0_20px_rgba(124,247,228,0.4)] hover:-translate-y-1"
                title={link.label}
              >
                <Icon size={16} strokeWidth={2.5} className="opacity-70 group-hover:opacity-100" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>

        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>
    </aside>
  );
}
