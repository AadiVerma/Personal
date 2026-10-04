"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { DREAM_CATEGORIES, type Dream, type DreamCategory } from "@/lib/dream-types";
import playerPhoto from "@/public/profile.png";
import sagittariusArt from "@/public/constellation/sagittarius.jpg";

/* ───────────────────────── Content ───────────────────────── */

/** The creed, revealed one line at a time. `vow` lines are set large in gold. */
const CREED: { text: string; vow?: boolean }[] = [
  { text: "Every dynasty begins with one person who refused to stay small." },
  { text: "Mine began on a rooftop, beneath a sky too vast to ignore." },
  { text: "There, a boy made the stars a single promise:" },
  { text: "I will build a life worth inheriting.", vow: true },
  { text: "No inheritance. No map. No one coming to open the door." },
  { text: "Only resolve, and the patience to keep knocking." },
  { text: "This ledger is the record of that promise." },
  { text: "What is gold is done. What is not, is merely not yet.", vow: true },
];

const DREAM_EMOJIS = ["✨", "🚀", "🌍", "💎", "🏡", "🏔️", "🌌", "🔥", "💖", "👑", "🧘", "🏃", "📚", "🎓", "✈️", "🏝️", "🚗", "🎸", "🌸", "🦋", "🌙", "☀️", "💰", "🏆"];

/**
 * Sagittarius "Teapot" asterism, from real star positions (RA/Dec projected,
 * east on the left as on a sky chart). r roughly tracks brightness.
 */
const SAGITTARIUS = {
  stars: {
    tau: { x: 8, y: 37, r: 1.4, name: "Tau" },
    zeta: { x: 16, y: 54, r: 1.9, name: "Ascella" },
    sigma: { x: 28, y: 25, r: 2.3, name: "Nunki" },
    phi: { x: 44, y: 31, r: 1.5, name: "Phi" },
    lambda: { x: 73, y: 18, r: 1.9, name: "Kaus Borealis" },
    epsilon: { x: 80, y: 90, r: 2.6, name: "Kaus Australis" },
    delta: { x: 85, y: 53, r: 1.9, name: "Kaus Media" },
    gamma: { x: 110, y: 58, r: 1.7, name: "Alnasl" },
  },
  lines: [
    ["delta", "epsilon"], ["epsilon", "zeta"], ["zeta", "phi"], ["phi", "delta"], // body
    ["delta", "lambda"], ["lambda", "phi"], // lid
    ["delta", "gamma"], ["gamma", "epsilon"], // spout
    ["phi", "sigma"], ["sigma", "tau"], ["tau", "zeta"], // handle
  ],
} as const;

const TOAST_STYLE = {
  borderRadius: 0,
  background: "#0e0d0b",
  color: "#f3ead7",
  border: "1px solid rgba(201, 169, 97, 0.55)",
  fontFamily: "var(--font-serif)",
  fontSize: "1.05rem",
  fontStyle: "italic",
};

type Filter = "all" | "open" | "realised";

/* ───────────────────────── Helpers ───────────────────────── */

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function slugId(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "ambition";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function toRoman(n: number) {
  if (!Number.isFinite(n) || n <= 0 || n >= 4000) return String(n);
  const table: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
  return out;
}

const yearRoman = (y?: string) => (y && /^\d{4}$/.test(y) ? toRoman(Number(y)) : y);

/* ───────────────────────── Ambient ───────────────────────── */

/** Slow, warm motes of gold dust drifting upward. */
function GoldDust() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = prefersReducedMotion();
    let w = 0, h = 0, raf = 0;
    let motes: { x: number; y: number; r: number; v: number; p: number; a: number }[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      motes = Array.from({ length: Math.round((w * h) / 14000) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        v: Math.random() * 0.25 + 0.05,
        p: Math.random() * Math.PI * 2,
        a: Math.random() * 0.5 + 0.2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.p += 0.01;
        m.y -= m.v;
        m.x += Math.sin(m.p) * 0.15;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3);
        g.addColorStop(0, `rgba(240, 214, 150, ${m.a * (0.6 + Math.sin(m.p * 3) * 0.4)})`);
        g.addColorStop(1, "rgba(240, 214, 150, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="lx-dust" aria-hidden />;
}

/** Hairline — diamond — hairline. */
function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`lx-ornament ${className}`} aria-hidden>
      <span className="lx-rule" />
      <svg viewBox="0 0 24 24" className="size-3.5"><path d="M12 2 L14.5 12 L12 22 L9.5 12 Z" fill="currentColor" /></svg>
      <span className="lx-rule" />
    </div>
  );
}

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`lx-eyebrow ${className}`}>{children}</p>;
}

