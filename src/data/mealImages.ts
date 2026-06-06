// Beautiful Unsplash images for common meals
// Using direct Unsplash URLs for high-quality food photography

export const mealImages: Record<string, string> = {
  // Breakfast items
  "greek yogurt with berries": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
  "avocado toast with eggs": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
  "protein smoothie": "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=400&h=300&fit=crop",
  "eggs and bacon": "https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=400&h=300&fit=crop",
  "protein oatmeal": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=300&fit=crop",
  "scrambled eggs with toast": "https://images.unsplash.com/photo-1482049016gy-8d0c86d7bdc?w=400&h=300&fit=crop",

  // Lunch items
  "grilled chicken salad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
  "quinoa buddha bowl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
  "tuna wrap": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
  "chicken breast with rice": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop",
  "beef burrito bowl": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400&h=300&fit=crop",
  "turkey sandwich": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&h=300&fit=crop",

  // Dinner items
  "grilled salmon with vegetables": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
  "chicken stir fry": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
  "lean beef with sweet potato": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop",
  "steak with vegetables": "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop",
  "grilled chicken thighs": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop",
  "pork chops with salad": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop",

  // Snacks
  "apple with almond butter": "https://images.unsplash.com/photo-1568702846914-96b305d2uj8c?w=400&h=300&fit=crop",
  "protein bar": "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=400&h=300&fit=crop",
  "cottage cheese": "https://images.unsplash.com/photo-1488477304112-4944851de03d?w=400&h=300&fit=crop",
  "protein shake": "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=300&fit=crop",
  "greek yogurt": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
  "beef jerky": "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
};

// Default images by meal type when specific meal not found
export const defaultMealImages: Record<string, string> = {
  BREAKFAST: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop",
  MORNING_SNACK: "https://images.unsplash.com/photo-1568702846914-96b305d2uj8c?w=400&h=300&fit=crop",
  LUNCH: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
  AFTERNOON_SNACK: "https://images.unsplash.com/photo-1568702846914-96b305d2uj8c?w=400&h=300&fit=crop",
  DINNER: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
  EVENING_SNACK: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
};

// Get meal image with fallback
export function getMealImage(mealName: string, mealType?: string): string {
  const normalizedName = mealName.toLowerCase().trim();

  // Try exact match first
  if (mealImages[normalizedName]) {
    return mealImages[normalizedName];
  }

  // Try partial match
  for (const [key, url] of Object.entries(mealImages)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return url;
    }
  }

  // Fall back to meal type default
  if (mealType && defaultMealImages[mealType]) {
    return defaultMealImages[mealType];
  }

  // Ultimate fallback - healthy bowl
  return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop";
}

// Motivational messages for weight management
export const motivationalMessages = {
  greeting: [
    "You're doing amazing",
    "Every step counts",
    "Keep going, you've got this",
    "Your consistency is inspiring",
    "Small changes, big results",
  ],
  mealLogging: [
    "Great choice! Nourishing your body well.",
    "You're making thoughtful food choices.",
    "Every meal is a fresh start.",
    "Fueling your success, one bite at a time.",
  ],
  weightTracking: [
    "Remember, it's about progress, not perfection.",
    "Your body is changing, even when the scale doesn't show it.",
    "Trust the process. You're doing great.",
    "Focus on how you feel, not just the number.",
  ],
  exercise: [
    "Movement is medicine. Well done!",
    "Every workout makes you stronger.",
    "You showed up for yourself today.",
    "Energy in, results out.",
  ],
  streak: [
    "You're on fire! Keep that momentum.",
    "Consistency is your superpower.",
    "Look at you go! Streak champion.",
  ],
  goalProgress: [
    "You're closer than you were yesterday.",
    "Every day brings you closer to your goal.",
    "Your dedication is paying off.",
  ],
};

