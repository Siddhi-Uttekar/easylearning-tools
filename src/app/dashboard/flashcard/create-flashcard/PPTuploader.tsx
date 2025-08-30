"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  File,
  Loader2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

interface ExtractedSlide {
  slideNumber: number;
  dataUrl: string;
  type: "title" | "front" | "back";
}

interface PPTProcessorProps {
  onSlidesExtracted: (slides: ExtractedSlide[]) => void;
  isProcessing: boolean;
  flashcardSetTitle: string;
}

export default function PPTProcessor({
  onSlidesExtracted,
  isProcessing,
  flashcardSetTitle,
}: PPTProcessorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedSlides, setExtractedSlides] = useState<ExtractedSlide[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file.");
        return;
      }

      setUploadedFile(file);
      setIsGenerating(true);
      setProgress(0);
      setProgressText("Extracting images...");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/preview-pdf", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to extract images");
        }

        const { images } = await response.json();
        setExtractedSlides(images);
        onSlidesExtracted(images);
        setProgress(100);
        setProgressText("Extraction complete!");
        toast.success(`Extracted ${images.length} images.`);
      } catch (error) {
        toast.error("Failed to extract images.");
        setProgressText("");
      } finally {
        setIsGenerating(false);
      }
    },
    [onSlidesExtracted]
  );
  
    const generatePPTFromJSON = useCallback(async () => {
    if (!jsonText.trim()) {
      toast.error("Please paste JSON data");
      return;
    }
    try {
      setIsGenerating(true);
      setProgress(0);
      setProgressText("Generating PowerPoint...");
      const response = await fetch("/api/generate-ppt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonData: jsonText,
          title: flashcardSetTitle || "Flashcard Set",
        }),
      });
      setProgress(50);
      if (!response.ok) {
        throw new Error("Failed to generate PowerPoint");
      }
      const blob = await response.blob();
      setProgress(100);
      setProgressText("Download ready!");
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${flashcardSetTitle || "flashcards"}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PowerPoint generated and downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PowerPoint");
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressText("");
    }
  }, [jsonText, flashcardSetTitle]);


  const removeSlide = (slideNumber: number) => {
    const updatedSlides = extractedSlides.filter(
      (slide) => slide.slideNumber !== slideNumber
    );
    setExtractedSlides(updatedSlides);
    onSlidesExtracted(updatedSlides);
  };

  return (
    <div className="space-y-6">
       <Card className="shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Download className="h-4 w-4" />
            </div>
            Step 1: Generate PowerPoint from JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Paste Flashcard JSON</Label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"front": "What is a triad? Who made them?", "back": "Group of **three elements** having similar chemical properties\n- Dobereiner"}]'
              className="w-full h-32 p-4 border border-border rounded-lg font-mono text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <Button
            onClick={generatePPTFromJSON}
            className="w-full transition-all hover:scale-[1.02]"
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate PowerPoint Template"}
          </Button>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressText}</span>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {Math.round(progress)}%
                </Badge>
              </div>
              <Progress value={progress} className="w-full h-2" />
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Upload className="h-4 w-4" />
            </div>
            Step 2: Upload PDF for Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted transition-colors hover:border-primary">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <File className="h-8 w-8 text-primary" />
            </div>
            <div>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isGenerating || isProcessing}
              />
              <Label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6 py-3 rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Choose PDF File
                  </>
                )}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {uploadedFile
                ? `Selected: ${uploadedFile.name}`
                : "Upload a PDF to extract slide images"}
            </p>
          </div>
          {(isGenerating || isProcessing) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressText}</span>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {Math.round(progress)}%
                </Badge>
              </div>
              <Progress value={progress} className="w-full h-2" />
            </motion.div>
          )}
          {extractedSlides.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <span className="font-medium">Extraction Complete</span>
                    <p className="text-sm text-muted-foreground">
                      Successfully extracted {extractedSlides.length} slide
                      images
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExtractedSlides([]);
                    onSlidesExtracted([]);
                  }}
                >
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto p-2 bg-muted rounded-lg">
                {extractedSlides.map((slide) => (
                  <div key={slide.slideNumber} className="relative group">
                    <img
                      src={slide.dataUrl}
                      alt={`Slide ${slide.slideNumber}`}
                      className="w-full h-20 object-cover rounded-lg border-2 border-border group-hover:border-primary transition-all"
                    />
                    <button
                      onClick={() => removeSlide(slide.slideNumber)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
                      <div className="text-xs text-white font-medium">
                        {slide.type === "title"
                          ? "Title"
                          : slide.type === "front"
                          ? "Front"
                          : "Back"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
