"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Share2,
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Flashcard {
  slideNumber: number;
  imageName: string;
  type: "title" | "front" | "back";
  cardType?: "image" | "text";
  text?: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  thumbnailId?: string;
  standard: string;
  subject: string;
  createdByName?: string;
  flashcardsData: Flashcard[];
}

// ── Card dimensions (matches PPT template: 4.5" × 10") ────────────────────────
const CARD_W = 260; // px
const CARD_H = Math.round(CARD_W / (4.5 / 10)); // ≈ 578 px
const FRONT_BORDER = "#5BA4CF";
const BACK_BORDER = "#4A90C4";
const CARD_FONT = "Georgia, 'Times New Roman', serif";

// ── Single flip-card ───────────────────────────────────────────────────────────
function FlipCard({ front, back }: { front: Flashcard; back: Flashcard }) {
  const [flipped, setFlipped] = useState(false);

  const frontSrc =
    front.cardType !== "text" && front.imageName
      ? `/uploads/${front.imageName}`
      : null;
  const backSrc =
    back.cardType !== "text" && back.imageName
      ? `/uploads/${back.imageName}`
      : null;

  return (
    <div
      className="relative cursor-pointer select-none mx-auto"
      style={{ width: CARD_W, height: CARD_H }}
      onClick={() => setFlipped((f) => !f)}
    >
      {/* FRONT */}
      <div
        className={`absolute inset-0 rounded-2xl overflow-hidden border-[5px] bg-white shadow-lg flex items-center justify-center p-5 transition-opacity duration-300 ${
          flipped ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{ borderColor: FRONT_BORDER }}
      >
        {frontSrc ? (
          <img
            src={frontSrc}
            alt="front"
            className="w-full h-full object-contain"
          />
        ) : (
          <p
            className="text-center leading-relaxed"
            style={{ fontFamily: CARD_FONT, fontSize: 16, color: "#1A1A1A" }}
          >
            {front.text}
          </p>
        )}

        {/* "Tap to reveal" hint */}
        <span
          className="absolute bottom-3 text-xs opacity-40"
          style={{ fontFamily: CARD_FONT }}
        >
          tap to reveal answer ↓
        </span>
      </div>

      {/* BACK */}
      <div
        className={`absolute inset-0 rounded-2xl overflow-hidden border-[5px] bg-blue-50 shadow-lg flex items-center justify-center p-5 transition-opacity duration-300 ${
          flipped ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ borderColor: BACK_BORDER }}
      >
        {backSrc ? (
          <img
            src={backSrc}
            alt="back"
            className="w-full h-full object-contain"
          />
        ) : (
          <p
            className="text-center leading-relaxed"
            style={{ fontFamily: CARD_FONT, fontSize: 16, color: "#1A1A1A" }}
          >
            {back.text}
          </p>
        )}

        <span
          className="absolute bottom-3 text-xs opacity-40"
          style={{ fontFamily: CARD_FONT }}
        >
          tap to see question ↑
        </span>
      </div>
    </div>
  );
}

// ── Study mode (single-card swipe) ────────────────────────────────────────────
function StudyMode({
  pairs,
}: {
  pairs: { front: Flashcard; back: Flashcard }[];
}) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(pairs.length - 1, i + 1));

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-muted-foreground">
        Card {index + 1} of {pairs.length}
      </p>

      {/* progress bar */}
      <div className="w-full max-w-sm h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / pairs.length) * 100}%` }}
        />
      </div>

      <FlipCard
        key={index}
        front={pairs[index].front}
        back={pairs[index].back}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          disabled={index === 0}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIndex(0)}
          className="text-muted-foreground"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Restart
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={next}
          disabled={index === pairs.length - 1}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// ── Grid mode (all cards) ─────────────────────────────────────────────────────
function GridMode({
  pairs,
}: {
  pairs: { front: Flashcard; back: Flashcard }[];
}) {
  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {pairs.map((p, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground mb-1">#{i + 1}</span>
          <FlipCard front={p.front} back={p.back} />
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicFlashcardPage() {
  const params = useParams();
  const standard = decodeURIComponent(params.standard as string);
  const subject = decodeURIComponent(params.subject as string);
  const title = decodeURIComponent(params.title as string);

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"study" | "grid">("study");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/flashcard/public?standard=${encodeURIComponent(standard)}&subject=${encodeURIComponent(subject)}&title=${encodeURIComponent(title)}`,
        );
        if (res.status === 404) {
          setSet(null);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setSet(data);
      } catch {
        toast.error("Failed to load flashcard set");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [standard, subject, title]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // ── loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── not found ──
  if (!set) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
          <BookOpen className="h-10 w-10 text-primary/40" />
        </div>
        <h1 className="text-2xl font-bold">Flashcard Set Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          This set doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
      </div>
    );
  }

  // Build card pairs from flashcardsData
  const cards: Flashcard[] = Array.isArray(set.flashcardsData)
    ? set.flashcardsData
    : [];
  const pairs = cards
    .filter((c) => c.type === "front")
    .map((front) => ({
      front,
      back: cards.find(
        (c) => c.type === "back" && c.slideNumber === front.slideNumber + 1,
      )!,
    }))
    .filter((p) => p.back);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <Toaster position="top-center" />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate">
                {set.title}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {set.standard}
                </Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {set.subject}
                </Badge>
                {set.createdByName && (
                  <span className="text-xs text-muted-foreground">
                    by {set.createdByName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mode toggle */}
            <div className="flex rounded-lg border overflow-hidden text-sm">
              <button
                className={`px-3 py-1.5 transition-colors ${mode === "study" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setMode("study")}
              >
                Study
              </button>
              <button
                className={`px-3 py-1.5 transition-colors ${mode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setMode("grid")}
              >
                All
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              title="Copy link"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Description ── */}
      {set.description && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <Card className="border-0 bg-muted/40">
            <CardContent className="py-3 px-4">
              <p className="text-sm text-muted-foreground">{set.description}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Cards ── */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {pairs.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No cards in this set yet.</p>
          </div>
        ) : mode === "study" ? (
          <StudyMode pairs={pairs} />
        ) : (
          <GridMode pairs={pairs} />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-muted-foreground border-t mt-8">
        {pairs.length} card{pairs.length !== 1 ? "s" : ""} &nbsp;·&nbsp;
        EasyLearning
      </footer>
    </div>
  );
}
