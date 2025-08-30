"use client";
import { useState, useEffect, FormEvent, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  IconBook,
  IconFileText,
  IconFile,
  IconDownload,
  IconRefresh,
  IconSearch,
  IconCheck,
  IconX,
  IconChevronRight,
  IconLoader2,
  IconHelpCircle,
  IconEye,
  IconFilter,
} from "@tabler/icons-react";

interface Chapter {
  originalId: number;
  name: string;
  subject: string;
  standard: string;
  question_count: string;
}

interface Question {
  question_id: number;
  question_text: string;
  solution: string;
  difficulty_level: string;
  chapter_name: string;
  subject: string;
  standard: string;
  options: Option[];
}

interface Option {
  option_id: number;
  option_text: string;
  is_correct: boolean;
}

interface ParsedQuestion {
  question: string;
  options: string[];
  answer: string;
  solution: string;
  marks: string;
}

export default function MCQGenerator() {
  const [mcqText, setMcqText] = useState<string>("");
  const [filename, setFilename] = useState<string>("MCQs_Document");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Chapter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [showFormatHelp, setShowFormatHelp] = useState<boolean>(false);

  // New state for question selection
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [hasMoreQuestions, setHasMoreQuestions] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);

  // PPT generation state
  const [isGeneratingPPT, setIsGeneratingPPT] = useState<boolean>(false);
  const [pptError, setPptError] = useState<string>("");
  const [pptSuccess, setPptSuccess] = useState<string>("");

  const cleanHtmlContentWithLaTeX = (
    html: string | null | undefined,
  ): string => {
    if (!html || typeof html !== "string") {
      return "";
    }
    let cleaned = html
      .replace(/\$\$([^$]+)\$\$/g, "$1")
      .replace(/\$([^$]+)\$/g, "$1")
      .replace(/\\hat\{([^}]+)\}/g, "$1̂")
      .replace(/\\overset\{\\to\s*\}\{\\mathop\{([^}]+)\}\\,\}/g, "$1⃗")
      .replace(/\\mathop\{([^}]+)\}/g, "$1")
      .replace(/\\,/g, " ")
      .replace(/&there4;/g, "∴")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\{\{([^}]+)\}\}/g, "$1")
      .replace(/\\hat\{([^}]+)\}/g, "$1̂")
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(
        /\^([0-9])/g,
        (match, p1) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number.parseInt(p1)] || "^" + p1,
      )
      .replace(/_{([^}]+)}/g, "₍$1₎")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
      .replace(/\\times/g, "×")
      .replace(/\\cdot/g, "·")
      .replace(/\\pm/g, "±")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\theta/g, "θ")
      .replace(/\\pi/g, "π")
      .replace(/\\omega/g, "ω")
      .replace(/\\Omega/g, "Ω")
      .replace(/\\mu/g, "μ")
      .replace(/\\sigma/g, "σ")
      .replace(/\\lambda/g, "λ")
      .replace(/\\phi/g, "φ")
      .replace(/\\psi/g, "ψ")
      .replace(/\\chi/g, "χ")
      .replace(/\\rho/g, "ρ")
      .replace(/\\tau/g, "τ")
      .replace(/\\epsilon/g, "ε")
      .replace(/\\zeta/g, "ζ")
      .replace(/\\eta/g, "η")
      .replace(/\\kappa/g, "κ")
      .replace(/\\nu/g, "ν")
      .replace(/\\xi/g, "ξ")
      .replace(/\\upsilon/g, "υ")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\approx/g, "≈")
      .replace(/\\equiv/g, "≡")
      .replace(/\\propto/g, "∝")
      .replace(/\\infty/g, "∞")
      .replace(/\\partial/g, "∂")
      .replace(/\\nabla/g, "∇")
      .replace(/\\int/g, "∫")
      .replace(/\\sum/g, "∑")
      .replace(/\\prod/g, "∏")
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
      .replace(/\\[a-zA-Z]+/g, "");

    cleaned = cleaned
      .replace(/<img[^>]*>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&hellip;/g, "...")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"');

    cleaned = cleaned.replace(/&[a-zA-Z0-9#]+;/g, "");

    cleaned = cleaned
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/[\uFFFE\uFFFF]/g, "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

    cleaned = cleaned
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    if (!cleaned || cleaned.length === 0) {
      return "Content not available";
    }

    if (cleaned.length > 5000) {
      cleaned = cleaned.substring(0, 5000) + "...";
    }

    return cleaned;
  };

  // Fetch chapters on component mount
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch("/api/chapter");
        const data = await response.json();
        setChapters(data.chapters || []);
      } catch (err) {
        console.error("Failed to fetch chapters:", err);
        setError("Failed to load chapters");
      }
    };
    fetchChapters();
  }, []);

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    if (selectedChapters.length === 0) return;
    setIsLoadingQuestions(true);
    setError("");
    try {
      const chapterName = selectedChapters[0].name;
      const difficultyParam =
        difficultyFilter === "all" ? "" : `&difficulty=${difficultyFilter}`;
      const response = await fetch(
        `/api/questions?chapter=${encodeURIComponent(
          chapterName
        )}${difficultyParam}&limit=${questionLimit}&offset=${offset}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch questions");
      }
      const data = await response.json();
      if (offset === 0) {
        setAvailableQuestions(data.questions || []);
      } else {
        setAvailableQuestions((prev) => [...prev, ...(data.questions || [])]);
      }
      setHasMoreQuestions(data.has_more || false);
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [selectedChapters, difficultyFilter, questionLimit, offset]);

  // Fetch questions when chapter or filters change
  useEffect(() => {
    if (selectedChapters.length > 0) {
      fetchQuestions();
    }
  }, [selectedChapters, difficultyFilter, questionLimit, offset, fetchQuestions]);

  // Parse MCQ text when it changes
  useEffect(() => {
    if (mcqText.trim()) {
      const parsed = parseMCQText(mcqText);
      setParsedQuestions(parsed);
    } else {
      setParsedQuestions([]);
    }
  }, [mcqText]);

  // Load more questions
  const loadMoreQuestions = () => {
    setOffset((prev) => prev + questionLimit);
  };

  // Filter chapters based on search term
  const filteredChapters = chapters.filter(
    (chapter) =>
      chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.standard.includes(searchTerm)
  );

  // Group chapters by subject
  const chaptersBySubject = filteredChapters.reduce((acc, chapter) => {
    if (!acc[chapter.subject]) {
      acc[chapter.subject] = [];
    }
    acc[chapter.subject].push(chapter);
    return acc;
  }, {} as Record<string, Chapter[]>);

  // Parse MCQ text
  const parseMCQText = (text: string): ParsedQuestion[] => {
    const blocks = text.trim().split(/\n\s*\n+/);
    const questions: ParsedQuestion[] = [];
    for (const block of blocks) {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      if (!lines.length) continue;
      const question: ParsedQuestion = {
        question: "",
        options: [],
        answer: "",
        solution: "",
        marks: "1",
      };
      for (const line of lines) {
        if (line.toUpperCase().startsWith("[Q]")) {
          question.question = line.substring(3).trim();
        } else if (line.toUpperCase().startsWith("[O]")) {
          question.options.push(line.substring(3).trim());
        } else if (line.toUpperCase().startsWith("[A]")) {
          question.answer = line.substring(3).trim();
        } else if (line.toUpperCase().startsWith("[S]")) {
          question.solution = line.substring(3).trim();
        } else if (line.toUpperCase().startsWith("[M]")) {
          question.marks = line.substring(3).trim();
        }
      }
      if (question.question) {
        questions.push(question);
      }
    }
    return questions;
  };

  // Handle chapter selection
  const toggleChapterSelection = (chapter: Chapter) => {
    setSelectedChapters((prev) => {
      // Only allow one chapter to be selected at a time
      if (prev.some((c) => c.originalId === chapter.originalId)) {
        return [];
      } else {
        return [chapter];
      }
    });
    setOffset(0); // Reset offset when changing chapters
  };

  // Handle question selection
  const toggleQuestionSelection = (question: Question) => {
    setSelectedQuestions((prev) => {
      if (prev.some((q) => q.question_id === question.question_id)) {
        return prev.filter((q) => q.question_id !== question.question_id);
      } else {
        return [...prev, question];
      }
    });
  };

  // Select all visible questions
  const selectAllQuestions = () => {
    setSelectedQuestions((prev) => {
      const allSelected = availableQuestions.every((q) =>
        prev.some((pq) => pq.question_id === q.question_id)
      );
      if (allSelected) {
        return [];
      } else {
        return [
          ...prev,
          ...availableQuestions.filter(
            (q) => !prev.some((pq) => pq.question_id === q.question_id)
          ),
        ];
      }
    });
  };


  // Add selected questions to MCQ text
  const addSelectedQuestionsToMCQ = () => {
    if (selectedQuestions.length === 0) return;
    const mcqContent = selectedQuestions
      .map((question) => {
        const correctOption = question.options.find((opt) => opt.is_correct);
        const correctLetter = correctOption
          ? String.fromCharCode(65 + question.options.indexOf(correctOption))
          : "";
        return `[Q] ${cleanHtmlContentWithLaTeX(question.question_text)}
${question.options
  .map((opt) => `[O] ${cleanHtmlContentWithLaTeX(opt.option_text)}`)
  .join("\n")}
[A] ${correctLetter}
[S] ${cleanHtmlContentWithLaTeX(question.solution)}
[M] 1`;
      })
      .join("\n\n");
    setMcqText((prev) => prev + (prev ? "\n\n" : "") + mcqContent);
    setActiveTab("manual");
  };

  // Handle form submission for DOCX
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!mcqText.trim()) {
      setError("Please enter MCQ content");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/mcq-to-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcqText, filename }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate document");
      }
      // Get the blob from response
      const blob = await response.blob();
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${filename}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess("Document generated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PPT generation
  const handleGeneratePPT = async () => {
    if (selectedQuestions.length === 0) {
      setPptError("Please select at least one question");
      return;
    }

    setIsGeneratingPPT(true);
    setPptError("");
    setPptSuccess("");

    try {
      const metadata = {
        chapter:
          selectedChapters.length > 0 ? selectedChapters[0].name : "Mixed",
        subject:
          selectedChapters.length > 0 ? selectedChapters[0].subject : "Mixed",
        standard:
          selectedChapters.length > 0 ? selectedChapters[0].standard : "Mixed",
        username: "User", // Replace with actual username if available
        difficultyFilters:
          difficultyFilter === "all" ? "EMH" : difficultyFilter.toUpperCase(),
        totalCount: selectedQuestions.length,
      };

      const response = await fetch("/api/generate-ppt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: selectedQuestions,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate PowerPoint");
      }

      // Get the blob from response
      const blob = await response.blob();
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${metadata.chapter}_${selectedQuestions.length}Q_${metadata.difficultyFilters}_EasyLearning.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setPptSuccess("PowerPoint presentation generated successfully!");
    } catch (err) {
      console.error("Failed to generate PowerPoint:", err);
      setPptError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsGeneratingPPT(false);
    }
  };

  // Handle clear
  const handleClear = () => {
    setMcqText("");
    setParsedQuestions([]);
    setError("");
    setSuccess("");
    setPptError("");
    setPptSuccess("");
  };


  // Add new question template
  const addNewQuestion = () => {
    setMcqText(
      (prev) => prev + "\n[Q] \n[O] \n[O] \n[O] \n[O] \n[A] \n[S] \n[M] \n"
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            MCQ Generator
          </h1>
          <p className="text-muted-foreground">
            Create formatted Word documents and PowerPoint presentations from
            your multiple-choice questions
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chapter Selection */}
          <div className="lg:col-span-1">
            <Card className="border h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBook className="h-5 w-5" />
                  Select Chapter
                </CardTitle>
                <CardDescription>
                  Choose a chapter to load questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search chapters..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {/* Chapters List */}
                  <ScrollArea className="h-96 border rounded-md p-2">
                    {Object.entries(chaptersBySubject).map(
                      ([subject, subjectChapters]) => (
                        <div key={subject} className="mb-4">
                          <h3 className="font-medium text-foreground mb-2">
                            {subject}
                          </h3>
                          <div className="space-y-1">
                            {subjectChapters.map((chapter) => (
                              <div
                                key={chapter.originalId}
                                className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${
                                  selectedChapters.some(
                                    (c) => c.originalId === chapter.originalId
                                  )
                                    ? "bg-primary/10"
                                    : ""
                                }`}
                                onClick={() => toggleChapterSelection(chapter)}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                                      selectedChapters.some(
                                        (c) =>
                                          c.originalId === chapter.originalId
                                      )
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground"
                                    }`}
                                  >
                                    {selectedChapters.some(
                                      (c) => c.originalId === chapter.originalId
                                    ) && <IconCheck className="h-3 w-3" />}
                                  </div>
                                  <span className="text-sm">
                                    {chapter.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {chapter.standard}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {chapter.question_count} Qs
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Right Column - Input and Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Selection */}
            <Card className="border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconFilter className="h-5 w-5" />
                      Select Questions
                    </CardTitle>
                    <CardDescription>
                      {selectedChapters.length > 0
                        ? `From: ${selectedChapters[0].name}`
                        : "Select a chapter first"}
                    </CardDescription>
                  </div>
                  {selectedChapters.length > 0 && (
                    <div className="flex gap-2">
                      <Select
                        value={difficultyFilter}
                        onValueChange={setDifficultyFilter}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Limit:
                        </span>
                        <span className="text-sm font-medium">
                          {questionLimit}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedChapters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconBook className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a chapter to load questions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllQuestions}
                          disabled={availableQuestions.length === 0}
                        >
                          {selectedQuestions.length ===
                            availableQuestions.length &&
                          availableQuestions.length > 0
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {selectedQuestions.length} of{" "}
                          {availableQuestions.length} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="question-limit" className="text-sm">
                          Questions per load:
                        </Label>
                        <Slider
                          id="question-limit"
                          min={5}
                          max={50}
                          step={5}
                          value={[questionLimit]}
                          onValueChange={(value) => {
                            setQuestionLimit(value[0]);
                            setOffset(0);
                          }}
                          className="w-32"
                        />
                      </div>
                    </div>
                    {/* Questions List */}
                    <ScrollArea className="h-64 border rounded-md p-2">
                      {isLoadingQuestions && offset === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : availableQuestions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No questions found</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableQuestions.map((question) => (
                            <div
                              key={question.question_id}
                              className={`flex items-start gap-3 p-3 rounded-md cursor-pointer hover:bg-muted ${
                                selectedQuestions.some(
                                  (q) => q.question_id === question.question_id
                                )
                                  ? "bg-primary/10"
                                  : ""
                              }`}
                              onClick={() => toggleQuestionSelection(question)}
                            >
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                                  selectedQuestions.some(
                                    (q) =>
                                      q.question_id === question.question_id
                                  )
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {selectedQuestions.some(
                                  (q) => q.question_id === question.question_id
                                ) && <IconCheck className="h-3 w-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {question.question_text.replace(
                                    /<[^>]*>/g,
                                    ""
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={
                                      question.difficulty_level === "easy"
                                        ? "default"
                                        : question.difficulty_level === "medium"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className="text-xs"
                                  >
                                    {question.difficulty_level}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {question.options.length} options
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {hasMoreQuestions && (
                        <div className="text-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMoreQuestions}
                            disabled={isLoadingQuestions}
                          >
                            {isLoadingQuestions ? (
                              <>
                                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                Load More
                                <IconChevronRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </ScrollArea>
                    {/* Add to MCQ Button */}
                    <Button
                      onClick={addSelectedQuestionsToMCQ}
                      disabled={selectedQuestions.length === 0}
                      className="w-full"
                    >
                      <IconFileText className="mr-2 h-4 w-4" />
                      Add Selected Questions to MCQ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* MCQ Input */}
            <Card className="border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <IconFileText className="h-5 w-5" />
                      MCQ Content
                    </CardTitle>
                    <CardDescription>
                      Enter your multiple-choice questions
                    </CardDescription>
                  </div>
                  <Dialog
                    open={showFormatHelp}
                    onOpenChange={setShowFormatHelp}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <IconHelpCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Format Instructions</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              1
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">
                                Question Format
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Use{" "}
                                <code className="bg-muted px-1 rounded">
                                  [Q]
                                </code>{" "}
                                followed by the question text
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              2
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">
                                Options
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Use{" "}
                                <code className="bg-muted px-1 rounded">
                                  [O]
                                </code>{" "}
                                for each option
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              3
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">
                                Correct Answer
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Use{" "}
                                <code className="bg-muted px-1 rounded">
                                  [A]
                                </code>{" "}
                                followed by the option letter
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              4
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">
                                Solution
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Use{" "}
                                <code className="bg-muted px-1 rounded">
                                  [S]
                                </code>{" "}
                                for the solution explanation
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                              5
                            </div>
                            <div>
                              <h3 className="font-medium text-foreground">
                                Marks
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Use{" "}
                                <code className="bg-muted px-1 rounded">
                                  [M]
                                </code>{" "}
                                for the marks value
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <h3 className="font-medium text-foreground mb-2">
                            Example:
                          </h3>
                          <pre className="text-xs text-muted-foreground overflow-x-auto">
                            {`[Q] What is the capital of France?
