"use client";
import { useHeaderStore } from "@/store/header-store";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Clock,
  FlipHorizontal,
  Pencil,
  Plus,
  Trash2,
  Save,
  X,
  Upload,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Flashcard {
  slideNumber: number;
  imageName: string;
  type: "title" | "front" | "back";
  cardType?: "image" | "text";
  text?: string;
  /** transient – only set on newly added cards before save */
  _dataUrl?: string;
}

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  standard?: string;
  subject?: string;
  published?: boolean;
  createdAt?: string;
  flashcards: Flashcard[];
}

// ── PPT portrait card constants (mirrors generate-flashcard-ppt) ────────────
// Aspect ratio: W=4.5" / H=10.0" = 0.45
const CARD_ASPECT = 4.5 / 10; // width / height
const CARD_DISPLAY_WIDTH = 200; // px – rendered width in grid
const CARD_DISPLAY_HEIGHT = Math.round(CARD_DISPLAY_WIDTH / CARD_ASPECT); // ≈ 444 px

// ── Single Flip-Card ─────────────────────────────────────────────────────────
function FlashcardItem({
  front,
  back,
  editMode,
  onRemove,
}: {
  front: Flashcard;
  back: Flashcard;
  editMode: boolean;
  onRemove: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const frontSrc =
    front.cardType === "text"
      ? null
      : (front._dataUrl ??
        (front.imageName ? `/uploads/${front.imageName}` : null));

  const backSrc =
    back.cardType === "text"
      ? null
      : (back._dataUrl ??
        (back.imageName ? `/uploads/${back.imageName}` : null));

  return (
    <div className="relative" style={{ width: CARD_DISPLAY_WIDTH }}>
      {/* delete overlay */}
      {editMode && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 z-10 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:scale-110 transition-transform"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* portrait card */}
      <div
        className="cursor-pointer select-none"
        style={{ width: CARD_DISPLAY_WIDTH, height: CARD_DISPLAY_HEIGHT }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        {/* front face */}
        <div
          className={`absolute w-full h-full transition-opacity duration-300 rounded-xl overflow-hidden border-4 bg-white shadow-sm ${
            isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            borderColor: "#5BA4CF",
            width: CARD_DISPLAY_WIDTH,
            height: CARD_DISPLAY_HEIGHT,
          }}
        >
          {frontSrc ? (
            <img
              src={frontSrc}
              alt="Front"
              className="w-full h-full object-contain"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-4 text-center"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 13,
                color: "#1A1A1A",
              }}
            >
              {front.text}
            </div>
          )}
        </div>

        {/* back face */}
        <div
          className={`absolute w-full h-full transition-opacity duration-300 rounded-xl overflow-hidden border-4 bg-white shadow-sm ${
            isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{
            borderColor: "#4A90C4",
            width: CARD_DISPLAY_WIDTH,
            height: CARD_DISPLAY_HEIGHT,
          }}
        >
          {backSrc ? (
            <img
              src={backSrc}
              alt="Back"
              className="w-full h-full object-contain"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center p-4 text-center bg-blue-50"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 13,
                color: "#1A1A1A",
              }}
            >
              {back.text}
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-1">
        {isFlipped ? "Answer" : "Question"} &nbsp;·&nbsp; tap to flip
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FlashcardSetPage() {
  const { setTitle } = useHeaderStore();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [localCards, setLocalCards] = useState<Flashcard[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<number | null>(null); // slideNumber of front card to remove

  // add-card dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<"text" | "image" | "json">("text");

  // text-card form
  const [textFront, setTextFront] = useState("");
  const [textBack, setTextBack] = useState("");

  // image-card form
  const [imgFrontFile, setImgFrontFile] = useState<File | null>(null);
  const [imgFrontPreview, setImgFrontPreview] = useState<string | null>(null);
  const [imgBackFile, setImgBackFile] = useState<File | null>(null);
  const [imgBackPreview, setImgBackPreview] = useState<string | null>(null);

  // json-bulk form
  const [bulkJson, setBulkJson] = useState("");

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // ── fetch ──
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/flashcard/${id}`);
        if (!res.ok) throw new Error("Failed to fetch flashcard set");
        const data = await res.json();
        setFlashcardSet(data);
        setLocalCards(data.flashcards ?? []);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (flashcardSet) setTitle(`Flashcard: ${flashcardSet.title}`);
    return () => setTitle("Flashcards");
  }, [flashcardSet, setTitle]);

  // ── helpers ──
  const nextSlideNumber = () => {
    if (!localCards.length) return 1;
    return Math.max(...localCards.map((c) => c.slideNumber)) + 2; // +2 (front + back)
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(file);
    });

  // ── add cards ──
  const handleAddText = () => {
    if (!textFront.trim() || !textBack.trim()) {
      toast.error("Please fill in both front and back.");
      return;
    }
    const sn = nextSlideNumber();
    const newCards: Flashcard[] = [
      {
        slideNumber: sn,
        imageName: "",
        type: "front",
        cardType: "text",
        text: textFront.trim(),
      },
      {
        slideNumber: sn + 1,
        imageName: "",
        type: "back",
        cardType: "text",
        text: textBack.trim(),
      },
    ];
    setLocalCards((prev) => [...prev, ...newCards]);
    setTextFront("");
    setTextBack("");
    setAddOpen(false);
    toast.success("Text card added – save to persist.");
  };

  const handleAddImage = async () => {
    if (!imgFrontFile || !imgBackFile) {
      toast.error("Please select both front and back images.");
      return;
    }
    const sn = nextSlideNumber();
    const [frontUrl, backUrl] = await Promise.all([
      fileToDataUrl(imgFrontFile),
      fileToDataUrl(imgBackFile),
    ]);
    const newCards: Flashcard[] = [
      {
        slideNumber: sn,
        imageName: "",
        type: "front",
        cardType: "image",
        _dataUrl: frontUrl,
      },
      {
        slideNumber: sn + 1,
        imageName: "",
        type: "back",
        cardType: "image",
        _dataUrl: backUrl,
      },
    ];
    setLocalCards((prev) => [...prev, ...newCards]);
    setImgFrontFile(null);
    setImgFrontPreview(null);
    setImgBackFile(null);
    setImgBackPreview(null);
    setAddOpen(false);
    toast.success("Image card added – save to persist.");
  };

  const handleAddBulkJson = () => {
    try {
      const arr = JSON.parse(bulkJson);
      if (!Array.isArray(arr)) throw new Error("Expected a JSON array");
      let sn = nextSlideNumber();
      const newCards: Flashcard[] = [];
      for (const item of arr) {
        if (!item.front || !item.back)
          throw new Error("Each item needs 'front' and 'back' keys");
        newCards.push({
          slideNumber: sn,
          imageName: "",
          type: "front",
          cardType: "text",
          text: String(item.front),
        });
        newCards.push({
          slideNumber: sn + 1,
          imageName: "",
          type: "back",
          cardType: "text",
          text: String(item.back),
        });
        sn += 2;
      }
      setLocalCards((prev) => [...prev, ...newCards]);
      setBulkJson("");
      setAddOpen(false);
      toast.success(`${arr.length} card(s) added – save to persist.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  // ── remove cards ──
  const confirmRemove = (slideNumber: number) => setRemoveTarget(slideNumber);
  const doRemove = () => {
    if (removeTarget == null) return;
    setLocalCards((prev) =>
      prev.filter(
        (c) =>
          c.slideNumber !== removeTarget && c.slideNumber !== removeTarget + 1,
      ),
    );
    setRemoveTarget(null);
  };

  // ── save ──
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // cards that need image upload (have _dataUrl but no imageName)
      const toUpload = localCards.filter((c) => c._dataUrl && !c.imageName);
      const uploadedCards: Flashcard[] = await Promise.all(
        localCards.map(async (c) => {
          if (!c._dataUrl) return c;
          return { ...c }; // server-side save handled by PATCH action:"add"
        }),
      );

      // For cards with _dataUrl, let the server save them.
      // We use action:"replace" for text cards and action:"add" for new image cards.
      const existingCards = uploadedCards.filter((c) => !c._dataUrl);
      const newImageCards = toUpload;

      // 1. replace existing (text + already-saved image) cards
      const replaceRes = await fetch(`/api/flashcard/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "replace",
          flashcardsData: existingCards,
        }),
      });
      if (!replaceRes.ok) throw new Error("Failed to save cards");

      // 2. add new image cards (server saves to /public/uploads/)
      if (newImageCards.length) {
        const addRes = await fetch(`/api/flashcard/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            cards: newImageCards.map((c) => ({
              slideNumber: c.slideNumber,
              type: c.type,
              cardType: "image",
              dataUrl: c._dataUrl,
            })),
          }),
        });
        if (!addRes.ok) throw new Error("Failed to upload images");
        const addData = await addRes.json();
        setLocalCards(addData.flashcards ?? []);
      } else {
        const replaceData = await replaceRes.json();
        setLocalCards(replaceData.flashcards ?? []);
      }

      setEditMode(false);
      toast.success("Changes saved!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setLocalCards(flashcardSet?.flashcards ?? []);
    setEditMode(false);
  };

  // ── image picker helpers ──
  const pickImage = (
    file: File,
    setFile: (f: File) => void,
    setPreview: (s: string) => void,
  ) => {
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  // ── derived ──
  const frontCards = localCards.filter((c) => c.type === "front");
  const pairsCount = frontCards.length;

  // ── loading / not-found ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="h-12 w-12 text-primary/40" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Flashcard Set Not Found</h1>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          The flashcard set you are looking for does not exist.
        </p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // ── main render ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-background min-h-screen">
      <Toaster position="top-center" />

      {/* Remove confirm */}
      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove card pair?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the front and back card. The change is not
              applied until you save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doRemove}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Card dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Flashcard</DialogTitle>
          </DialogHeader>

          <Tabs
            value={addTab}
            onValueChange={(v) => setAddTab(v as "text" | "image" | "json")}
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="text">Text Card</TabsTrigger>
              <TabsTrigger value="image">Image Card</TabsTrigger>
              <TabsTrigger value="json">Bulk JSON</TabsTrigger>
            </TabsList>

            {/* ── TEXT TAB ── */}
            <TabsContent value="text" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {/* inputs */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="tf">Front (Question)</Label>
                    <Textarea
                      id="tf"
                      placeholder="e.g. What is photosynthesis?"
                      value={textFront}
                      onChange={(e) => setTextFront(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tb">Back (Answer)</Label>
                    <Textarea
                      id="tb"
                      placeholder="e.g. The process by which…"
                      value={textBack}
                      onChange={(e) => setTextBack(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* live preview */}
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    Preview (PPT scale)
                  </p>
                  <div className="flex gap-3">
                    {(["front", "back"] as const).map((side) => (
                      <div
                        key={side}
                        className="rounded-lg overflow-hidden border-4 flex items-center justify-center p-2 bg-white"
                        style={{
                          borderColor: side === "front" ? "#5BA4CF" : "#4A90C4",
                          width: 100,
                          height: Math.round(100 / CARD_ASPECT),
                          backgroundColor:
                            side === "back" ? "#EFF6FF" : "#FFFFFF",
                        }}
                      >
                        <p
                          className="text-center wrap-break-word"
                          style={{
                            fontFamily: "Georgia, serif",
                            fontSize: 9,
                            color: "#1A1A1A",
                          }}
                        >
                          {side === "front"
                            ? textFront || "Front…"
                            : textBack || "Back…"}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Card: 4.5″ × 10″ portrait
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleAddText}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Text Card
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── IMAGE TAB ── */}
            <TabsContent value="image" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {(["front", "back"] as const).map((side) => {
                  const preview =
                    side === "front" ? imgFrontPreview : imgBackPreview;
                  const inputRef =
                    side === "front" ? frontInputRef : backInputRef;
                  return (
                    <div key={side} className="space-y-2">
                      <Label>
                        {side === "front" ? "Front image" : "Back image"}
                      </Label>
                      <input
                        type="file"
                        accept="image/*"
                        ref={inputRef}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (side === "front")
                            pickImage(f, setImgFrontFile, setImgFrontPreview);
                          else pickImage(f, setImgBackFile, setImgBackPreview);
                        }}
                      />
                      <div
                        className="rounded-xl border-4 border-dashed flex items-center justify-center cursor-pointer overflow-hidden"
                        style={{
                          borderColor: side === "front" ? "#5BA4CF" : "#4A90C4",
                          width: "100%",
                          height: 240,
                        }}
                        onClick={() => inputRef.current?.click()}
                      >
                        {preview ? (
                          <img
                            src={preview}
                            alt={side}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="text-sm">Click to upload</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button onClick={handleAddImage}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Image Card
                </Button>
              </DialogFooter>
            </TabsContent>

            {/* ── JSON BULK TAB ── */}
            <TabsContent value="json" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste a JSON array of{" "}
                <code className="bg-muted px-1 rounded">
                  [{`{"front":"…","back":"…"}`}, …]
                </code>{" "}
                to add multiple text cards at once.
              </p>
              <Textarea
                placeholder={`[\n  {"front": "What is X?", "back": "X is …"},\n  {"front": "Define Y", "back": "Y means …"}\n]`}
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                className="min-h-[180px] font-mono text-sm"
              />
              <DialogFooter>
                <Button onClick={handleAddBulkJson}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add All Cards
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {flashcardSet.title}
            </h1>
            <p className="text-muted-foreground">{flashcardSet.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editMode ? (
            <>
              <Button
                variant="outline"
                onClick={handleDiscard}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Set Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {flashcardSet.thumbnail && (
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  <img
                    src={`/uploads/${flashcardSet.thumbnail}`}
                    alt={flashcardSet.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    className={
                      flashcardSet.published
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    }
                  >
                    {flashcardSet.published ? "Published" : "Draft"}
                  </Badge>
                </div>

                {flashcardSet.standard && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Standard</span>
                    <Badge variant="outline">{flashcardSet.standard}</Badge>
                  </div>
                )}

                {flashcardSet.subject && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Subject</span>
                    <Badge variant="outline">{flashcardSet.subject}</Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cards</span>
                  <span className="text-sm text-muted-foreground">
                    {pairsCount}
                  </span>
                </div>

                {flashcardSet.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Created</span>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {formatDistanceToNow(new Date(flashcardSet.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                {editMode ? "Edit Mode" : "Instructions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editMode ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Tap the <strong>✕</strong> on a card to mark it for removal.
                    Use <strong>Add Card</strong> to create new cards. Hit{" "}
                    <strong>Save</strong> when done.
                  </p>
                  <Button className="w-full" onClick={() => setAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Card
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on any card to flip it and reveal the answer. Click
                    again to flip it back.
                  </p>
                  <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                    <FlipHorizontal className="h-6 w-6 text-primary" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cards grid */}
        <div className="lg:col-span-3">
          {pairsCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
              <BookOpen className="h-12 w-12 opacity-30" />
              <p>
                No cards yet.{editMode ? " Use Add Card to create some." : ""}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-6">
              {frontCards.map((frontCard) => {
                const backCard = localCards.find(
                  (c) =>
                    c.type === "back" &&
                    c.slideNumber === frontCard.slideNumber + 1,
                );
                if (!backCard) return null;
                return (
                  <FlashcardItem
                    key={frontCard.slideNumber}
                    front={frontCard}
                    back={backCard}
                    editMode={editMode}
                    onRemove={() => confirmRemove(frontCard.slideNumber)}
                  />
                );
              })}

              {/* Add placeholder in edit mode */}
              {editMode && (
                <button
                  onClick={() => setAddOpen(true)}
                  className="rounded-xl border-4 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  style={{
                    width: CARD_DISPLAY_WIDTH,
                    height: CARD_DISPLAY_HEIGHT,
                  }}
                >
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-sm">Add Card</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating save bar in edit mode */}
      {editMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-background border shadow-xl rounded-full px-6 py-3 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            disabled={isSaving}
          >
            <X className="mr-1 h-4 w-4" />
            Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
