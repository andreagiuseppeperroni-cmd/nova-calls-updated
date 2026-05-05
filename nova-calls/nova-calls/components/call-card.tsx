import Link from 'next/link';

type CallCardProps = {
  title: string;
  description: string;
  type: string;
  pulse: number;
  slug?: string;
  index?: number;
};

export function CallCard({
  title,
  description,
  type,
  pulse,
  slug = '#',
  index = 0,
}: CallCardProps) {
  const gradients = [
    'from-cyan-300 via-violet-400 to-pink-400',
    'from-lime-300 via-cyan-300 to-blue-400',
    'from-pink-300 via-rose-400 to-violet-500',
  ];

  return (
    <Link
      href={slug === '#' ? '#' : `/c/${slug}`}
      className="group block overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.07] p-4 shadow-[0_24px_90px_rgba(0,0,0,.24)] backdrop-blur-2xl transition duration-200 hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-white/[.11]"
    >
      <div className={`mb-5 h-36 rounded-[1.6rem] bg-gradient-to-br ${gradients[index % gradients.length]} p-4`}>
        <div className="flex h-full flex-col justify-between">
          <div className="flex justify-between gap-2">
            <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-black text-white backdrop-blur-xl">
              🔴 Live
            </span>

            <span className="rounded-full bg-slate-950/25 px-3 py-1 text-xs font-black text-white backdrop-blur-xl">
              Pulse {pulse}
            </span>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-white/75">
              {type}
            </p>
            <p className="mt-1 line-clamp-1 text-2xl font-black tracking-tight text-white">
              {title}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-xl font-black tracking-tight text-white group-hover:text-cyan-100">
            {title}
          </h3>

          <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-300">
            {description}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-nova-lime px-3 py-1 text-xs font-black text-slate-950">
          Entra
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs font-black text-slate-400">
        <span>Call + Echo</span>
        <span className="text-cyan-200 transition group-hover:translate-x-1">
          Apri →
        </span>
      </div>
    </Link>
  );
}