/** Art-deco sunburst: rays fanning from a point, drawn as hairlines. */
function Sunburst({ className = "" }: { className?: string }) {
  const rays = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
      {rays.map((deg) => (
        <line key={deg} x1="0" y1="0" x2="0" y2={deg % 15 === 0 ? -100 : -82} transform={`rotate(${deg})`} className={deg % 15 === 0 ? "lx-ray lx-ray-long" : "lx-ray"} />
      ))}
      <circle r="34" className="lx-ring" />
      <circle r="38" className="lx-ring lx-ring-thin" />
      <circle r="58" className="lx-ring lx-ring-thin" />
    </svg>
  );
}

/** Monogram crest: a letter inside double rings with a laurel of dots. */
function Crest({ letter, className = "" }: { letter: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <circle cx="60" cy="60" r="56" className="lx-crest-ring" />
      <circle cx="60" cy="60" r="50" className="lx-crest-ring lx-crest-thin" />
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2;
        return <circle key={i} cx={(60 + Math.cos(a) * 53).toFixed(2)} cy={(60 + Math.sin(a) * 53).toFixed(2)} r="0.9" className="lx-crest-dot" />;
      })}
      <text x="60" y="60" textAnchor="middle" dominantBaseline="central" className="lx-crest-letter">{letter}</text>
    </svg>
  );
}

function SagittariusChart({ className = "" }: { className?: string }) {
  const st = SAGITTARIUS.stars;
  return (
    <svg viewBox="-6 4 130 100" className={className} aria-hidden>
      {SAGITTARIUS.lines.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={st[a].x} y1={st[a].y} x2={st[b].x} y2={st[b].y} className="lx-chart-line" pathLength={1} />
      ))}
      {Object.entries(st).map(([k, s]) => (
        <g key={k} className="lx-chart-star">
          <circle cx={s.x} cy={s.y} r={s.r * 2.4} className="lx-chart-halo" />
          <circle cx={s.x} cy={s.y} r={s.r * 0.9} className="lx-chart-core" />
          <text x={s.x + s.r + 2} y={s.y - s.r - 1.5} className="lx-chart-name">{s.name}</text>
        </g>
      ))}
    </svg>
  );
}

/** Fades its child up once it scrolls into view (CSS-driven, survives re-renders). */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lx-reveal ${shown ? "lx-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function goldBurst(el: HTMLElement) {
  if (prefersReducedMotion()) return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 28; i++) {
    const s = document.createElement("span");
    s.className = "lx-fleck";
    const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.4;
    const dist = 60 + Math.random() * 130;
    s.style.left = `${cx}px`;
    s.style.top = `${cy}px`;
    s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    s.style.setProperty("--dy", `${Math.sin(angle) * dist - 30}px`);
    s.style.setProperty("--rot", `${Math.random() * 360}deg`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1500);
  }
}

/* ───────────────────────── Ledger ───────────────────────── */

