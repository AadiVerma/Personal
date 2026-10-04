import { notFound } from "next/navigation";
import { Cinzel, Cormorant_Garamond, Pinyon_Script } from "next/font/google";
import { getDreams } from "@/lib/dreams";
import { RESUME_DATA } from "@/data/resume-data";
import { ConstellationSky } from "./constellation-sky";
import "./constellation.css";

const display = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script" });

export const metadata = {
  title: "Constellation",
  description: "A private ledger of ambitions, kept in gold.",
  robots: "noindex, nofollow",
};

type Props = { searchParams: Promise<{ key?: string }> };

export default async function ConstellationPage({ searchParams }: Props) {
  const { key } = await searchParams;
  const secret = process.env.BLOG_SECRET;

  if (!secret || key !== secret) {
    notFound();
  }

  return (
    <ConstellationSky
      className={`${display.variable} ${serif.variable} ${script.variable}`}
      initialDreams={getDreams()}
      playerName={RESUME_DATA.name.split(" ")[0]}
    />
  );
}