[O] Paris
[O] London
[O] Berlin
[O] Madrid
[A] A
[S] Paris is the capital of France.
[M] 1`}
                          </pre>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-md border border-amber-200 dark:border-amber-800/50">
                          <div className="flex items-center gap-2">
                            <IconChevronRight className="h-4 w-4" />
                            <span className="text-sm">
                              Separate each question with a blank line
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Format Guide */}
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">
                        Quick Format Guide
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFormatHelp(true)}
                      >
                        <IconHelpCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <code>[Q]</code> Question • <code>[O]</code> Option •{" "}
                      <code>[A]</code> Answer • <code>[S]</code> Solution •{" "}
                      <code>[M]</code> Marks
                    </div>
                  </div>
                  {/* Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">Manual Input</TabsTrigger>
                      <TabsTrigger value="paste">Paste Content</TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual" className="space-y-4">
                      <Textarea
                        value={mcqText}
                        onChange={(e) => setMcqText(e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                        placeholder={`[Q] What is the capital of France?
[O] Paris
[O] London
[O] Berlin
[O] Madrid
[A] A
[S] Paris is the capital of France.
[M] 1`}
                      />
                    </TabsContent>
                    <TabsContent value="paste" className="space-y-4">
                      <Textarea
                        value={mcqText}
                        onChange={(e) => setMcqText(e.target.value)}
                        rows={10}
                        className="font-mono text-sm"
                        placeholder="Paste your MCQ content here..."
                      />
                    </TabsContent>
                  </Tabs>
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={addNewQuestion}
                      variant="outline"
                      size="sm"
                    >
                      <IconFileText className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                    <div className="flex-1 flex gap-3">
                      <Input
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="Filename"
                      />
                      <span className="flex items-center text-sm text-muted-foreground">
                        .docx
                      </span>
                    </div>
                    <Button
                      onClick={handleGenerate}
                      disabled={isLoading || !mcqText.trim()}
                    >
                      {isLoading ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <IconDownload className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                    {/* PPT Button */}
                    <Button
                      onClick={handleGeneratePPT}
                      disabled={
                        isGeneratingPPT || selectedQuestions.length === 0
                      }
                      variant="outline"
                    >
                      {isGeneratingPPT ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating PPT...
                        </>
                      ) : (
                        <>
                          <IconFile className="mr-2 h-4 w-4" />
                          Download PPT
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClear}
                      disabled={!mcqText}
                    >
                      <IconRefresh className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                  {/* Error and Success Messages */}
                  {error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                      <div className="flex items-center gap-2">
                        <IconX className="h-4 w-4" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}
                  {success && (
                    <div className="p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800/50">
                      <div className="flex items-center gap-2">
                        <IconCheck className="h-4 w-4" />
                        <span>{success}</span>
                      </div>
                    </div>
                  )}
                  {pptError && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                      <div className="flex items-center gap-2">
                        <IconX className="h-4 w-4" />
                        <span>{pptError}</span>
                      </div>
                    </div>
                  )}
                  {pptSuccess && (
                    <div className="p-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800/50">
                      <div className="flex items-center gap-2">
                        <IconCheck className="h-4 w-4" />
                        <span>{pptSuccess}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Preview Section */}
            {parsedQuestions.length > 0 && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconEye className="h-5 w-5" />
                    Preview ({parsedQuestions.length} question
                    {parsedQuestions.length !== 1 ? "s" : ""})
                  </CardTitle>
                  <CardDescription>
                    How your questions will appear in the document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 border rounded-md p-4">
                    <div className="space-y-4">
                      {parsedQuestions.map((question, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="font-medium">
                              Q{index + 1}: {question.question}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-sm text-muted-foreground">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  <span
                                    className={
                                      option === question.answer
                                        ? "font-medium text-green-600"
                                        : ""
                                    }
                                  >
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <strong>Answer:</strong> {question.answer}
                            </div>
                            {question.solution && (
                              <div className="text-sm text-muted-foreground">
                                <strong>Solution:</strong> {question.solution}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground">
                              <strong>Marks:</strong> {question.marks}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            MCQ Generator • EasyLearning Tools • Questions from{" "}
            {chapters.length} chapters across multiple subjects
          </p>
        </div>
      </div>
    </div>
  );
}
