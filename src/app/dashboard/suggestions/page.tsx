"use client";
import { useHeaderStore } from "@/store/header-store";
import React, { useState, useEffect, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
  DropResult as DropResultType,
} from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  ThumbsUp,
  MessageCircle,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  GripVertical,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Define types to match Prisma schema
type SuggestionStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DECLINED";

interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    image: string | null;
  };
  comments?: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      name: string;
      image: string | null;
    };
  }[];
}

interface Column {
  id: SuggestionStatus;
  title: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  items: FeatureSuggestion[];
}

type Columns = {
  [key in SuggestionStatus]: Column;
};

// Status Badge Component
const StatusBadge = ({ status }: { status: SuggestionStatus }) => {
  const statusConfig = {
    PENDING: {
      label: "Pending",
      variant: "secondary" as const,
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    IN_PROGRESS: {
      label: "In Progress",
      variant: "default" as const,
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    COMPLETED: {
      label: "Completed",
      variant: "default" as const,
      className:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    DECLINED: {
      label: "Declined",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
  };
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
};

// Suggestion Form Component
const SuggestionForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  const validateForm = () => {
    let isValid = true;
    if (!title.trim()) {
      setTitleError("Title is required");
      isValid = false;
    } else if (title.length < 5) {
      setTitleError("Title must be at least 5 characters");
      isValid = false;
    } else {
      setTitleError("");
    }
    if (!description.trim()) {
      setDescriptionError("Description is required");
      isValid = false;
    } else if (description.length < 10) {
      setDescriptionError("Description must be at least 10 characters");
      isValid = false;
    } else {
      setDescriptionError("");
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (response.ok) {
        setTitle("");
        setDescription("");
        onSuccess();
      } else {
        const error = await response.json();
        console.error("Failed to submit suggestion:", error.message);
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Feature Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., AI-powered quiz analytics"
          className={`transition-all ${
            titleError ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
        {titleError && <p className="text-red-500 text-xs">{titleError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Details
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the feature and why it would be helpful."
          className={`transition-all min-h-[120px] ${
            descriptionError ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
        {descriptionError && (
          <p className="text-red-500 text-xs">{descriptionError}</p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-2 transition-all hover:scale-[1.02]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <PlusCircle className="mr-2 h-4 w-4" />
            Submit Suggestion
          </>
        )}
      </Button>
    </form>
  );
};

// Suggestion Detail Dialog Component
const SuggestionDetailDialog = ({ item }: { item: FeatureSuggestion }) => {
  const [comments, setComments] = useState(item.comments || []);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isFetchingComments, setIsFetchingComments] = useState(true);

  const fetchComments = useCallback(async () => {
    setIsFetchingComments(true);
    try {
      const response = await fetch(`/api/suggestions/${item.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsFetchingComments(false);
    }
  }, [item.id]);

  useEffect(() => {
    fetchComments();
  }, [item.id, fetchComments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsCommenting(true);
    try {
      const response = await fetch(`/api/suggestions/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (response.ok) {
        const newCommentData = await response.json();
        setComments([...comments, newCommentData]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
          {isFetchingComments ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={comment.author.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {comment.author.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No comments yet.
                </div>
              )}
            </div>
          )}
        </div>
        <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-4 border-t">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            disabled={isCommenting}
          />
          <Button type="submit" disabled={isCommenting}>
            {isCommenting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Suggestion Card Component
const SuggestionCard = ({
  item,
  index,
  onUpvote,
}: {
  item: FeatureSuggestion;
  index: number;
  onUpvote: (id: string) => void;
}) => {
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const handleUpvote = async () => {
    if (isUpvoting || hasUpvoted) return;
    setIsUpvoting(true);
    try {
      const response = await fetch(`/api/suggestions/${item.id}/upvote`, {
        method: "POST",
      });
      if (response.ok) {
        setHasUpvoted(true);
        onUpvote(item.id);
      }
    } catch (error) {
      console.error("Error upvoting suggestion:", error);
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`mb-4 ${snapshot.isDragging ? "opacity-50" : ""}`}
        >
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-0 overflow-hidden group">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <div
                    {...provided.dragHandleProps}
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {item.description}
              </p>
              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUpvote}
                    disabled={isUpvoting || hasUpvoted}
                    className={`px-3 py-1 h-auto ${
                      hasUpvoted
                        ? "text-green-600"
                        : "text-muted-foreground hover:text-blue-600"
                    }`}
                  >
                    <ThumbsUp
                      className={`mr-1 h-4 w-4 ${
                        hasUpvoted ? "fill-green-500" : ""
                      }`}
                    />
                    <span>{item.upvotes}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-3 py-1 h-auto text-muted-foreground hover:text-blue-600"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" />
                    <span>{item.comments?.length || 0}</span>
                  </Button>
                  <SuggestionDetailDialog item={item} />
                </div>
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={item.author.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {item.author.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

// Column Header Component
const ColumnHeader = ({ column }: { column: Column }) => {
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2 mb-1">
        <div className={`p-1.5 rounded-md ${column.color}`}>{column.icon}</div>
        <h2 className="text-lg font-bold">{column.title}</h2>
        <Badge variant="outline" className="ml-auto">
          {column.items.length}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{column.description}</p>
    </div>
  );
};

const KanbanPage = () => {
  const { setTitle } = useHeaderStore();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setTitle("Suggestions");
    setHasMounted(true);
  }, [setTitle]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("board");
  const [columns, setColumns] = useState<Columns>({
    PENDING: {
      id: "PENDING",
      title: "Pending Review",
      description: "New suggestions awaiting evaluation",
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      icon: <Clock className="h-4 w-4" />,
      items: [],
    },
    IN_PROGRESS: {
      id: "IN_PROGRESS",
      title: "In Progress",
      description: "Features currently being developed",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <Loader2 className="h-4 w-4" />,
      items: [],
    },
    COMPLETED: {
      id: "COMPLETED",
      title: "Completed",
      description: "Successfully implemented features",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      icon: <CheckCircle className="h-4 w-4" />,
      items: [],
    },
    DECLINED: {
      id: "DECLINED",
      title: "Declined",
      description: "Suggestions not currently planned",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      icon: <XCircle className="h-4 w-4" />,
      items: [],
    },
  });

  const updateColumns = useCallback((data: FeatureSuggestion[]) => {
    setColumns((prevColumns) => {
      const newColumns: Columns = {
        PENDING: { ...prevColumns.PENDING, items: [] },
        IN_PROGRESS: { ...prevColumns.IN_PROGRESS, items: [] },
        COMPLETED: { ...prevColumns.COMPLETED, items: [] },
        DECLINED: { ...prevColumns.DECLINED, items: [] },
      };

      data.forEach((item) => {
        if (newColumns[item.status]) {
          newColumns[item.status].items.push(item);
        }
      });

      // Sort items by upvotes (descending) and then by creation date (newest first)
      Object.keys(newColumns).forEach((status) => {
        newColumns[status as SuggestionStatus].items.sort((a, b) => {
          if (a.upvotes !== b.upvotes) {
            return b.upvotes - a.upvotes;
          }
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      });
      return newColumns;
    });
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/suggestions");
      const data: FeatureSuggestion[] = await res.json();
      updateColumns(data);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [updateColumns]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const onDragEnd = async (result: DropResultType) => {
    const { source, destination } = result;

    // If dropped outside the list
    if (!destination) {
      return;
    }

    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Get source and destination columns
    const sourceColumn = columns[source.droppableId as SuggestionStatus];
    const destColumn = columns[destination.droppableId as SuggestionStatus];

    // Create copies of the items arrays
    const sourceItems = [...sourceColumn.items];
    const destItems = [...destColumn.items];

    // Remove the item from the source
    const [removed] = sourceItems.splice(source.index, 1);

    // Update the status of the dragged item
    const updatedItem = {
      ...removed,
      status: destination.droppableId as SuggestionStatus,
    };

    // Insert the item into the destination
    destItems.splice(destination.index, 0, updatedItem);

    // Create new columns object
    const newColumns = {
      ...columns,
      [source.droppableId]: {
        ...sourceColumn,
        items: sourceItems,
      },
      [destination.droppableId]: {
        ...destColumn,
        items: destItems,
      },
    };

    // Update state
    setColumns(newColumns);

    // Update the status in the backend
    try {
      await fetch(`/api/suggestions/${removed.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destination.droppableId }),
      });
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      // Revert the change on error
      fetchSuggestions();
    }
  };

  const handleUpvote = (id: string) => {
    // Find the suggestion and increment its upvote count
    const newColumns = { ...columns };
    Object.keys(newColumns).forEach((status) => {
      const column = newColumns[status as SuggestionStatus];
      const itemIndex = column.items.findIndex((item) => item.id === id);
      if (itemIndex !== -1) {
        column.items[itemIndex] = {
          ...column.items[itemIndex],
          upvotes: column.items[itemIndex].upvotes + 1,
        };
      }
    });
    setColumns(newColumns);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    fetchSuggestions();
  };

  // Filter suggestions based on search query
  const filteredColumns = { ...columns };
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    Object.keys(filteredColumns).forEach((status) => {
      filteredColumns[status as SuggestionStatus] = {
        ...filteredColumns[status as SuggestionStatus],
        items: filteredColumns[status as SuggestionStatus].items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.author.name.toLowerCase().includes(query)
        ),
      };
    });
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Feature Suggestions
            </h1>
            <p className="text-muted-foreground">
              Share ideas and help us improve our platform
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suggestions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Suggestion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Suggest a New Feature</DialogTitle>
                  <DialogDescription>
                    We&apos;d love to hear your ideas for improving our tools.
                  </DialogDescription>
                </DialogHeader>
                <SuggestionForm onSuccess={handleSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : (
            hasMounted && (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {Object.values(filteredColumns).map((column) => (
                  <Droppable
                    key={column.id}
                    droppableId={column.id}
                    isDropDisabled={false}
                    isCombineEnabled={false}
                  >
                    {(provided: DroppableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-background border border-border rounded-xl p-4 flex flex-col h-full"
                      >
                        <ColumnHeader column={column} />
                        <div className="flex-1 overflow-y-auto min-h-[400px] pr-2 -mr-2">
                          {column.items.length > 0 ? (
                            column.items.map((item, index) => (
                              <SuggestionCard
                                key={item.id}
                                item={item}
                                index={index}
                                onUpvote={handleUpvote}
                              />
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground">
                              <div
                                className={`p-3 rounded-full mb-3 ${column.color}`}
                              >
                                {column.icon}
                              </div>
                              <p className="text-sm">
                                No suggestions in this column
                              </p>
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
            )
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(columns).map((column) => (
              <Card key={column.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-md ${column.color}`}>
                      {column.icon}
                    </div>
                    <CardTitle className="text-lg">{column.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {column.items.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total suggestions
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              Top Voted Suggestions
            </h3>
            <div className="space-y-3">
              {Object.values(columns)
                .flatMap((column) => column.items)
                .sort((a, b) => b.upvotes - a.upvotes)
                .slice(0, 5)
                .map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <StatusBadge status={item.status} />
                            <span className="mx-2">•</span>
                            <span>{item.author.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-green-600 font-medium">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {item.upvotes}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KanbanPage;
