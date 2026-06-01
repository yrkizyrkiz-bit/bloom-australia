"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Play, Book, Search, Clock, ChevronRight,
  Sparkles, Heart, Zap, Brain, Dumbbell, Moon, Apple
} from "lucide-react";
import Link from "next/link";

const categories = [
  { id: "all", label: "All", icon: Book },
  { id: "hair", label: "Hair Loss", icon: Sparkles },
  { id: "ed", label: "Sexual Health", icon: Heart },
  { id: "vitality", label: "Vitality", icon: Zap },
  { id: "lifestyle", label: "Lifestyle", icon: Dumbbell },
];

const content = [
  {
    id: "1",
    title: "Understanding DHT & Hair Loss",
    description: "Learn how DHT causes male pattern baldness and what you can do about it.",
    category: "hair",
    type: "article",
    duration: "5 min read",
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop",
    featured: true,
  },
  {
    id: "2",
    title: "How Finasteride Works",
    description: "A deep dive into the science behind the most effective hair loss treatment.",
    category: "hair",
    type: "video",
    duration: "8 min",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=200&fit=crop",
  },
  {
    id: "3",
    title: "Natural Testosterone Optimization",
    description: "Evidence-based strategies to naturally support healthy testosterone levels.",
    category: "vitality",
    type: "article",
    duration: "7 min read",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop",
    featured: true,
  },
  {
    id: "4",
    title: "ED: Causes & Modern Treatments",
    description: "Understanding erectile dysfunction and the treatment options available.",
    category: "ed",
    type: "article",
    duration: "6 min read",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=200&fit=crop",
  },
  {
    id: "5",
    title: "Sleep & Men's Health",
    description: "How quality sleep impacts hormones, energy, and overall vitality.",
    category: "vitality",
    type: "video",
    duration: "10 min",
    image: "https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=300&h=200&fit=crop",
  },
  {
    id: "6",
    title: "Exercise for Hormone Health",
    description: "The best workout strategies to support testosterone and energy.",
    category: "lifestyle",
    type: "article",
    duration: "8 min read",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=200&fit=crop",
  },
  {
    id: "7",
    title: "Minoxidil: What to Expect",
    description: "Timeline, results, and how to maximize effectiveness.",
    category: "hair",
    type: "article",
    duration: "5 min read",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=200&fit=crop",
  },
  {
    id: "8",
    title: "Stress, Cortisol & Your Health",
    description: "Managing stress for better energy, sleep, and hormonal balance.",
    category: "vitality",
    type: "video",
    duration: "12 min",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop",
  },
  {
    id: "9",
    title: "Sildenafil vs Tadalafil",
    description: "Comparing the two most popular ED medications.",
    category: "ed",
    type: "article",
    duration: "4 min read",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop",
  },
  {
    id: "10",
    title: "Nutrition for Men's Health",
    description: "Foods that support testosterone, energy, and overall wellbeing.",
    category: "lifestyle",
    type: "article",
    duration: "6 min read",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=200&fit=crop",
  },
];

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContent = content.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredContent = content.filter((item) => item.featured);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mens-health">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Book className="w-6 h-6 text-teal-600" />
            Learn
          </h1>
          <p className="text-muted-foreground">Educational content for your journey</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search articles and videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 ${selectedCategory === cat.id ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
          >
            <cat.icon className="w-4 h-4 mr-2" />
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Featured (only show when no search) */}
      {!searchQuery && selectedCategory === "all" && (
        <div>
          <h2 className="text-lg font-bold mb-3">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredContent.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="relative h-40">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge className={`${item.type === 'video' ? 'bg-red-500' : 'bg-teal-500'}`}>
                      {item.type === 'video' ? <Play className="w-3 h-3 mr-1" /> : <Book className="w-3 h-3 mr-1" />}
                      {item.type}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-white/80 line-clamp-1">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div>
        <h2 className="text-lg font-bold mb-3">
          {selectedCategory === "all" ? "All Content" : categories.find(c => c.id === selectedCategory)?.label}
        </h2>
        <div className="space-y-3">
          {filteredContent.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-teal-600 ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {categories.find(c => c.id === item.category)?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.duration}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground self-end" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* No Results */}
      {filteredContent.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="font-medium">No content found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
