"use client";
import { useHeaderStore } from "@/store/header-store";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Clock,
  FlipHorizontal,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Flashcard {
  slideNumber: number;
  imageName: string;
  type: "title" | "front" | "back";
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

function FlashcardItem({ front, back }: { front: Flashcard; back: Flashcard }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="relative w-full h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d">
        {/* Front of the card */}
        <div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? "opacity-0" : "opacity-100"
          }`}
        >
          <Card className="w-full h-full flex flex-col justify-center items-center p-6 shadow-sm hover:shadow-md transition-all duration-300 border-0">
            <Image
              src={`/uploads/${front.imageName}`}
              alt="Flashcard Front"
              fill
              className="object-contain"
            />
          </Card>
        </div>

        {/* Back of the card */}
        <div
          className={`absolute w-full h-full backface-hidden ${
            isFlipped ? "opacity-100" : "opacity-0"
          }`}
        >
          <Card className="w-full h-full flex flex-col justify-center items-center p-6 shadow-sm hover:shadow-md transition-all duration-300 border-0 bg-primary text-primary-foreground">
            <Image
              src={`/uploads/${back.imageName}`}
              alt="Flashcard Back"
              fill
              className="object-contain"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardSetPage() {
  const { setTitle } = useHeaderStore();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchFlashcardSet = async () => {
        try {
          const response = await fetch(`/api/flashcard/${id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch flashcard set");
          }
          const data = await response.json();
          setFlashcardSet(data);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFlashcardSet();
    }
  }, [id]);

  useEffect(() => {
    if (flashcardSet) {
      setTitle(`Flashcard: ${flashcardSet.title}`);
    }
    return () => {
      setTitle("Flashcards");
    };
  }, [flashcardSet, setTitle]);
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
        <Button
          onClick={() => router.back()}
          className="transition-all hover:scale-[1.02]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

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
                {flashcardSet.title}
              </h1>
              <p className="text-muted-foreground">
                {flashcardSet.description}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="transition-all hover:scale-[1.02]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
                  <Image
                    src={`/uploads/${flashcardSet.thumbnail}`}
                    alt={flashcardSet.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={flashcardSet.published ? "default" : "secondary"}
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
                    {flashcardSet.flashcards.length}
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
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Click on any card to flip it and reveal the answer. Click again
                to flip it back.
              </p>
              <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
                <FlipHorizontal className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flashcards Grid */}
        <div className="lg:col-span-3">
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
            {flashcardSet.flashcards
              .filter((card) => card.type === "front")
              .map((frontCard) => {
                const backCard = flashcardSet.flashcards.find(
                  (card) =>
                    card.type === "back" &&
                    card.slideNumber === frontCard.slideNumber + 1
                );
                if (!backCard) return null;
                return (
                  <FlashcardItem
                    key={frontCard.slideNumber}
                    front={frontCard}
                    back={backCard}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
