"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Upload,
  LogOut,
  Presentation,
  CheckCircle,
  BookOpen,
  FileImage,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import PPTProcessor from "./PPTuploader";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExtractedSlide {
  slideNumber: number;
  dataUrl: string;
  type: "title" | "front" | "back";
}

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
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [extractedSlides, setExtractedSlides] = useState<ExtractedSlide[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [standard, setStandard] = useState("");
  const [subject, setSubject] = useState("");

  const handleThumbnailUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setThumbnailPreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          toast.error("Please upload an image file");
        }
      }
    },
    []
  );

  const saveFlashcardSet = useCallback(
    async (publish: boolean = false) => {
      if (!title.trim()) {
        toast.error("Please enter a title");
        return;
      }
      if (!standard) {
        toast.error("Please select a standard");
        return;
      }
      if (!subject) {
        toast.error("Please select a subject");
        return;
      }
      if (extractedSlides.length === 0) {
        toast.error("Please upload and process a PDF file");
        return;
      }
      setIsSaving(true);
      try {
        const payload = {
          title: title.trim(),
          description: description.trim(),
          standard,
          subject,
          images: extractedSlides,
          thumbnail: thumbnailPreview || null,
        };

        const response = await fetch("/api/extract-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create flashcard set");
        }

        const newFlashcardSet = await response.json();

        toast.success(
          publish
            ? "Flashcard set published successfully!"
            : "Flashcard set saved successfully!"
        );

        router.push(
          `/dashboard/flashcard/edit-flashcard/${newFlashcardSet.id}`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Failed to save flashcard set: " + message);
      } finally {
        setIsSaving(false);
      }
    },
    [
      title,
      description,
      thumbnailPreview,
      standard,
      subject,
      extractedSlides,
      router,
    ]
  );
  const handleLogout = useCallback(async () => {
    try {
      await signOut({ callbackUrl: "/" });
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  }, []);
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
                      {thumbnailPreview && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative"
                        >
                          <Image
                            src={thumbnailPreview}
                            alt="Thumbnail preview"
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded-lg border border-border"
                          />
                          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        </motion.div>
                      )}
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

          {/* Presentation Processing Card */}
          <Card className="shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <Presentation className="h-4 w-4" />
                </div>
                Presentation Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PPTProcessor
                onSlidesExtracted={setExtractedSlides}
                isProcessing={isSaving}
                flashcardSetTitle={title}
              />
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
                disabled={
                  isSaving ||
                  extractedSlides.length === 0 ||
                  !standard ||
                  !subject
                }
                variant="outline"
                className="w-full transition-all hover:scale-[1.02]"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                onClick={() => saveFlashcardSet(true)}
                disabled={
                  isSaving ||
                  extractedSlides.length === 0 ||
                  !standard ||
                  !subject
                }
                className="w-full transition-all hover:scale-[1.02]"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isSaving ? "Publishing..." : "Publish"}
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
                  <div className="absolute -bottom-2 left-1.2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-sm">
                    Recommended Size
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
