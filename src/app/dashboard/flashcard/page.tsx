"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { IconCards, IconSparkles } from "@tabler/icons-react";

export default function FlashcardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Flashcard Generator
          </h1>
          <p className="text-muted-foreground">
            Create study cards for effective learning.
          </p>
        </div>
        <Button>
          <IconSparkles className="mr-2 h-4 w-4" />
          Generate
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Flashcards from Text</CardTitle>
            <CardDescription>
              Enter your text below to automatically create flashcards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste your notes, article, or any text here..."
                rows={8}
              />
              <Button className="w-full">
                <IconCards className="mr-2 h-4 w-4" />
                Generate Flashcards
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Flashcards</CardTitle>
            <CardDescription>
              Your generated flashcards will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
              <p className="text-muted-foreground">
                No flashcards generated yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
