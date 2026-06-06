"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, Bookmark, ChefHat, BookOpen, Play, Trash2, Loader2, Clock, Flame } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SavedItem {
  id: string;
  itemType: string;
  itemId: string;
  createdAt: string;
  recipe?: {
    id: string;
    title: string;
    description: string;
    mealType: string;
    prepTime: number;
    cookTime: number;
    calories: number | null;
    difficulty: string;
  };
}

interface SavedData {
  savedItems: SavedItem[];
  grouped: {
    RECIPE: SavedItem[];
    ARTICLE: SavedItem[];
    VIDEO: SavedItem[];
  };
}

export default function SavedItemsPage() {
  const [data, setData] = useState<SavedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchSavedItems();
  }, []);

  const fetchSavedItems = async () => {
    try {
      const res = await fetch("/api/weight-management/saved");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemType: string, itemId: string) => {
    try {
      const res = await fetch(`/api/weight-management/saved?type=${itemType}&itemId=${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Item removed from saved");
        fetchSavedItems();
      }
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const getFilteredItems = () => {
    if (!data) return [];
    if (activeTab === "all") return data.savedItems;
    return data.grouped[activeTab as keyof typeof data.grouped] || [];
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "bg-green-100 text-green-700";
      case "MEDIUM": return "bg-amber-100 text-amber-700";
      case "HARD": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Saved Items</h1>
          <p className="text-muted-foreground">Your bookmarked recipes, articles, and videos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <ChefHat className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">{data?.grouped.RECIPE.length || 0}</p>
            <p className="text-xs text-muted-foreground">Recipes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{data?.grouped.ARTICLE.length || 0}</p>
            <p className="text-xs text-muted-foreground">Articles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Play className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{data?.grouped.VIDEO.length || 0}</p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="RECIPE">Recipes</TabsTrigger>
          <TabsTrigger value="ARTICLE">Articles</TabsTrigger>
          <TabsTrigger value="VIDEO">Videos</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Saved Items List */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No saved items yet</h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === "all"
                ? "Save recipes, articles, and videos to access them here"
                : `No saved ${activeTab.toLowerCase()}s yet`}
            </p>
            {activeTab === "all" || activeTab === "RECIPE" ? (
              <Link href="/dashboard/weight-management/recipes">
                <Button>Browse Recipes</Button>
              </Link>
            ) : (
              <Link href="/dashboard/weight-management/learn">
                <Button>Browse Content</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {item.itemType === "RECIPE" && item.recipe ? (
                <>
                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 flex items-center justify-center relative">
                    <ChefHat className="w-12 h-12 text-orange-300" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => handleRemove(item.itemType, item.itemId)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    <Badge className={`absolute top-2 left-2 ${getDifficultyColor(item.recipe.difficulty)}`}>
                      {item.recipe.difficulty}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{item.recipe.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.recipe.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.recipe.prepTime + item.recipe.cookTime} min
                      </span>
                      {item.recipe.calories && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {item.recipe.calories} cal
                        </span>
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <>
                  <div className={`aspect-video flex items-center justify-center relative ${
                    item.itemType === "ARTICLE"
                      ? "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20"
                      : "bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20"
                  }`}>
                    {item.itemType === "ARTICLE" ? (
                      <BookOpen className="w-12 h-12 text-blue-300" />
                    ) : (
                      <Play className="w-12 h-12 text-purple-300" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => handleRemove(item.itemType, item.itemId)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2">
                      {item.itemType === "ARTICLE" ? "Article" : "Video"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Saved on {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