function LedgerEntry({
  dream, index, onToggle, onEdit, onDelete,
}: {
  dream: Dream;
  index: number;
  onToggle: (d: Dream, el: HTMLElement) => void;
  onEdit: (d: Dream) => void;
  onDelete: (d: Dream) => void;
}) {
  const cat = DREAM_CATEGORIES[dream.category] ?? DREAM_CATEGORIES.legacy;
  return (
    <Reveal>
      <article id={`entry-${dream.id}`} className={`lx-entry ${dream.manifested ? "lx-entry-done" : ""}`}>
        <span className="lx-entry-no">№ {toRoman(index + 1)}</span>

        <div className="lx-entry-main">
          <div className="flex items-start gap-4">
            <span className="lx-medallion" aria-hidden>{dream.emoji}</span>
            <div className="min-w-0">
              <h3 className="lx-entry-title">{dream.title}</h3>
              {dream.note && <p className="lx-entry-note">{dream.note}</p>}
              <p className="lx-entry-meta">
                {cat.label}
                {dream.targetYear && !dream.manifested && <> · By {yearRoman(dream.targetYear)}</>}
              </p>
            </div>
          </div>
        </div>

        <div className="lx-entry-side">
          {dream.manifested ? (
            <div className="lx-realised">
              <span className="lx-seal-mini" aria-hidden>✦</span>
              <div>
                <p className="lx-realised-label">Realised</p>
                <p className="lx-realised-date">{formatDate(dream.manifestedOn)}</p>
              </div>
            </div>
          ) : (
            <button type="button" onClick={(e) => onToggle(dream, e.currentTarget)} className="lx-btn">
              Seal as realised
            </button>
          )}
          <div className="lx-entry-actions">
            {dream.manifested && (
              <button type="button" onClick={(e) => onToggle(dream, e.currentTarget)}>Reopen</button>
            )}
            <button type="button" onClick={() => onEdit(dream)}>Amend</button>
            <button type="button" onClick={() => onDelete(dream)}>Strike</button>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

type Draft = Pick<Dream, "title" | "note" | "emoji" | "category" | "targetYear">;

function AmbitionLetter({ initial, onClose, onSave }: { initial: Dream | null; onClose: () => void; onSave: (d: Draft) => void }) {
  const [draft, setDraft] = useState<Draft>({
    title: initial?.title ?? "",
    note: initial?.note ?? "",
    emoji: initial?.emoji ?? "✨",
    category: initial?.category ?? "career",
    targetYear: initial?.targetYear ?? "",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="lx-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()} data-lenis-prevent>
      <form
        className="lx-letter"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.title.trim()) onSave(draft);
        }}
      >
        <button type="button" className="lx-letter-close" onClick={onClose} aria-label="Close">×</button>
        <p className="lx-letter-eyebrow">{initial ? "An amendment" : "By private hand"}</p>
        <h2 className="lx-letter-title">{initial ? "Amend the Ambition" : "A New Ambition"}</h2>
        <p className="lx-letter-sub">Inscribe it as though it has already come to pass.</p>

        <label className="lx-label">The ambition</label>
        <input autoFocus className="lx-input lx-input-lg" placeholder="Stand atop Kilimanjaro at dawn" value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={200} />

        <label className="lx-label">Why it matters</label>
        <textarea className="lx-input min-h-[72px] resize-y" placeholder="How it will feel when it is done…" value={draft.note} onChange={(e) => set("note", e.target.value)} maxLength={1000} />

        <label className="lx-label">Emblem</label>
        <div className="flex flex-wrap gap-1.5">
          {DREAM_EMOJIS.map((em) => (
            <button key={em} type="button" onClick={() => set("emoji", em)} className={`lx-emblem ${draft.emoji === em ? "lx-emblem-on" : ""}`}>{em}</button>
          ))}
          <input className="lx-input !w-14 text-center" value={draft.emoji} onChange={(e) => set("emoji", e.target.value)} aria-label="Custom emoji" maxLength={16} />
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          <div>
            <label className="lx-label">Domain</label>
            <select className="lx-input" value={draft.category} onChange={(e) => set("category", e.target.value as DreamCategory)}>
              {Object.entries(DREAM_CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="lx-label">By the year</label>
            <input className="lx-input" placeholder="2030" inputMode="numeric" value={draft.targetYear} onChange={(e) => set("targetYear", e.target.value)} maxLength={12} />
          </div>
        </div>

        <button type="submit" className="lx-btn lx-btn-solid mt-8 w-full" disabled={!draft.title.trim()}>
          {initial ? "Record the amendment" : "Enter it into the ledger"}
        </button>
      </form>
    </div>
  );
}

function SealCeremony({ dream, onDone }: { dream: Dream; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="lx-ceremony" onClick={onDone} role="status">
      <div className="lx-wax" aria-hidden><span>✦</span></div>
      <p className="lx-ceremony-label">Realised</p>
      <p className="lx-ceremony-title">{dream.title}</p>
      <p className="lx-ceremony-date">Sealed on {formatDate(today())}</p>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export function ConstellationSky({
  initialDreams, playerName, className = "",
}: {
  initialDreams: Dream[];
  playerName: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const key = searchParams.get("key") ?? "";
  const rootRef = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [dreams, setDreams] = useState<Dream[]>(initialDreams);
  const [filter, setFilter] = useState<Filter>("all");
  const [domain, setDomain] = useState<DreamCategory | "all">("all");
  const [editing, setEditing] = useState<Dream | null | "new">(null);
  const [sealing, setSealing] = useState<Dream | null>(null);

  const done = dreams.filter((d) => d.manifested);
  const pct = dreams.length ? Math.round((done.length / dreams.length) * 100) : 0;
  const thisYear = new Date().getFullYear();

  const domains = useMemo(
    () => (Object.keys(DREAM_CATEGORIES) as DreamCategory[]).filter((c) => dreams.some((d) => d.category === c)),
    [dreams]
  );

  const visible = useMemo(
    () => dreams
      .filter((d) => filter === "all" || (filter === "realised") === d.manifested)
      .filter((d) => domain === "all" || d.category === domain)
      .sort((a, b) => Number(a.manifested) - Number(b.manifested)
        || (b.manifestedOn ?? "").localeCompare(a.manifestedOn ?? "")
        || (a.targetYear ?? "9999").localeCompare(b.targetYear ?? "9999")),
    [dreams, filter, domain]
  );

  const years = useMemo(() => {
    const map = new Map<string, Dream[]>();
    for (const d of dreams) {
      const y = d.manifested ? d.manifestedOn?.slice(0, 4) : d.targetYear;
      const k = y && /^\d{4}$/.test(y) ? y : "Someday";
      map.set(k, [...(map.get(k) ?? []), d]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a === "Someday" ? 1 : b === "Someday" ? -1 : a.localeCompare(b)));
  }, [dreams]);

  /* ── Smooth scroll + scroll-driven choreography ── */
  useIsoLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const root = rootRef.current;
    root?.classList.add("lx-cinematic");

    const ctx = gsap.context(() => {
      // Opening.
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".lx-hero-sun", { scale: 0.6, opacity: 0, rotate: -40, duration: 2.6, ease: "power2.out" })
        .from(".lx-hero-crest", { opacity: 0, scale: 0.8, duration: 1.4 }, 0.3)
        .from(".lx-hero .lx-eyebrow", { opacity: 0, y: 14, letterSpacing: "0.9em", duration: 1.6 }, 0.6)
        .from(".lx-hero-title", { clipPath: "inset(0 50% 0 50%)", letterSpacing: "0.45em", opacity: 0, duration: 2 }, 0.8)
        .from(".lx-hero .lx-rule", { scaleX: 0, duration: 1.4, ease: "power2.inOut" }, 1.5)
        .from(".lx-hero-tag, .lx-hero-est, .lx-hero-enter", { opacity: 0, y: 20, stagger: 0.2, duration: 1.2 }, 1.8)
        .from(".lx-nav", { opacity: 0, y: -20, duration: 1 }, 2.1);

      // Hero recedes like a curtain.
      gsap.timeline({ scrollTrigger: { trigger: ".lx-hero", start: "top top", end: "bottom top", scrub: true } })
        .to(".lx-hero-sun", { scale: 1.6, rotate: 30, opacity: 0.15 }, 0)
        .to(".lx-hero-inner", { y: -120, opacity: 0 }, 0);

      // Hairlines draw themselves.
      gsap.utils.toArray<HTMLElement>(".lx-section .lx-rule").forEach((el) => {
        gsap.from(el, { scaleX: 0, duration: 1.4, ease: "power2.inOut", scrollTrigger: { trigger: el, start: "top 90%" } });
      });

      // Static copy rises gently.
      gsap.utils.toArray<HTMLElement>(".lx-rise").forEach((el) => {
        gsap.from(el, { y: 40, opacity: 0, filter: "blur(6px)", duration: 1.3, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      // The founder's portrait unveils from the centre, then drifts.
      gsap.fromTo(".lx-portrait-frame", { clipPath: "inset(50% 0% 50% 0%)" }, {
        clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut",
        scrollTrigger: { trigger: ".lx-founder", start: "top 80%", end: "top 25%", scrub: 1 },
      });
      gsap.fromTo(".lx-portrait-img", { scale: 1.35 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ".lx-founder", start: "top bottom", end: "bottom top", scrub: true },
      });
      gsap.from(".lx-stat-num", {
        textContent: 0, snap: { textContent: 1 }, duration: 2, ease: "power2.out", stagger: 0.15,
        scrollTrigger: { trigger: ".lx-stats", start: "top 85%" },
      });

      // The creed: pinned, one line at a time.
      const lines = gsap.utils.toArray<HTMLElement>(".lx-creed-line");
      const creed = gsap.timeline({
        scrollTrigger: { trigger: ".lx-creed", start: "top top", end: `+=${lines.length * 110}%`, pin: true, scrub: 1 },
      });
      gsap.set(lines.slice(1), { opacity: 0, y: 50, filter: "blur(10px)" });
      lines.forEach((line, i) => {
        // The first line is already on stage when the section pins.
        if (i > 0) creed.to(line, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 });
        if (i < lines.length - 1) creed.to(line, { opacity: 0, y: -50, filter: "blur(10px)", duration: 1 }, "+=1.6");
      });
      creed.from(".lx-creed-sign", { opacity: 0, y: 20, duration: 1 }, "-=0.3");
      creed.to(".lx-creed-progress span", { scaleX: 1, ease: "none", duration: creed.duration() }, 0);

      // The Archer: chart draws, art glides.
      gsap.fromTo(".lx-sign .lx-chart-line", { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, stagger: 0.12, duration: 1.1, ease: "power2.inOut",
        scrollTrigger: { trigger: ".lx-sign", start: "top 70%" },
      });
      gsap.from(".lx-sign .lx-chart-star", {
        opacity: 0, stagger: 0.1, duration: 1, scrollTrigger: { trigger: ".lx-sign", start: "top 70%" },
      });
      gsap.fromTo(".lx-archer-img", { yPercent: -8, scale: 1.15 }, {
        yPercent: 8, scale: 1.05, ease: "none",
        scrollTrigger: { trigger: ".lx-sign", start: "top bottom", end: "bottom top", scrub: true },
      });

      // Years: the spine draws as you read.
      gsap.fromTo(".lx-years-spine", { scaleY: 0 }, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: ".lx-years", start: "top 70%", end: "bottom 70%", scrub: true },
      });

      // Motto.
      gsap.from(".lx-motto", {
        opacity: 0, letterSpacing: "0.6em", duration: 2.2, ease: "power3.out",
        scrollTrigger: { trigger: ".lx-finale", start: "top 75%" },
      });
    }, rootRef);

    return () => {
      ctx.revert();
      root?.classList.remove("lx-cinematic");
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Page height changes as entries are added or filtered; keep pins honest.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [visible.length, dreams.length, years.length]);

  const scrollTo = (target: string) => {
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 2 });
    else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };

  /* ── Persistence ── */
  const persist = useCallback(async (next: Dream[], success?: string) => {
    const prev = dreams;
    setDreams(next);
    try {
      const res = await fetch("/api/constellation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, dreams: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The ledger could not be saved.");
      if (success) toast(success, { icon: "✦", style: TOAST_STYLE });
    } catch (e) {
      setDreams(prev);
      toast.error(e instanceof Error ? e.message : "The ledger could not be saved.", { style: TOAST_STYLE });
    }
  }, [dreams, key]);

  const toggle = (d: Dream, el: HTMLElement) => {
    const nowDone = !d.manifested;
    const next = dreams.map((x) => (x.id === d.id ? { ...x, manifested: nowDone, manifestedOn: nowDone ? today() : undefined } : x));
    if (nowDone) {
      goldBurst(el);
      setSealing(d);
      persist(next);
    } else {
      persist(next, "Reopened. Some things are worth doing twice.");
    }
  };

  const save = (draft: Draft) => {
    const clean = { ...draft, title: draft.title.trim(), note: draft.note?.trim() || undefined, targetYear: draft.targetYear?.trim() || undefined };
    if (editing && editing !== "new") {
      persist(dreams.map((x) => (x.id === editing.id ? { ...x, ...clean } : x)), "The amendment has been recorded.");
    } else {
      persist([...dreams, { id: slugId(clean.title), manifested: false, createdAt: today(), ...clean }], "Entered into the ledger.");
      setFilter("open");
    }
    setEditing(null);
  };

  const remove = (d: Dream) => {
    if (!confirm(`Strike "${d.title}" from the ledger?`)) return;
    persist(dreams.filter((x) => x.id !== d.id), "Struck from the ledger.");
  };

  const jumpTo = (id: string) => {
    setFilter("all");
    setDomain("all");
    requestAnimationFrame(() => {
      const el = document.getElementById(`entry-${id}`);
      if (!el) return;
      if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -window.innerHeight / 3, duration: 1.6 });
      else el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("lx-entry-flash");
      setTimeout(() => el.classList.remove("lx-entry-flash"), 2000);
    });
  };

  const endSeal = useCallback(() => setSealing(null), []);
  const initial = playerName.charAt(0).toUpperCase();

  return (
    <main ref={rootRef} className={`lx-root ${className}`}>
      <div className="lx-grain" aria-hidden />
      <GoldDust />

      <nav className="lx-nav">
        <Link href="/" className="lx-nav-link">← Return</Link>
        <button type="button" onClick={() => scrollTo("#ledger")} className="lx-nav-mark" aria-label="Go to the ledger">
          <Crest letter={initial} className="size-9" />
        </button>
        <button type="button" onClick={() => setEditing("new")} className="lx-nav-link lx-nav-cta">Inscribe</button>
      </nav>

      {/* ── I. Frontispiece ── */}
      <section className="lx-hero">
        <Sunburst className="lx-hero-sun" />
        <div className="lx-hero-inner">
          <Crest letter={initial} className="lx-hero-crest" />
          <Eyebrow className="mt-8">The Private Anthology of {playerName}</Eyebrow>
          <h1 className="lx-hero-title">Constellation</h1>
          <Ornament className="mx-auto mt-6 w-[min(420px,80vw)]" />
          <p className="lx-hero-tag">A ledger of ambitions, kept in gold.</p>
          <p className="lx-hero-est">Est. {toRoman(thisYear)} · Volume I · Under the sign of the Archer</p>
          <button type="button" onClick={() => scrollTo("#founder")} className="lx-hero-enter">
            <span>Enter</span>
            <span className="lx-hero-enter-line" aria-hidden />
          </button>
        </div>
      </section>

      <div className="relative z-10">
        {/* ── II. The Founder ── */}
        <section id="founder" className="lx-section lx-founder mx-auto grid max-w-6xl items-center gap-14 px-5 py-28 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-20 md:px-8 md:py-36">
          <div className="lx-portrait">
            <div className="lx-portrait-frame">
              <Image src={playerPhoto} alt={playerName} placeholder="blur" sizes="(min-width: 768px) 440px, 90vw" className="lx-portrait-img" />
            </div>
            <div className="lx-portrait-border" aria-hidden />
            <p className="lx-portrait-caption">{playerName}, the founder · ♐&#xFE0E; Sagittarius</p>
          </div>

          <div>
            <Eyebrow className="lx-rise">Chapter I · The Founder</Eyebrow>
            <h2 className="lx-h2 lx-rise mt-4">A life, <em>deliberately</em> built.</h2>
            <Ornament className="mt-6 w-48" />
            <p className="lx-body lx-rise mt-6">
              Some inherit their fortune. Others draft it, line by line, in a ledger no one else will ever read.
              What follows is mine: every ambition I have set my name to, and every one I have kept.
            </p>
            <p className="lx-signature lx-rise mt-6">{playerName}</p>

            <div className="lx-stats lx-rise mt-12 grid grid-cols-3">
              {[
                { n: dreams.length, l: "Ambitions" },
                { n: done.length, l: "Realised" },
                { n: pct, l: "Per cent fulfilled" },
              ].map((s) => (
                <div key={s.l} className="lx-stat">
                  <p className="lx-stat-num">{s.n}</p>
                  <p className="lx-stat-label">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── III. The Creed (pinned) ── */}
        <section className="lx-section lx-creed">
          <Sunburst className="lx-creed-sun" />
          <div className="lx-creed-inner">
            <Eyebrow>Chapter II · The Creed</Eyebrow>
            <div className="lx-creed-stage">
              {CREED.map((line, i) => (
                <p key={i} className={`lx-creed-line ${line.vow ? "lx-creed-vow" : ""}`}>{line.text}</p>
              ))}
            </div>
            <p className="lx-creed-sign">— {playerName}</p>
            <div className="lx-creed-progress" aria-hidden><span /></div>
          </div>
        </section>

        {/* ── IV. The Archer ── */}
        <section className="lx-section lx-sign mx-auto grid max-w-6xl items-center gap-14 px-5 py-28 md:grid-cols-2 md:gap-20 md:px-8 md:py-36">
          <div className="lx-archer">
            <div className="lx-archer-frame">
              <Image src={sagittariusArt} alt="Sagittarius: a golden archer on a rearing horse, drawing his bow" placeholder="blur" sizes="(min-width: 768px) 520px, 90vw" className="lx-archer-img" />
            </div>
          </div>
          <div>
            <Eyebrow className="lx-rise">Chapter III · Under the Archer</Eyebrow>
            <h2 className="lx-h2 lx-rise mt-4">Sagittarius</h2>
            <p className="lx-sub lx-rise mt-2">The Archer · Fire · Ruled by Jupiter, planet of fortune</p>
            <Ornament className="mt-6 w-48" />
            <p className="lx-body lx-rise mt-6">
              Born beneath the sign that always aims higher. At the heart of the Archer lies the very centre of our galaxy:
              a fitting place to draw a bow from.
            </p>
            <SagittariusChart className="lx-chart mt-10" />
          </div>
        </section>

        {/* ── V. The Ledger ── */}
        <section id="ledger" className="lx-section mx-auto max-w-5xl scroll-mt-24 px-5 py-24 md:px-8">
          <div className="text-center">
            <Eyebrow className="lx-rise">Chapter IV · The Ledger</Eyebrow>
            <h2 className="lx-h2 lx-rise mt-4">The Ambitions</h2>
            <Ornament className="mx-auto mt-6 w-60" />
          </div>

          <div className="mt-12 flex flex-col items-center gap-5">
            <div className="lx-tabs">
              {([
                ["all", "All"],
                ["open", `In motion · ${dreams.length - done.length}`],
                ["realised", `Realised · ${done.length}`],
              ] as [Filter, string][]).map(([f, label]) => (
                <button key={f} type="button" onClick={() => setFilter(f)} className={`lx-tab ${filter === f ? "lx-tab-on" : ""}`}>{label}</button>
              ))}
            </div>
            {domains.length > 1 && (
              <div className="lx-domains">
                <button type="button" onClick={() => setDomain("all")} className={domain === "all" ? "lx-domain-on" : ""}>Every domain</button>
                {domains.map((c) => (
                  <button key={c} type="button" onClick={() => setDomain(c)} className={domain === c ? "lx-domain-on" : ""}>{DREAM_CATEGORIES[c].label}</button>
                ))}
              </div>
            )}
          </div>

          <div className="lx-ledger mt-12">
            {visible.map((d, i) => (
              <LedgerEntry key={d.id} dream={d} index={i} onToggle={toggle} onEdit={setEditing} onDelete={remove} />
            ))}
            {visible.length === 0 && (
              <p className="lx-empty">{filter === "realised" ? "The first seal is still warm in the drawer. Soon." : "No entries here yet."}</p>
            )}
          </div>

          <div className="mt-12 text-center">
            <button type="button" onClick={() => setEditing("new")} className="lx-btn lx-btn-solid">Inscribe a new ambition</button>
          </div>
        </section>

        {/* ── VI. The Years ── */}
        {years.length > 0 && (
          <section className="lx-section lx-years mx-auto max-w-4xl px-5 py-24 md:px-8">
            <div className="text-center">
              <Eyebrow className="lx-rise">Chapter V · The Years</Eyebrow>
              <h2 className="lx-h2 lx-rise mt-4">In Due Course</h2>
              <Ornament className="mx-auto mt-6 w-60" />
            </div>
            <div className="lx-years-list mt-16">
              <span className="lx-years-spine" aria-hidden />
              {years.map(([year, items], i) => {
                const past = year !== "Someday" && Number(year) <= thisYear && items.every((d) => d.manifested);
                return (
                  <Reveal key={year} className={`lx-year ${i % 2 ? "lx-year-right" : ""} ${past ? "lx-year-past" : ""}`}>
                    <span className="lx-year-node" aria-hidden />
                    <p className="lx-year-roman">{year === "Someday" ? "In time" : toRoman(Number(year))}</p>
                    <p className="lx-year-arabic">{year === "Someday" ? "Undated" : year}{year === String(thisYear) ? " · The present" : ""}</p>
                    <ul className="mt-3 space-y-1.5">
                      {items.map((d) => (
                        <li key={d.id}>
                          <button type="button" onClick={() => jumpTo(d.id)} className={`lx-year-item ${d.manifested ? "lx-year-item-done" : ""}`}>
                            {d.manifested ? "✦ " : ""}{d.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        {/* ── VII. Finale ── */}
        <section className="lx-section lx-finale px-5 pb-16 pt-28 text-center md:pt-36">
          <Crest letter={initial} className="mx-auto size-24" />
          <p className="lx-motto mt-10">Per aspera ad astra</p>
          <p className="lx-sub mt-3">Through hardship, to the stars.</p>
          <Ornament className="mx-auto mt-10 w-60" />
          <p className="lx-colophon mt-10">
            Kept by {playerName} · Est. {toRoman(thisYear)}
            <br />
            Sagittarius illustration by{" "}
            <a href="https://pixabay.com/illustrations/sagittarius-zodiac-centaur-8817507/" target="_blank" rel="noreferrer">love4music1972 / Pixabay</a>
          </p>
        </section>
      </div>

      {editing && <AmbitionLetter initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save} />}
      {sealing && <SealCeremony dream={sealing} onDone={endSeal} />}
    </main>
  );
}
