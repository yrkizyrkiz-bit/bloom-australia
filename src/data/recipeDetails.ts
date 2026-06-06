// Detailed recipe information - ingredients, instructions, and video URLs

export interface RecipeDetails {
  ingredients: string[];
  instructions: string[];
  videoUrl?: string;
  tips?: string[];
}

// Recipe details indexed by recipe ID
export const RECIPE_DETAILS: Record<string, RecipeDetails> = {
  // ==================== BREAKFAST ====================
  "b1": { // Greek Yogurt Parfait
    ingredients: [
      "1 cup Greek yogurt (plain or vanilla)",
      "1/2 cup mixed fresh berries",
      "1/4 cup granola",
      "1 tbsp honey",
      "1 tbsp chia seeds",
      "Fresh mint for garnish"
    ],
    instructions: [
      "Add a layer of Greek yogurt to a glass or jar.",
      "Top with a layer of mixed berries.",
      "Sprinkle granola over the berries.",
      "Repeat layers until glass is full.",
      "Drizzle with honey and add chia seeds.",
      "Garnish with mint and serve immediately."
    ],
    videoUrl: "https://www.youtube.com/embed/ZMQbHMgK2rw",
    tips: ["Use full-fat Greek yogurt for creamier texture", "Make ahead and store without granola to keep it crunchy"]
  },
  "b2": { // Avocado Toast with Poached Eggs
    ingredients: [
      "2 slices sourdough bread",
      "1 ripe avocado",
      "2 large eggs",
      "1 tbsp white vinegar",
      "Salt and pepper to taste",
      "Everything bagel seasoning",
      "Red pepper flakes (optional)",
      "Fresh lemon juice"
    ],
    instructions: [
      "Toast the sourdough bread until golden and crispy.",
      "Bring a pot of water to a gentle simmer, add vinegar.",
      "Create a whirlpool and crack eggs into the water one at a time.",
      "Poach for 3-4 minutes until whites are set but yolks are runny.",
      "Mash avocado with lemon juice, salt, and pepper.",
      "Spread avocado mixture on toast.",
      "Top each toast with a poached egg.",
      "Season with everything bagel seasoning and red pepper flakes."
    ],
    videoUrl: "https://www.youtube.com/embed/66btvAWmp7g",
    tips: ["Use room temperature eggs for better poaching", "Add vinegar to help egg whites coagulate"]
  },
  "b3": { // Overnight Oats
    ingredients: [
      "1/2 cup rolled oats",
      "1/2 cup almond milk",
      "1/4 cup Greek yogurt",
      "1 tbsp chia seeds",
      "1 tbsp maple syrup",
      "1/2 tsp vanilla extract",
      "Pinch of salt",
      "Fresh fruit for topping",
      "Nuts and seeds for topping"
    ],
    instructions: [
      "Combine oats, almond milk, yogurt, and chia seeds in a jar.",
      "Add maple syrup, vanilla, and salt. Mix well.",
      "Cover and refrigerate overnight (at least 6 hours).",
      "In the morning, stir and add more milk if needed.",
      "Top with fresh fruit, nuts, and seeds.",
      "Enjoy cold or warm in the microwave for 1-2 minutes."
    ],
    videoUrl: "https://www.youtube.com/embed/NvAEJVKIbRo",
    tips: ["Prep multiple jars for the week", "Try different flavor combos like PB&J or apple cinnamon"]
  },
  "b4": { // Açaí Smoothie Bowl
    ingredients: [
      "2 frozen açaí packets (unsweetened)",
      "1 frozen banana",
      "1/2 cup frozen mixed berries",
      "1/4 cup almond milk",
      "Toppings: granola, fresh berries, sliced banana",
      "Coconut flakes",
      "Chia seeds",
      "Honey or agave"
    ],
    instructions: [
      "Run açaí packets under warm water for 10 seconds to soften.",
      "Break açaí into chunks and add to blender.",
      "Add frozen banana, berries, and almond milk.",
      "Blend until thick and creamy (like soft serve).",
      "Pour into a bowl.",
      "Arrange toppings in rows: granola, berries, banana.",
      "Sprinkle with coconut and chia seeds.",
      "Drizzle with honey and serve immediately."
    ],
    videoUrl: "https://www.youtube.com/embed/eQICQipQlWQ",
    tips: ["Use minimal liquid for a thick consistency", "Freeze your bowl beforehand to keep it cold longer"]
  },
  "b5": { // Veggie Omelette
    ingredients: [
      "3 large eggs",
      "2 tbsp milk",
      "1 tbsp butter",
      "1/4 cup spinach, chopped",
      "1/4 cup mushrooms, sliced",
      "2 tbsp diced tomatoes",
      "2 tbsp crumbled feta cheese",
      "Salt and pepper",
      "Fresh herbs (chives, parsley)"
    ],
    instructions: [
      "Whisk eggs with milk, salt, and pepper.",
      "Heat butter in a non-stick pan over medium heat.",
      "Sauté mushrooms for 2 minutes until softened.",
      "Add spinach and cook until wilted, set aside.",
      "Add more butter to pan if needed, pour in eggs.",
      "Let eggs set slightly, then gently push edges toward center.",
      "When almost set, add veggies and feta to one half.",
      "Fold omelette in half and slide onto plate.",
      "Garnish with fresh herbs."
    ],
    videoUrl: "https://www.youtube.com/embed/OQyRuOjVPfE",
    tips: ["Don't overcook - omelette should be slightly creamy inside", "Keep the heat medium to prevent browning"]
  },
  "b6": { // Banana Pancakes
    ingredients: [
      "1 cup whole wheat flour",
      "1 ripe banana, mashed",
      "1 egg",
      "3/4 cup milk",
      "1 tbsp honey",
      "1 tsp baking powder",
      "1/2 tsp cinnamon",
      "Pinch of salt",
      "Butter for cooking",
      "Fresh berries and maple syrup for serving"
    ],
    instructions: [
      "Mash banana in a large bowl until smooth.",
      "Add egg, milk, and honey. Whisk together.",
      "In another bowl, mix flour, baking powder, cinnamon, and salt.",
      "Add dry ingredients to wet and stir until just combined.",
      "Heat a non-stick pan over medium heat, add butter.",
      "Pour 1/4 cup batter per pancake.",
      "Cook until bubbles form, flip and cook 2 more minutes.",
      "Serve with fresh berries and maple syrup."
    ],
    videoUrl: "https://www.youtube.com/embed/qdAoXNNrj_M",
    tips: ["Don't overmix the batter - lumps are okay", "Wait for bubbles before flipping"]
  },
  "b7": { // Breakfast Burrito
    ingredients: [
      "1 large whole wheat tortilla",
      "2 scrambled eggs",
      "1/4 cup black beans, drained",
      "1/4 avocado, sliced",
      "2 tbsp salsa",
      "2 tbsp shredded cheese",
      "2 tbsp sour cream",
      "Hot sauce (optional)",
      "Fresh cilantro"
    ],
    instructions: [
      "Scramble eggs in a pan until just set.",
      "Warm the tortilla in a dry pan or microwave.",
      "Layer eggs in the center of the tortilla.",
      "Add black beans, cheese, and avocado slices.",
      "Top with salsa and sour cream.",
      "Add hot sauce and cilantro if desired.",
      "Fold in the sides, then roll up tightly.",
      "Cut in half and serve warm."
    ],
    videoUrl: "https://www.youtube.com/embed/N3MVVD-SNQY",
    tips: ["Warm the tortilla so it doesn't crack when rolling", "Don't overfill or it won't close properly"]
  },
  "b8": { // Chia Pudding
    ingredients: [
      "1/4 cup chia seeds",
      "1 cup coconut milk",
      "1 tbsp maple syrup",
      "1/2 tsp vanilla extract",
      "1/4 cup diced mango",
      "2 tbsp passion fruit pulp",
      "Toasted coconut flakes"
    ],
    instructions: [
      "Mix chia seeds, coconut milk, maple syrup, and vanilla.",
      "Stir well to prevent clumping.",
      "Cover and refrigerate for at least 4 hours or overnight.",
      "Stir again before serving.",
      "Top with diced mango and passion fruit.",
      "Sprinkle with toasted coconut flakes.",
      "Serve chilled."
    ],
    videoUrl: "https://www.youtube.com/embed/ZBM3d1Q9UX0",
    tips: ["Stir after 10 minutes to prevent clumping", "Pudding keeps for 5 days in the fridge"]
  },
  "b9": { // Smoked Salmon Bagel
    ingredients: [
      "1 everything bagel",
      "3 oz smoked salmon",
      "2 tbsp cream cheese",
      "1 tbsp capers",
      "2 thin slices red onion",
      "Fresh dill sprigs",
      "Lemon wedge",
      "Freshly cracked black pepper"
    ],
    instructions: [
      "Slice and toast the bagel until golden.",
      "Spread cream cheese on both halves.",
      "Layer smoked salmon on the bottom half.",
      "Add red onion slices and capers.",
      "Top with fresh dill.",
      "Squeeze lemon juice over the salmon.",
      "Season with black pepper.",
      "Place top half of bagel and serve."
    ],
    videoUrl: "https://www.youtube.com/embed/yq7PVeE2nPM",
    tips: ["Use cold-smoked salmon for best flavor", "Let cream cheese soften for easier spreading"]
  },
  "b10": { // Green Smoothie
    ingredients: [
      "1 cup fresh spinach",
      "1 frozen banana",
      "1/2 cup frozen mango chunks",
      "1 scoop vanilla protein powder",
      "1 cup almond milk",
      "1 tbsp almond butter",
      "1/2 cup ice"
    ],
    instructions: [
      "Add almond milk to blender first.",
      "Add spinach and blend until smooth.",
      "Add frozen banana, mango, and protein powder.",
      "Add almond butter and ice.",
      "Blend until completely smooth.",
      "Pour into a glass and serve immediately."
    ],
    videoUrl: "https://www.youtube.com/embed/BIYjcLqD3Qg",
    tips: ["Add liquid first for easier blending", "Use frozen fruit for a thicker smoothie"]
  },

  // ==================== LUNCH ====================
  "l1": { // Grilled Chicken Caesar Salad
    ingredients: [
      "2 chicken breasts",
      "1 large head romaine lettuce",
      "1/2 cup Caesar dressing",
      "1/2 cup parmesan, shaved",
      "1 cup croutons",
      "2 tbsp olive oil",
      "Salt and pepper",
      "Lemon wedges"
    ],
    instructions: [
      "Season chicken with olive oil, salt, and pepper.",
      "Grill chicken over medium-high heat for 6-7 minutes per side.",
      "Let chicken rest for 5 minutes, then slice.",
      "Chop romaine lettuce and place in a large bowl.",
      "Toss lettuce with Caesar dressing.",
      "Top with sliced chicken and croutons.",
      "Add shaved parmesan and serve with lemon wedges."
    ],
    videoUrl: "https://www.youtube.com/embed/a4Z2x0sPq0k",
    tips: ["Let chicken rest before slicing to keep it juicy", "Toss salad just before serving"]
  },
  "l2": { // Buddha Bowl
    ingredients: [
      "1 cup cooked quinoa",
      "1 cup roasted chickpeas",
      "1/2 avocado, sliced",
      "1 cup roasted sweet potato cubes",
      "1 cup mixed greens",
      "1/4 cup shredded red cabbage",
      "2 tbsp tahini",
      "1 tbsp lemon juice",
      "1 tbsp olive oil",
      "Salt, pepper, and cumin"
    ],
    instructions: [
      "Cook quinoa according to package directions.",
      "Toss chickpeas with olive oil, cumin, salt, and roast at 400°F for 25 min.",
      "Roast sweet potato cubes at 400°F for 20 minutes.",
      "Make tahini dressing: mix tahini, lemon, water, salt.",
      "Arrange quinoa as base in a bowl.",
      "Add sections of chickpeas, sweet potato, greens, cabbage.",
      "Top with sliced avocado.",
      "Drizzle with tahini dressing."
    ],
    videoUrl: "https://www.youtube.com/embed/Uwi1-ihuPr4",
    tips: ["Prep components ahead for quick assembly", "Customize with your favorite vegetables"]
  },
  "l3": { // Mediterranean Wrap
    ingredients: [
      "1 large whole wheat wrap",
      "1/4 cup hummus",
      "4 falafel balls",
      "1/4 cucumber, sliced",
      "1/4 cup cherry tomatoes, halved",
      "2 tbsp crumbled feta",
      "2 tbsp tzatziki sauce",
      "Mixed greens",
      "Pickled onions"
    ],
    instructions: [
      "Warm falafel according to package directions.",
      "Lay wrap flat and spread hummus across the center.",
      "Add mixed greens as a base.",
      "Place falafel in a row down the center.",
      "Add cucumber, tomatoes, and pickled onions.",
      "Crumble feta over the top.",
      "Drizzle with tzatziki.",
      "Fold in sides and roll tightly."
    ],
    videoUrl: "https://www.youtube.com/embed/6LUzC_FXl8U",
    tips: ["Don't overfill the wrap", "Warm the wrap slightly for easier rolling"]
  },
  "l4": { // Poke Bowl
    ingredients: [
      "8 oz sushi-grade ahi tuna",
      "1 cup sushi rice, cooked",
      "1/2 cup edamame, shelled",
      "1/2 cucumber, sliced",
      "1/2 avocado, sliced",
      "2 tbsp soy sauce",
      "1 tsp sesame oil",
      "1 tbsp rice vinegar",
      "Pickled ginger",
      "Sesame seeds",
      "Spicy mayo"
    ],
    instructions: [
      "Cut tuna into 1/2 inch cubes.",
      "Marinate tuna in soy sauce, sesame oil, and rice vinegar for 15 min.",
      "Cook sushi rice and let cool slightly.",
      "Place rice in a bowl as the base.",
      "Arrange tuna, edamame, cucumber, and avocado in sections.",
      "Add pickled ginger on the side.",
      "Drizzle with spicy mayo.",
      "Sprinkle with sesame seeds."
    ],
    videoUrl: "https://www.youtube.com/embed/oIw2NYF3tHc",
    tips: ["Use sushi-grade fish only", "Keep fish refrigerated until ready to serve"]
  },
  "l5": { // Caprese Sandwich
    ingredients: [
      "1 ciabatta roll",
      "4 oz fresh mozzarella, sliced",
      "1 large ripe tomato, sliced",
      "Fresh basil leaves",
      "2 tbsp balsamic glaze",
      "1 tbsp olive oil",
      "Salt and pepper",
      "Optional: pesto"
    ],
    instructions: [
      "Slice ciabatta roll in half horizontally.",
      "Drizzle cut sides with olive oil.",
      "Toast under broiler until lightly golden.",
      "Layer mozzarella slices on bottom half.",
      "Add tomato slices and season with salt and pepper.",
      "Add fresh basil leaves.",
      "Drizzle with balsamic glaze.",
      "Add pesto if using, then top with other half."
    ],
    videoUrl: "https://www.youtube.com/embed/h_UqpWcXins",
    tips: ["Use room temperature tomatoes for best flavor", "Don't skip the balsamic glaze"]
  },

  // ==================== DINNER ====================
  "d1": { // Grilled Salmon with Asparagus
    ingredients: [
      "2 salmon fillets (6 oz each)",
      "1 bunch asparagus, trimmed",
      "3 tbsp olive oil",
      "2 tbsp butter",
      "2 cloves garlic, minced",
      "1 lemon, juiced and zested",
      "Fresh dill",
      "Salt and pepper"
    ],
    instructions: [
      "Preheat grill to medium-high heat.",
      "Brush salmon with olive oil, season with salt, pepper, and lemon zest.",
      "Toss asparagus with olive oil, salt, and pepper.",
      "Grill salmon skin-side down for 4-5 minutes.",
      "Flip and grill 3-4 more minutes until cooked through.",
      "Grill asparagus for 3-4 minutes, turning occasionally.",
      "Make lemon butter: melt butter with garlic and lemon juice.",
      "Serve salmon and asparagus drizzled with lemon butter and dill."
    ],
    videoUrl: "https://www.youtube.com/embed/b0ahREpQqsM",
    tips: ["Don't move salmon too soon - let it release naturally", "Asparagus should still have a slight crunch"]
  },
  "d2": { // Chicken Stir-Fry
    ingredients: [
      "1 lb chicken breast, sliced thin",
      "2 cups mixed vegetables (bell peppers, broccoli, snap peas)",
      "3 cloves garlic, minced",
      "1 inch ginger, minced",
      "3 tbsp soy sauce",
      "1 tbsp sesame oil",
      "1 tbsp cornstarch",
      "2 tbsp vegetable oil",
      "Cooked jasmine rice",
      "Green onions and sesame seeds"
    ],
    instructions: [
      "Toss chicken with 1 tbsp soy sauce and cornstarch.",
      "Heat vegetable oil in a wok over high heat.",
      "Stir-fry chicken until golden, about 4-5 minutes. Remove.",
      "Add more oil if needed, stir-fry vegetables for 3 minutes.",
      "Add garlic and ginger, cook 30 seconds.",
      "Return chicken to wok.",
      "Add remaining soy sauce and sesame oil, toss well.",
      "Serve over rice with green onions and sesame seeds."
    ],
    videoUrl: "https://www.youtube.com/embed/2Mn4Yj-8pII",
    tips: ["Keep wok very hot for best results", "Don't overcrowd the pan"]
  },
  "d3": { // Beef Tenderloin
    ingredients: [
      "2 beef tenderloin steaks (6 oz each)",
      "1 lb baby potatoes",
      "1/2 lb green beans",
      "4 tbsp butter",
      "2 sprigs fresh rosemary",
      "3 cloves garlic",
      "1/2 cup red wine",
      "1 cup beef broth",
      "Salt and pepper"
    ],
    instructions: [
      "Season steaks generously with salt and pepper.",
      "Roast potatoes at 400°F for 25 minutes.",
      "Heat cast iron pan over high heat with oil.",
      "Sear steaks 3-4 minutes per side for medium-rare.",
      "Add butter, rosemary, and garlic, baste steaks.",
      "Remove steaks and rest for 5 minutes.",
      "Add wine to pan, scrape up bits, add broth and reduce.",
      "Blanch green beans, serve with steak and sauce."
    ],
    videoUrl: "https://www.youtube.com/embed/AmC9SmCBUj4",
    tips: ["Let steak come to room temperature before cooking", "Use a meat thermometer for perfect doneness"]
  },
  "d4": { // Shrimp Pasta
    ingredients: [
      "1 lb linguine",
      "1 lb large shrimp, peeled",
      "4 cloves garlic, sliced",
      "1 cup cherry tomatoes, halved",
      "2 cups fresh spinach",
      "1/2 cup white wine",
      "4 tbsp butter",
      "1/4 cup parmesan",
      "Red pepper flakes",
      "Fresh parsley"
    ],
    instructions: [
      "Cook pasta according to package, reserve 1 cup pasta water.",
      "Season shrimp with salt and pepper.",
      "Sauté shrimp in butter until pink, about 2 minutes per side. Remove.",
      "Add garlic and red pepper flakes, cook 30 seconds.",
      "Add tomatoes and cook 2 minutes.",
      "Add wine, let reduce by half.",
      "Add spinach and let wilt.",
      "Toss in pasta, shrimp, and pasta water as needed.",
      "Top with parmesan and parsley."
    ],
    videoUrl: "https://www.youtube.com/embed/iRcVih_sd6A",
    tips: ["Don't overcook shrimp - they cook quickly", "Pasta water helps create a silky sauce"]
  },
  "d5": { // Vegetable Curry
    ingredients: [
      "1 can chickpeas, drained",
      "1 large sweet potato, cubed",
      "2 cups fresh spinach",
      "1 can coconut milk",
      "2 tbsp curry paste",
      "1 onion, diced",
      "3 cloves garlic",
      "1 inch ginger",
      "Cooked basmati rice",
      "Fresh cilantro"
    ],
    instructions: [
      "Sauté onion until soft, about 5 minutes.",
      "Add garlic and ginger, cook 1 minute.",
      "Stir in curry paste and cook 1 minute.",
      "Add sweet potato and stir to coat.",
      "Pour in coconut milk and 1/2 cup water.",
      "Simmer for 15 minutes until sweet potato is tender.",
      "Add chickpeas and spinach, cook 5 more minutes.",
      "Serve over rice with fresh cilantro."
    ],
    videoUrl: "https://www.youtube.com/embed/rHA7oAplp9k",
    tips: ["Adjust curry paste amount to your spice preference", "Add a squeeze of lime at the end"]
  },

  // ==================== SNACKS ====================
  "s1": { // Hummus & Veggie Sticks
    ingredients: [
      "1 can chickpeas",
      "1/4 cup tahini",
      "2 cloves garlic",
      "3 tbsp lemon juice",
      "2 tbsp olive oil",
      "1/2 tsp cumin",
      "Salt to taste",
      "Carrots, cucumber, bell peppers for dipping"
    ],
    instructions: [
      "Drain chickpeas, reserve liquid.",
      "Add chickpeas, tahini, garlic, lemon, and cumin to food processor.",
      "Blend until smooth, adding reserved liquid as needed.",
      "Drizzle in olive oil while blending.",
      "Season with salt and more lemon if desired.",
      "Cut vegetables into sticks.",
      "Serve hummus drizzled with olive oil and paprika."
    ],
    videoUrl: "https://www.youtube.com/embed/Cs7cCFSNrBo",
    tips: ["Blend for at least 3 minutes for smooth hummus", "Removing chickpea skins makes it extra creamy"]
  },
  "s2": { // Protein Energy Balls
    ingredients: [
      "1 cup rolled oats",
      "1/2 cup peanut butter",
      "1/3 cup honey",
      "1/2 cup chocolate chips",
      "2 tbsp ground flaxseed",
      "1 scoop vanilla protein powder",
      "1 tsp vanilla extract"
    ],
    instructions: [
      "Mix all ingredients in a large bowl until combined.",
      "Refrigerate mixture for 30 minutes.",
      "Roll into 1-inch balls using your hands.",
      "Place on a baking sheet lined with parchment.",
      "Refrigerate until firm, about 1 hour.",
      "Store in an airtight container in the fridge."
    ],
    videoUrl: "https://www.youtube.com/embed/7xCIJfgJgSw",
    tips: ["Wet hands slightly to prevent sticking", "Can be frozen for up to 3 months"]
  },

  // ==================== DESSERTS ====================
  "de1": { // Dark Chocolate Mousse
    ingredients: [
      "8 oz dark chocolate (70%)",
      "3 large eggs, separated",
      "2 tbsp sugar",
      "1 cup heavy cream",
      "1 tsp vanilla extract",
      "Pinch of salt",
      "Fresh raspberries"
    ],
    instructions: [
      "Melt chocolate in a double boiler, let cool slightly.",
      "Whisk egg yolks and add to cooled chocolate.",
      "Beat egg whites with salt until soft peaks form.",
      "Add sugar and beat until stiff peaks.",
      "Whip cream with vanilla to soft peaks.",
      "Fold egg whites into chocolate mixture.",
      "Fold in whipped cream until combined.",
      "Divide among glasses and chill for 4 hours.",
      "Top with raspberries before serving."
    ],
    videoUrl: "https://www.youtube.com/embed/B8-E_3qE4Es",
    tips: ["Don't overfold - keep it light and airy", "Use high-quality chocolate for best results"]
  },
  "de2": { // Berry Frozen Yogurt
    ingredients: [
      "2 cups frozen mixed berries",
      "1 cup Greek yogurt",
      "3 tbsp honey",
      "1 tsp lemon juice",
      "Fresh berries for topping"
    ],
    instructions: [
      "Add frozen berries to food processor.",
      "Blend until broken down.",
      "Add yogurt, honey, and lemon juice.",
      "Blend until smooth and creamy.",
      "Serve immediately for soft-serve texture.",
      "Or freeze for 2 hours for firmer texture.",
      "Top with fresh berries."
    ],
    videoUrl: "https://www.youtube.com/embed/YzHpCpLMXhY",
    tips: ["Use very frozen fruit for best texture", "Add more honey if berries are tart"]
  },
  "de3": { // Banana Nice Cream
    ingredients: [
      "4 frozen ripe bananas",
      "2 tbsp peanut butter",
      "2 tbsp dark chocolate chips",
      "1 tsp vanilla extract",
      "Splash of almond milk if needed"
    ],
    instructions: [
      "Slice bananas before freezing for easier blending.",
      "Add frozen bananas to food processor.",
      "Blend, scraping down sides, until creamy.",
      "Add peanut butter and vanilla, blend again.",
      "Fold in chocolate chips.",
      "Serve immediately or freeze for firmer texture."
    ],
    videoUrl: "https://www.youtube.com/embed/TIwzp0ZBl-8",
    tips: ["Very ripe bananas (with brown spots) are sweetest", "Freeze bananas when overripe for future use"]
  }
};

// Helper function to get full recipe with details
export function getRecipeWithDetails(recipeId: string): RecipeDetails | undefined {
  return RECIPE_DETAILS[recipeId];
}

// Get all recipe IDs that have detailed instructions
export function getDetailedRecipeIds(): string[] {
  return Object.keys(RECIPE_DETAILS);
}
