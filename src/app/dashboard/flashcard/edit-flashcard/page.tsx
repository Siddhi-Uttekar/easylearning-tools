"use client";
import { useHeaderStore } from "@/store/header-store";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Pencil, Eye, BookOpen, Clock } from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  thumbnail?: string; // Added thumbnail field
  standard: string;
  subject: string;
  flashcardCount: number;
  published: boolean;
  createdAt: string;
}

export default function EditFlashcardPage() {
  const { setTitle } = useHeaderStore();

  useEffect(() => {
    setTitle("Edit Flashcard");
  }, [setTitle]);

  const router = useRouter();
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [setToDelete, setSetToDelete] = useState<FlashcardSet | null>(null);
  const [setToEdit, setSetToEdit] = useState<FlashcardSet | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!setToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/flashcard/${setToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete flashcard set");
      }
      setFlashcardSets((prev) =>
        prev.filter((set) => set.id !== setToDelete.id)
      );
      toast.success("Flashcard set deleted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setSetToDelete(null);
    }
  };

  const handleUpdate = async () => {
    if (!setToEdit) return;
    setIsEditing(true);
    try {
      const response = await fetch(`/api/flashcard/${setToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setToEdit),
      });
      if (!response.ok) {
        throw new Error("Failed to update flashcard set");
      }
      const updatedSet = await response.json();
      setFlashcardSets((prev) =>
        prev.map((set) => (set.id === updatedSet.id ? updatedSet : set))
      );
      toast.success("Flashcard set updated successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(message);
    } finally {
      setIsEditing(false);
      setSetToEdit(null);
    }
  };

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try {
        const response = await fetch("/api/flashcard");
        if (!response.ok) {
          throw new Error("Failed to fetch flashcard sets");
        }
        const data = await response.json();
        setFlashcardSets(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlashcardSets();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen">
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
                Your Flashcard Sets
              </h1>
              <p className="text-muted-foreground">
                Here you can view, edit, and delete your flashcard sets.
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/dashboard/flashcard/create-flashcard")}
          >
            Create New Set
          </Button>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {flashcardSets.map((set) => (
          <Card
            key={set.id}
            className="flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden rounded-xl border group py-0 pb-6"
          >
            {/* Thumbnail Section */}
            <div className="h-40 bg-muted relative overflow-hidden rounded-t-xl">
              {set.thumbnail ? (
                <img
                  src={`/uploads/${set.thumbnail}`}
                  alt={set.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <BookOpen className="h-12 w-12 text-primary/40" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge
                  variant={set.published ? "default" : "secondary"}
                  className={
                    set.published
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }
                >
                  {set.published ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-3">
              <CardTitle className="truncate text-xl font-bold group-hover:text-primary transition-colors">
                {set.title}
              </CardTitle>
              <CardDescription className="h-10 text-sm text-muted-foreground line-clamp-2">
                {set.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-grow space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {set.standard}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {set.subject}
                </Badge>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>{set.flashcardCount} cards</span>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {formatDistanceToNow(new Date(set.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-3">
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/flashcard/${set.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" /> View
              </Button>
              <div className="flex gap-1">
                <Dialog
                  open={setToEdit?.id === set.id}
                  onOpenChange={(isOpen) => !isOpen && setSetToEdit(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSetToEdit(set)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Flashcard Set</DialogTitle>
                      <DialogDescription>
                        Make changes to your flashcard set here. Click save when
                        you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={setToEdit?.title || ""}
                          onChange={(e) =>
                            setSetToEdit(
                              (prev) =>
                                prev && { ...prev, title: e.target.value }
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description
                        </Label>
                        <Input
                          id="description"
                          value={setToEdit?.description || ""}
                          onChange={(e) =>
                            setSetToEdit(
                              (prev) =>
                                prev && { ...prev, description: e.target.value }
                            )
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="published" className="text-right">
                          Published
                        </Label>
                        <Switch
                          id="published"
                          checked={setToEdit?.published || false}
                          onCheckedChange={(checked) =>
                            setSetToEdit(
                              (prev) => prev && { ...prev, published: checked }
                            )
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setSetToEdit(null)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate} disabled={isEditing}>
                        {isEditing ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSetToDelete(set)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your flashcard set.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setSetToDelete(null)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {flashcardSets.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-primary/40" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No flashcard sets found
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven&apos;t created any flashcard sets yet. Create your first set to
            get started.
          </p>
        </div>
      )}
    </div>
  );
}
