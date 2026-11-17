// Pita kepala halaman: hijau Kemenag dengan pola kisi bintang delapan seperti lengkung gerbang gedung BDK Makassar.
export default function SiteHeader({ children, wide = false }: { children?: React.ReactNode; wide?: boolean }) {
  return (
    <header className={`relative overflow-hidden bg-brand-800 text-white ${wide ? "pb-8" : "pb-20"}`}>
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="kisi" width="56" height="56" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="#e2b13c" strokeWidth="1">
              <rect x="14" y="14" width="28" height="28" />
              <rect x="14" y="14" width="28" height="28" transform="rotate(45 28 28)" />
              <circle cx="28" cy="28" r="5" />
              <path d="M0 0l8 8M56 0l-8 8M0 56l8-8M56 56l-8-8" />
            </g>
          </pattern>
          <linearGradient id="pudar" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.04" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.3" />
          </linearGradient>
          <mask id="topeng">
            <rect width="100%" height="100%" fill="url(#pudar)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#kisi)" mask="url(#topeng)" />
      </svg>
      <div className={`relative mx-auto px-4 pt-8 sm:pt-10 ${wide ? "max-w-2xl" : "max-w-xl"}`}>
        <a href="/" className="inline-flex items-center gap-3 rounded-md">
          <img src="/logo-kemenag.png" alt="Logo Kementerian Agama" width={45} height={40} className="h-10 w-auto" />
          <span className="leading-tight">
            <span className="block text-xs text-brand-100">Kementerian Agama Republik Indonesia</span>
            <span className="block text-sm font-bold">Balai Diklat Keagamaan Makassar</span>
          </span>
        </a>
        <div className="mt-8">{children}</div>
      </div>
    </header>
  );
}
