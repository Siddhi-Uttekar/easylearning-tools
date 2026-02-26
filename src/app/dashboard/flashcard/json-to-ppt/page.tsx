"use client";
import { useState, useCallback, useEffect } from "react";
import { useHeaderStore } from "@/store/header-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster, toast } from "sonner";
import {
  Upload,
  FileJson,
  Presentation,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  BookOpen,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Option {
  option_id: number;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  question_id: number;
  question_text: string;
  solution?: string;
  difficulty_level?: string;
  chapter_name?: string;
  subject?: string;
  standard?: string;
  options: Option[];
}

interface Metadata {
  chapter?: string;
  subject?: string;
  standard?: string;
  username?: string;
  difficultyFilters?: string;
  totalCount?: number;
  title?: string;
}

// Simple flashcard format: [{front, back}]
interface FlashcardItem {
  front: string;
  back: string;
}

type DetectedFormat = "mcq" | "flashcard" | null;

interface McqJsonData {
  questions: Question[];
  metadata?: Metadata;
}

const SAMPLE_MCQ: McqJsonData = {
  metadata: {
    chapter: "Light & Optics",
    subject: "Physics",
    standard: "10",
    difficultyFilters: "Medium",
  },
  questions: [
    {
      question_id: 1,
      question_text: "Which of the following is the correct law of reflection?",
      difficulty_level: "Easy",
      chapter_name: "Light",
      subject: "Physics",
      standard: "10",
      solution:
        "The angle of incidence equals the angle of reflection. Both angles are measured from the normal to the surface.",
      options: [
        {
          option_id: 1,
          option_text: "Angle of incidence = Angle of reflection",
          is_correct: true,
        },
        {
          option_id: 2,
          option_text: "Angle of incidence > Angle of reflection",
          is_correct: false,
        },
        {
          option_id: 3,
          option_text: "Angle of incidence < Angle of reflection",
          is_correct: false,
        },
        {
          option_id: 4,
          option_text: "No fixed relationship",
          is_correct: false,
        },
      ],
    },
  ],
};

const SAMPLE_FLASHCARD: FlashcardItem[] = [
  {
    front: "What are Angiosperms?",
    back: "Flowering plants that produce seeds enclosed within fruits.",
  },
  {
    front: "What are Hydrophytes?",
    back: "Plants that grow in aquatic habitats, e.g., Hydrilla.",
  },
];

export default function JsonToPptPage() {
  const { setTitle } = useHeaderStore();
  useEffect(() => {
    setTitle("JSON → PPT");
  }, [setTitle]);

  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [jsonText, setJsonText] = useState("");
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat>(null);
  const [mcqData, setMcqData] = useState<McqJsonData | null>(null);
  const [flashcardData, setFlashcardData] = useState<FlashcardItem[] | null>(
    null,
  );
  const [parseError, setParseError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  // Extra metadata for flashcard format (optional)
  const [fcTitle, setFcTitle] = useState("");
  const [fcSubject, setFcSubject] = useState("");
  const [fcStandard, setFcStandard] = useState("");

  const parseJson = useCallback((text: string) => {
    setParseError("");
    setMcqData(null);
    setFlashcardData(null);
    setDetectedFormat(null);
    try {
      const parsed = JSON.parse(text);

      // Detect flashcard format: top-level array of {front, back}
      if (
        Array.isArray(parsed) &&
        parsed.length > 0 &&
        "front" in parsed[0] &&
        "back" in parsed[0]
      ) {
        setFlashcardData(parsed as FlashcardItem[]);
        setDetectedFormat("flashcard");
        toast.success(
          `Detected Flashcard format — ${parsed.length} cards loaded.`,
        );
        return;
      }

      // Detect MCQ format: object with questions array
      if (parsed.questions && Array.isArray(parsed.questions)) {
        setMcqData(parsed as McqJsonData);
        setDetectedFormat("mcq");
        toast.success(
          `Detected MCQ format — ${parsed.questions.length} questions loaded.`,
        );
        return;
      }

      setParseError(
        'Unknown format. Expected [{front, back}] for flashcards or {"questions":[...]} for MCQs.',
      );
    } catch {
      setParseError("Invalid JSON. Please check the format.");
    }
  }, []);

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".json")) {
        toast.error("Please upload a .json file");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setJsonText(text);
        parseJson(text);
      };
      reader.readAsText(file);
    },
    [parseJson],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handlePasteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setJsonText(text);
      if (text.trim()) parseJson(text);
      else {
        setMcqData(null);
        setFlashcardData(null);
        setDetectedFormat(null);
        setParseError("");
      }
    },
    [parseJson],
  );

  const loadSample = useCallback(
    (format: "mcq" | "flashcard") => {
      const text =
        format === "mcq"
          ? JSON.stringify(SAMPLE_MCQ, null, 2)
          : JSON.stringify(SAMPLE_FLASHCARD, null, 2);
      setJsonText(text);
      parseJson(text);
      setFileName(
        format === "mcq" ? "sample_mcq.json" : "sample_flashcard.json",
      );
    },
    [parseJson],
  );

  const clearAll = useCallback(() => {
    setJsonText("");
    setMcqData(null);
    setFlashcardData(null);
    setDetectedFormat(null);
    setParseError("");
    setFileName("");
    setFcTitle("");
    setFcSubject("");
    setFcStandard("");
  }, []);

  const generatePpt = useCallback(async () => {
    if (!detectedFormat) return;
    setIsGenerating(true);
    try {
      let response: Response;

      if (detectedFormat === "mcq" && mcqData) {
        response = await fetch("/api/generate-ppt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questions: mcqData.questions,
            metadata: mcqData.metadata || {},
          }),
        });
      } else if (detectedFormat === "flashcard" && flashcardData) {
        response = await fetch("/api/generate-flashcard-ppt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flashcards: flashcardData,
            metadata: {
              title: fcTitle || "Flashcards",
              subject: fcSubject,
              standard: fcStandard,
            },
          }),
        });
      } else {
        return;
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate PPT");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const baseName =
        detectedFormat === "mcq"
          ? (mcqData?.metadata?.chapter?.replace(/[^a-zA-Z0-9]/g, "_") ||
              "MCQ") + `_${mcqData?.questions.length}Q`
          : (fcTitle || "Flashcards").replace(/[^a-zA-Z0-9]/g, "_") +
            `_${flashcardData?.length}cards`;
      a.href = url;
      a.download = `${baseName}_EasyLearning.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PowerPoint downloaded successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate PPT",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [detectedFormat, mcqData, flashcardData, fcTitle, fcSubject, fcStandard]);

  const isReady = detectedFormat !== null && !parseError;
  const itemCount =
    detectedFormat === "mcq"
      ? (mcqData?.questions.length ?? 0)
      : (flashcardData?.length ?? 0);
  const slideCount =
    detectedFormat === "mcq" ? itemCount * 2 + 1 : itemCount * 2 + 2;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileJson className="text-blue-600" size={28} />
            JSON to PowerPoint
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Supports two formats:{" "}
            <span className="font-medium text-foreground">
              [{"{front, back}"}]
            </span>{" "}
            flashcards or{" "}
            <span className="font-medium text-foreground">
              {"{questions:[...]}"}
            </span>{" "}
            MCQs. Format is auto-detected.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSample("flashcard")}
          >
            <BookOpen size={13} className="mr-1" /> Flashcard Sample
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadSample("mcq")}>
            MCQ Sample
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Input JSON</CardTitle>
              <CardDescription>
                Upload a .json file or paste JSON directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "upload" | "paste")}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="upload">
                    <Upload size={14} className="mr-2" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="paste">
                    <FileJson size={14} className="mr-2" />
                    Paste JSON
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                  <div
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-muted-foreground/30 hover:border-blue-400 hover:bg-muted/30"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("json-file-input")?.click()
                    }
                  >
                    <FileJson
                      size={40}
                      className="mx-auto mb-3 text-blue-500 opacity-80"
                    />
                    <p className="font-medium text-sm">
                      {fileName ? fileName : "Drag & drop your JSON file here"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse — .json files only
                    </p>
                    <input
                      id="json-file-input"
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="paste">
                  <div className="space-y-2">
                    <Label htmlFor="json-paste">Paste JSON content</Label>
                    <Textarea
                      id="json-paste"
                      value={jsonText}
                      onChange={handlePasteChange}
                      placeholder={`[ { "front": "Question?", "back": "Answer." }, ... ]`}
                      className="font-mono text-xs min-h-[220px] resize-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Status */}
              {parseError && (
                <div className="mt-3 flex items-start gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {parseError}
                </div>
              )}
              {isReady && (
                <div className="mt-3 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm bg-green-50 dark:bg-green-950 rounded-lg p-3">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>
                    {detectedFormat === "flashcard" ? (
                      <>
                        <Badge variant="secondary" className="mr-1 text-[10px]">
                          Flashcard
                        </Badge>
                        {itemCount} cards ready to convert
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary" className="mr-1 text-[10px]">
                          MCQ
                        </Badge>
                        {itemCount} questions ready to convert
                      </>
                    )}
                  </span>
                </div>
              )}

              {/* Actions */}
              {(jsonText || isReady) && (
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    <Trash2 size={14} className="mr-1" /> Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flashcard metadata form (only shown for flashcard format) */}
          {detectedFormat === "flashcard" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen size={15} /> Presentation Details
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    Optional
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Add a title and subject info to appear on the cover slide.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-3 sm:col-span-1">
                  <Label htmlFor="fc-title" className="text-xs">
                    Title / Chapter
                  </Label>
                  <Input
                    id="fc-title"
                    placeholder="e.g. Angiosperms"
                    value={fcTitle}
                    onChange={(e) => setFcTitle(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1 col-span-3 sm:col-span-1">
                  <Label htmlFor="fc-subject" className="text-xs">
                    Subject
                  </Label>
                  <Input
                    id="fc-subject"
                    placeholder="e.g. Biology"
                    value={fcSubject}
                    onChange={(e) => setFcSubject(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1 col-span-3 sm:col-span-1">
                  <Label htmlFor="fc-standard" className="text-xs">
                    Standard / Class
                  </Label>
                  <Input
                    id="fc-standard"
                    placeholder="e.g. 11"
                    value={fcStandard}
                    onChange={(e) => setFcStandard(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* JSON Format Guide */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Eye size={15} /> Supported JSON Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="flashcard">
                <TabsList className="mb-3">
                  <TabsTrigger value="flashcard" className="text-xs">
                    Flashcard Format
                  </TabsTrigger>
                  <TabsTrigger value="mcq" className="text-xs">
                    MCQ Format
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="flashcard">
                  <ScrollArea className="h-32 rounded-md">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{`[
  {
    "front": "What are Angiosperms?",
    "back": "Flowering plants that produce seeds enclosed within fruits."
  },
  {
    "front": "What are Hydrophytes?",
    "back": "Plants that grow in aquatic habitats, e.g., Hydrilla."
  }
]`}</pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="mcq">
                  <ScrollArea className="h-32 rounded-md">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{`{
  "metadata": { "chapter": "Light", "subject": "Physics", "standard": "10" },
  "questions": [
    {
      "question_id": 1,
      "question_text": "Your question here?",
      "solution": "Explanation...",
      "options": [
        { "option_id": 1, "option_text": "Option A", "is_correct": true },
        { "option_id": 2, "option_text": "Option B", "is_correct": false }
      ]
    }
  ]
}`}</pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview & Generate */}
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Presentation size={18} className="text-blue-600" />
                Presentation Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isReady ? (
                <>
                  <InfoRow
                    label="Format"
                    value={detectedFormat === "flashcard" ? "Flashcard" : "MCQ"}
                  />
                  {detectedFormat === "flashcard" ? (
                    <>
                      <InfoRow label="Title" value={fcTitle || "Flashcards"} />
                      <InfoRow label="Subject" value={fcSubject || "—"} />
                      <InfoRow
                        label="Standard"
                        value={fcStandard ? `Class ${fcStandard}` : "—"}
                      />
                      <InfoRow
                        label="Cards"
                        value={String(itemCount)}
                        highlight
                      />
                    </>
                  ) : (
                    <>
                      <InfoRow
                        label="Chapter"
                        value={mcqData?.metadata?.chapter || "—"}
                      />
                      <InfoRow
                        label="Subject"
                        value={mcqData?.metadata?.subject || "—"}
                      />
                      <InfoRow
                        label="Standard"
                        value={
                          mcqData?.metadata?.standard
                            ? `Class ${mcqData.metadata.standard}`
                            : "—"
                        }
                      />
                      <InfoRow
                        label="Questions"
                        value={String(itemCount)}
                        highlight
                      />
                    </>
                  )}
                  <InfoRow label="Slides" value={String(slideCount)} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upload or paste JSON to see a summary.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Preview list */}
          {isReady && itemCount > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {detectedFormat === "flashcard" ? "Cards" : "Questions"}{" "}
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-52">
                  <div className="space-y-2">
                    {detectedFormat === "flashcard"
                      ? flashcardData?.slice(0, 10).map((card, i) => (
                          <div
                            key={i}
                            className="text-xs border rounded-lg p-2 bg-muted/40"
                          >
                            <div className="flex items-start gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] shrink-0 mt-0.5"
                              >
                                {i + 1}
                              </Badge>
                              <span className="line-clamp-2 leading-snug font-medium">
                                {card.front}
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground line-clamp-1 pl-7">
                              {card.back}
                            </p>
                          </div>
                        ))
                      : mcqData?.questions.slice(0, 10).map((q, i) => (
                          <div
                            key={q.question_id}
                            className="text-xs border rounded-lg p-2 bg-muted/40"
                          >
                            <div className="flex items-start gap-1.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] shrink-0 mt-0.5"
                              >
                                Q{i + 1}
                              </Badge>
                              <span className="line-clamp-2 leading-snug">
                                {q.question_text}
                              </span>
                            </div>
                            {q.difficulty_level && (
                              <Badge
                                variant="secondary"
                                className="mt-1 text-[10px]"
                              >
                                {q.difficulty_level}
                              </Badge>
                            )}
                          </div>
                        ))}
                    {itemCount > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{itemCount - 10} more
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            className="w-full"
            size="lg"
            disabled={!isReady || isGenerating}
            onClick={generatePpt}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Generate & Download PPT
              </>
            )}
          </Button>

          {isReady && (
            <p className="text-xs text-muted-foreground text-center">
              Will generate a {slideCount}-slide .pptx file
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-bold text-blue-600" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