export function getRandomMotivation(category: keyof typeof motivationalMessages): string {
  const messages = motivationalMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Daily wellness tips organized by category
export const dailyWellnessTips = {
  nutrition: [
    {
      title: "Eat the rainbow",
      content: "Aim for at least 3 different coloured vegetables with your meals today. Each colour provides unique nutrients your body needs.",
      icon: "nutrition"
    },
    {
      title: "Mindful eating",
      content: "Put your fork down between bites and chew thoroughly. It takes 20 minutes for your brain to register fullness.",
      icon: "nutrition"
    },
    {
      title: "Hydration matters",
      content: "Start your morning with a glass of water. Often what feels like hunger is actually thirst in disguise.",
      icon: "hydration"
    },
    {
      title: "Protein with every meal",
      content: "Including protein helps stabilise blood sugar and keeps you feeling satisfied for longer.",
      icon: "nutrition"
    },
    {
      title: "Prep for success",
      content: "Spend 30 minutes on the weekend prepping healthy snacks. Future you will thank present you!",
      icon: "nutrition"
    },
  ],
  movement: [
    {
      title: "Move every hour",
      content: "Set a gentle reminder to stand and stretch every hour. Small movements add up to big benefits.",
      icon: "movement"
    },
    {
      title: "Walk after meals",
      content: "A 10-minute walk after eating helps with digestion and blood sugar regulation.",
      icon: "movement"
    },
    {
      title: "Make it enjoyable",
      content: "The best exercise is the one you'll actually do. Find movement that brings you joy.",
      icon: "movement"
    },
    {
      title: "Strength matters",
      content: "Building muscle helps boost your metabolism, even at rest. Try adding some resistance training.",
      icon: "movement"
    },
  ],
  mindset: [
    {
      title: "Progress over perfection",
      content: "One 'off' meal doesn't undo all your progress. Be kind to yourself and keep moving forward.",
      icon: "mindset"
    },
    {
      title: "Celebrate small wins",
      content: "Did you drink more water today? Choose a salad? Take the stairs? These moments matter!",
      icon: "mindset"
    },
    {
      title: "Rest is productive",
      content: "Quality sleep is when your body repairs and recovers. Aim for 7-8 hours tonight.",
      icon: "mindset"
    },
    {
      title: "Your body is unique",
      content: "Comparison is the thief of joy. Focus on your own journey and celebrate your progress.",
      icon: "mindset"
    },
  ],
  wellness: [
    {
      title: "Stress less, weigh less",
      content: "High cortisol from stress can affect weight. Try 5 minutes of deep breathing today.",
      icon: "wellness"
    },
    {
      title: "Sleep and weight",
      content: "Poor sleep can increase hunger hormones. Prioritise winding down an hour before bed.",
      icon: "wellness"
    },
    {
      title: "Gut health matters",
      content: "Include fermented foods like yogurt or kimchi to support your gut microbiome.",
      icon: "wellness"
    },
  ],
};

// Inspirational quotes for the weight management journey
export const wellnessQuotes = [
  {
    quote: "Take care of your body. It's the only place you have to live.",
    author: "Jim Rohn"
  },
  {
    quote: "The groundwork for all happiness is good health.",
    author: "Leigh Hunt"
  },
  {
    quote: "Your body hears everything your mind says. Stay positive.",
    author: "Naomi Judd"
  },
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  },
  {
    quote: "It's not about being the best. It's about being better than you were yesterday.",
    author: "Unknown"
  },
  {
    quote: "You don't have to be perfect, you just have to be present.",
    author: "Unknown"
  },
  {
    quote: "Progress is progress, no matter how small.",
    author: "Unknown"
  },
  {
    quote: "Health is not about the weight you lose, but about the life you gain.",
    author: "Unknown"
  },
  {
    quote: "The only bad workout is the one that didn't happen.",
    author: "Unknown"
  },
  {
    quote: "Nourishing yourself in a way that helps you blossom is attainable.",
    author: "Deborah Day"
  },
  {
    quote: "Every accomplishment starts with the decision to try.",
    author: "John F. Kennedy"
  },
  {
    quote: "Your health is an investment, not an expense.",
    author: "Unknown"
  },
];

// Get a daily tip based on the day of the year (so it changes daily but is consistent throughout the day)
export function getDailyTip(): { title: string; content: string; icon: string; category: string } {
  const allTips = [
    ...dailyWellnessTips.nutrition.map(t => ({ ...t, category: "nutrition" })),
    ...dailyWellnessTips.movement.map(t => ({ ...t, category: "movement" })),
    ...dailyWellnessTips.mindset.map(t => ({ ...t, category: "mindset" })),
    ...dailyWellnessTips.wellness.map(t => ({ ...t, category: "wellness" })),
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const tipIndex = dayOfYear % allTips.length;

  return allTips[tipIndex];
}

// Get a daily quote based on the day of the year
export function getDailyQuote(): { quote: string; author: string } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const quoteIndex = dayOfYear % wellnessQuotes.length;

  return wellnessQuotes[quoteIndex];
}

// Get a random tip from a specific category
export function getRandomTip(category?: keyof typeof dailyWellnessTips): { title: string; content: string; icon: string } {
  if (category) {
    const tips = dailyWellnessTips[category];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  const allTips = [
    ...dailyWellnessTips.nutrition,
    ...dailyWellnessTips.movement,
    ...dailyWellnessTips.mindset,
    ...dailyWellnessTips.wellness,
  ];

  return allTips[Math.floor(Math.random() * allTips.length)];
}
