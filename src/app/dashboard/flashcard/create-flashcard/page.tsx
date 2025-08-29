"use client";
import { useHeaderStore } from "@/store/header-store";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Upload, CheckCircle, BookOpen, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Updated interface to store image data locally
interface ExtractedSlide {
  slideNumber: number;
  imageName: string;
  type: "title" | "front" | "back";
}

// Status Badge Component matching the KanbanPage
const StatusBadge = ({
  status,
  text,
}: {
  status: "complete" | "incomplete";
  text: string;
}) => {
  const statusConfig = {
    complete: {
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    incomplete: {
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
  };
  const config = statusConfig[status];
  return <Badge className={config.className}>{text}</Badge>;
};

const standards = [
  { value: "9th", label: "9th (SSC)" },
  { value: "10th", label: "10th (SSC)" },
  { value: "11th-sci", label: "11th Science (HSC)" },
  { value: "12th-sci", label: "12th Science (HSC)" },
];

const sscSubjects = [
  { value: "english", label: "English" },
  { value: "marathi", label: "Marathi" },
  { value: "hindi", label: "Hindi" },
  { value: "maths-1", label: "Mathematics 1 (Algebra)" },
  { value: "maths-2", label: "Mathematics 2 (Geometry)" },
  { value: "science-1", label: "Science 1" },
  { value: "science-2", label: "Science 2" },
  { value: "history-civics", label: "History & Civics" },
  { value: "geography", label: "Geography" },
];

const hscSubjects = [
  { value: "english", label: "English" },
  { value: "marathi", label: "Marathi" },
  { value: "hindi", label: "Hindi" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "maths-1", label: "Mathematics 1" },
  { value: "maths-2", label: "Mathematics 2" },
];

export default function FlashcardCreator() {
  const { setTitle: setHeaderTitle } = useHeaderStore();

  useEffect(() => {
    setHeaderTitle("Create Flashcard");
  }, [setHeaderTitle]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extractedSlides, setExtractedSlides] = useState<ExtractedSlide[]>([]);
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");

  const handleThumbnailUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.type.startsWith("image/")) {
          // Placeholder for thumbnail handling
          toast.info("Thumbnail selection is not yet implemented.");
        } else {
          toast.error("Please upload an image file");
        }
      }
    },
    []
  );

  const saveFlashcardSet = useCallback(
    async (publish: boolean = false) => {
      // All logic is now handled by the backend API
      // The button is disabled until slides are extracted
      // which means the set is already created.
      toast.success(`Flashcard set "${title}" has been saved and is ready.`);
      if (publish) {
        setTitle("");
        setDescription("");
        setExtractedSlides([]);
        setStandard("");
        setSubject("");
      }
    },
    [title]
  );

  const getSubjectOptions = () => {
    if (standard === "9th" || standard === "10th") return sscSubjects;
    if (standard === "11th-sci" || standard === "12th-sci") return hscSubjects;
    return [];
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-background min-h-screen">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Create Flashcard Set
              </h1>
              <p className="text-muted-foreground">
                Upload presentation to extract flashcard images
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Set Information Card */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Settings className="h-4 w-4" />
                </div>
                Set Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter flashcard set title"
                    className="transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail" className="text-sm font-medium">
                    Thumbnail
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="transition-all"
                      />
                    </div>
                    <AnimatePresence>
                      {/* Thumbnail preview placeholder */}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Standard</Label>
                  <Select
                    value={standard}
                    onValueChange={(val) => {
                      setStandard(val);
                      setSubject("");
                    }}
                  >
                    <SelectTrigger className="transition-all">
                      <SelectValue placeholder="Select standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted">
                        SSC
                      </div>
                      {standards
                        .filter((s) => s.value === "9th" || s.value === "10th")
                        .map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted">
                        HSC Science
                      </div>
                      {standards
                        .filter(
                          (s) =>
                            s.value === "11th-sci" || s.value === "12th-sci"
                        )
                        .map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subject</Label>
                  <Select
                    value={subject}
                    onValueChange={setSubject}
                    disabled={!standard}
                  >
                    <SelectTrigger className="transition-all">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubjectOptions().length === 0 && (
                        <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted">
                          Please select a standard first
                        </div>
                      )}
                      {getSubjectOptions().map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your flashcard set"
                  className="min-h-[120px] transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Upload Card */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Upload className="h-4 w-4" />
                </div>
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload a document (PDF, DOCX, HTML) to extract content for your
                flashcards. This feature is under development.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => saveFlashcardSet(false)}
                disabled={extractedSlides.length === 0 || !standard || !subject}
                variant="outline"
                className="w-full transition-all hover:scale-[1.02]"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => saveFlashcardSet(true)}
                disabled={extractedSlides.length === 0 || !standard || !subject}
                className="w-full transition-all hover:scale-[1.02]"
              >
                <Upload className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </CardContent>
          </Card>
          {/* Preview Dimensions Card */}
          {/* <Card className="shadow-sm hover:shadow-md transition-all duration-300 sticky top-48">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Preview Dimensions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    className="bg-card border border-border rounded-xl flex items-center justify-center shadow-sm overflow-hidden"
                    style={{ width: "280px", height: "600px" }}
                  >
                    <div className="text-center p-6">
                      <div className="bg-background w-16 h-16 rounded-lg flex items-center justify-center shadow-sm mx-auto mb-4">
                        <FileImage className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-lg font-bold mb-1">280px × 600px</p>
                      <p className="text-sm text-muted-foreground">
                        Flashcard Preview Size
                      </p>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-sm">
                    Recommended Size
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
          Status Card
          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Set Information</span>
                <StatusBadge
                  status={title ? "complete" : "incomplete"}
                  text={title ? "Complete" : "Incomplete"}
                />
              </div>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Standard & Subject</span>
                <StatusBadge
                  status={standard && subject ? "complete" : "incomplete"}
                  text={standard && subject ? "Complete" : "Incomplete"}
                />
              </div>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Presentation</span>
                <StatusBadge
                  status={
                    extractedSlides.length > 0 ? "complete" : "incomplete"
                  }
                  text={extractedSlides.length > 0 ? "Complete" : "Incomplete"}
                />
              </div>
            </CardContent>
          </Card>
          {/* Storage Info Card */}
          {/* <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Database className="h-4 w-4" />
                </div>
                Storage Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{savedSetsCount} Sets Saved</p>
                    <p className="text-xs text-muted-foreground">
                      Stored locally in your browser
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium">Note:</span> Flashcard sets are
                  stored locally in your browser's storage. Data may be cleared
                  if you clear your browser data.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full transition-all hover:scale-[1.02]"
                onClick={() => {
                  const sets = localStorage.getItem(FLASHCARD_SETS_KEY);
                  if (sets) {
                    try {
                      const parsed = JSON.parse(sets);
                      toast.success(
                        `You have ${parsed.length} flashcard set(s) stored locally.`
                      );
                    } catch {
                      toast.error("No flashcard sets found.");
                    }
                  } else {
                    toast.error("No flashcard sets found.");
                  }
                }}
              >
                <Database className="h-4 w-4 mr-2" />
                View Saved Sets
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
