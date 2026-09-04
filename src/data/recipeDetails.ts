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
      "3/4 cup almond milk",
      "1 tbsp chia seeds",
      "1 tbsp maple syrup",
      "1/2 tsp vanilla extract",
      "Pinch of salt",
      "Fresh fruit for topping",
      "Nuts and seeds for topping"
    ],
    instructions: [
      "Combine oats, almond milk, and chia seeds in a jar.",
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
      "4 beef tenderloin steaks (6 oz / 170 g each)",
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
  },

  // ==================== LUNCH (continued) ====================
  "l6": { // Thai Chicken Lettuce Wraps
    ingredients: [
      "500 g lean ground chicken",
      "1 tbsp sesame oil",
      "2 cloves garlic, minced",
      "1 tbsp fresh ginger, minced",
      "1/2 cup water chestnuts, diced",
      "2 tbsp soy sauce",
      "1 tbsp lime juice",
      "1 tsp chilli flakes (optional)",
      "8 large lettuce leaves (cos or iceberg)",
      "2 tbsp peanut sauce",
      "Fresh coriander and sliced spring onion"
    ],
    instructions: [
      "Heat sesame oil in a pan over medium-high heat.",
      "Add garlic and ginger, cook 30 seconds until fragrant.",
      "Add ground chicken and cook, breaking it up, until browned.",
      "Stir in water chestnuts, soy sauce, lime juice, and chilli.",
      "Cook 2 more minutes until the liquid reduces.",
      "Spoon the chicken into lettuce cups.",
      "Drizzle with peanut sauce and top with coriander and spring onion.",
      "Serve immediately while the lettuce is crisp."
    ],
    tips: ["Pat lettuce dry so the filling does not make the cups soggy", "Swap chicken for turkey if you prefer a milder flavour"]
  },
  "l7": { // Quinoa Tabbouleh
    ingredients: [
      "1 cup quinoa, rinsed",
      "2 cups water",
      "2 cups fresh parsley, finely chopped",
      "1/2 cup fresh mint, chopped",
      "2 tomatoes, diced",
      "1 cucumber, diced",
      "3 tbsp olive oil",
      "3 tbsp lemon juice",
      "Salt and pepper to taste"
    ],
    instructions: [
      "Cook quinoa in water until fluffy, about 15 minutes. Let cool.",
      "Fluff quinoa with a fork and transfer to a large bowl.",
      "Add parsley, mint, tomatoes, and cucumber.",
      "Whisk olive oil, lemon juice, salt, and pepper.",
      "Pour dressing over the salad and toss well.",
      "Chill 15 minutes so the flavours settle, then serve."
    ],
    tips: ["Cool the quinoa fully before mixing or the herbs will wilt", "Make it a day ahead; the lemon dressing improves overnight"]
  },
  "l8": { // Turkey & Avocado Club
    ingredients: [
      "3 slices wholegrain bread",
      "120 g sliced roast turkey",
      "2 rashers bacon, cooked",
      "1/2 ripe avocado, sliced",
      "2 lettuce leaves",
      "2 slices tomato",
      "1 tbsp mayonnaise",
      "Salt and pepper"
    ],
    instructions: [
      "Toast the bread until golden.",
      "Spread mayonnaise on one side of each slice.",
      "Layer turkey, lettuce, and tomato on the first slice.",
      "Add the middle slice of bread.",
      "Layer bacon and avocado, then season with salt and pepper.",
      "Top with the last slice, cut into triangles, and serve."
    ],
    tips: ["Toast the bread well so the sandwich stays sturdy", "A squeeze of lemon on the avocado stops it browning"]
  },
  "l9": { // Asian Noodle Salad
    ingredients: [
      "200 g rice noodles",
      "1 cup shelled edamame",
      "1 carrot, julienned",
      "1 cup shredded cabbage",
      "2 tbsp soy sauce",
      "1 tbsp rice vinegar",
      "1 tbsp sesame oil",
      "1 tsp grated ginger",
      "1 tsp honey",
      "Sesame seeds and sliced spring onion"
    ],
    instructions: [
      "Cook rice noodles according to the packet, rinse under cold water, and drain.",
      "Blanch edamame for 2 minutes, then cool.",
      "Whisk soy sauce, rice vinegar, sesame oil, ginger, and honey.",
      "Toss noodles with edamame, carrot, and cabbage.",
      "Pour over the dressing and toss to coat.",
      "Top with sesame seeds and spring onion. Serve cold."
    ],
    tips: ["Rinse noodles well so they do not clump", "Keeps 2 days in the fridge for packed lunches"]
  },
  "l10": { // Chicken Burrito Bowl
    ingredients: [
      "2 chicken breasts",
      "1 cup cooked cilantro lime rice (rice cooked with lime juice and chopped coriander)",
      "1/2 cup black beans, rinsed",
      "1/2 cup corn kernels",
      "1/2 cup pico de gallo",
      "1/2 avocado, mashed into guacamole with lime and salt",
      "1 tsp cumin",
      "1 tsp smoked paprika",
      "1 tbsp olive oil",
      "Lime wedges, salt and pepper"
    ],
    instructions: [
      "Season chicken with cumin, paprika, salt, and pepper.",
      "Pan-sear in olive oil until cooked through, about 6 minutes per side. Rest and slice.",
      "Divide rice between two bowls.",
      "Add black beans, corn, pico de gallo, and avocado.",
      "Top with sliced chicken.",
      "Squeeze lime over the bowls and serve."
    ],
    tips: ["Char the corn in a dry pan for extra flavour", "Meal-prep the rice and chicken up to 3 days ahead"]
  },

  // ==================== DINNER (continued) ====================
  "d6": { // Herb Roasted Chicken
    ingredients: [
      "8 bone-in chicken thighs",
      "4 cloves garlic, minced",
      "2 tbsp olive oil",
      "1 tbsp fresh rosemary, chopped",
      "1 tbsp fresh thyme, chopped",
      "500 g mixed roasting vegetables (carrot, zucchini, onion)",
      "1 lemon, sliced",
      "Salt and pepper"
    ],
    instructions: [
      "Preheat oven to 200°C.",
      "Toss chicken with olive oil, garlic, rosemary, thyme, salt, and pepper.",
      "Spread vegetables on a roasting tray and nestle the chicken on top.",
      "Tuck lemon slices around the tray.",
      "Roast 40–45 minutes until the chicken is golden and cooked through.",
      "Rest 5 minutes, then serve with the pan vegetables."
    ],
    tips: ["Pat chicken dry so the skin crisps", "Use a thermometer; thighs are done at 74°C"]
  },
  "d7": { // Teriyaki Salmon Bowl
    ingredients: [
      "2 salmon fillets (150 g each)",
      "1 cup cooked brown rice",
      "2 cups broccoli florets",
      "3 tbsp teriyaki sauce",
      "1 tsp sesame oil",
      "1 tsp grated ginger",
      "Pickled ginger, to serve",
      "Sesame seeds and spring onion"
    ],
    instructions: [
      "Mix teriyaki sauce, sesame oil, and ginger.",
      "Brush salmon with half the sauce and rest 10 minutes.",
      "Steam or microwave broccoli until just tender.",
      "Pan-sear salmon 3–4 minutes per side, brushing with remaining sauce.",
      "Divide rice between bowls, add broccoli and salmon.",
      "Top with pickled ginger, sesame seeds, and spring onion."
    ],
    tips: ["Do not overcook the salmon; it should flake but stay moist", "Use low-sodium teriyaki if you are watching salt"]
  },
  "d8": { // Stuffed Bell Peppers
    ingredients: [
      "4 large bell peppers, halved and seeded",
      "400 g lean ground turkey",
      "1 cup cooked quinoa",
      "1 cup diced tomatoes",
      "1/2 onion, diced",
      "2 cloves garlic, minced",
      "1 tsp Italian herbs",
      "1/2 cup grated cheese",
      "1 tbsp olive oil",
      "Salt and pepper"
    ],
    instructions: [
      "Preheat oven to 190°C.",
      "Sauté onion and garlic in olive oil until soft.",
      "Add turkey and cook until browned. Stir in tomatoes, quinoa, herbs, salt, and pepper.",
      "Fill pepper halves with the turkey mixture.",
      "Place in a baking dish with a splash of water in the base.",
      "Cover and bake 25 minutes, then uncover, add cheese, and bake 10 minutes more."
    ],
    tips: ["Choose peppers that sit flat so they do not tip", "Leftovers reheat well for lunch the next day"]
  },
  "d9": { // Lemon Garlic Shrimp
    ingredients: [
      "400 g raw shrimp, peeled and deveined",
      "3 zucchini, spiralised into noodles",
      "3 cloves garlic, minced",
      "2 tbsp butter",
      "1 tbsp olive oil",
      "Juice and zest of 1 lemon",
      "Pinch of chilli flakes",
      "Fresh parsley, salt and pepper"
    ],
    instructions: [
      "Pat shrimp dry and season with salt and pepper.",
      "Heat butter and olive oil in a large pan over medium-high heat.",
      "Add garlic and chilli, cook 30 seconds.",
      "Add shrimp and cook 1–2 minutes per side until pink.",
      "Stir in lemon juice and zest.",
      "Toss in zucchini noodles for 1–2 minutes until just warmed.",
      "Finish with parsley and serve immediately."
    ],
    tips: ["Zucchini noodles only need a minute or they go watery", "Have everything chopped before you start; shrimp cook fast"]
  },
  "d10": { // Mushroom Risotto
    ingredients: [
      "1 1/2 cups arborio rice",
      "300 g mixed mushrooms, sliced",
      "1 onion, finely diced",
      "2 cloves garlic, minced",
      "1/2 cup dry white wine",
      "4 cups warm vegetable stock",
      "1/2 cup grated parmesan",
      "2 tbsp olive oil",
      "1 tbsp butter",
      "Fresh thyme, salt and pepper"
    ],
    instructions: [
      "Sauté mushrooms in olive oil until golden. Set aside.",
      "In the same pot, cook onion until soft, then add garlic and rice. Stir 1 minute.",
      "Add wine and stir until absorbed.",
      "Add stock a ladle at a time, stirring, until the rice is creamy and al dente, about 18 minutes.",
      "Stir in mushrooms, butter, parmesan, thyme, salt, and pepper.",
      "Rest 2 minutes, then serve."
    ],
    tips: ["Keep the stock warm so the rice cooks evenly", "Do not rinse arborio rice; the starch makes it creamy"]
  },
  "d11": { // Thai Green Curry
    ingredients: [
      "500 g chicken thigh, sliced",
      "2 tbsp green curry paste",
      "1 can coconut milk",
      "1 cup bamboo shoots, drained",
      "1 red capsicum, sliced",
      "1 handful Thai basil",
      "1 tbsp fish sauce",
      "1 tsp brown sugar",
      "1 tbsp oil",
      "Steamed jasmine rice, to serve"
    ],
    instructions: [
      "Heat oil in a wok and fry curry paste 1 minute until fragrant.",
      "Add chicken and stir-fry until sealed.",
      "Pour in coconut milk and bring to a gentle simmer.",
      "Add bamboo shoots and capsicum. Cook 10–12 minutes until chicken is cooked.",
      "Season with fish sauce and brown sugar.",
      "Stir through Thai basil and serve over rice."
    ],
    tips: ["Use full-fat coconut milk for a silkier sauce", "Add extra paste if you like more heat"]
  },
  "d12": { // Grilled Ribeye Steak
    ingredients: [
      "2 ribeye steaks (about 250 g each)",
      "2 tbsp softened butter mixed with 1 clove minced garlic",
      "500 g potatoes, peeled and chopped",
      "2 tbsp milk",
      "2 extra tbsp butter",
      "2 cloves garlic, minced (for mash)",
      "2 cups baby spinach",
      "2 cloves garlic, sliced",
      "1 tbsp olive oil",
      "Salt and cracked black pepper"
    ],
    instructions: [
      "Bring steaks to room temperature and season well with salt and pepper.",
      "Boil potatoes until tender, then mash with milk, extra butter, minced garlic, salt, and pepper.",
      "Heat a grill or heavy pan until very hot.",
      "Cook steaks 3–4 minutes per side for medium-rare, or to your liking.",
      "Rest 5 minutes, topping with garlic butter.",
      "Sauté spinach with olive oil and sliced garlic until just wilted.",
      "Slice steak against the grain and serve with mash and spinach."
    ],
    tips: ["A dry surface sears better; pat steaks dry first", "Resting keeps the juices in the meat"]
  },
  "d13": { // Baked Cod with Vegetables
    ingredients: [
      "2 cod fillets (about 150 g each)",
      "1 cup cherry tomatoes, halved",
      "1/3 cup pitted olives",
      "1 tbsp capers, drained",
      "2 tbsp olive oil",
      "2 cloves garlic, sliced",
      "1 lemon, juiced and zested",
      "Fresh parsley or oregano",
      "Salt and pepper"
    ],
    instructions: [
      "Preheat oven to 200°C.",
      "Place tomatoes, olives, capers, and garlic in a baking dish. Toss with 1 tbsp olive oil.",
      "Nestle the cod on top. Drizzle with remaining oil, lemon juice, and zest.",
      "Season with salt, pepper, and herbs.",
      "Bake 15–20 minutes until the fish flakes easily.",
      "Spoon the pan vegetables and juices over the cod and serve."
    ],
    tips: ["Cod is done when it flakes with a fork and is opaque in the centre", "Swap olives for extra tomatoes if you prefer a milder dish"]
  },
  "d14": { // Vegetable Pad Thai
    ingredients: [
      "200 g rice noodles",
      "200 g firm tofu, cubed",
      "2 cups bean sprouts",
      "2 spring onions, sliced",
      "1/4 cup crushed peanuts",
      "2 tbsp tamarind paste",
      "2 tbsp soy sauce",
      "1 tbsp lime juice",
      "1 tsp brown sugar",
      "2 tbsp oil",
      "Lime wedges, to serve"
    ],
    instructions: [
      "Soak or cook rice noodles until just tender, then drain.",
      "Mix tamarind, soy sauce, lime juice, and sugar for the sauce.",
      "Fry tofu in oil until golden. Set aside.",
      "Stir-fry noodles with the sauce for 2 minutes.",
      "Add tofu, bean sprouts, and most of the spring onion. Toss.",
      "Serve topped with peanuts, remaining spring onion, and lime wedges."
    ],
    tips: ["Do not oversoak the noodles or they will break", "Press tofu dry before frying so it browns"]
  },
  "d15": { // Lamb Chops with Mint
    ingredients: [
      "6 lamb loin chops",
      "1 cup fresh mint leaves",
      "1/4 cup olive oil",
      "1 clove garlic",
      "1 tbsp lemon juice",
      "400 g fingerling or baby potatoes",
      "1 cup peas",
      "Salt and pepper"
    ],
    instructions: [
      "Blend mint, olive oil, garlic, lemon, salt, and pepper into a pesto.",
      "Boil potatoes until tender, about 15 minutes. Drain.",
      "Season lamb chops and pan-sear 3–4 minutes per side for medium.",
      "Rest the chops 5 minutes.",
      "Warm peas in a splash of water, then toss with potatoes.",
      "Serve chops with mint pesto, potatoes, and peas."
    ],
    tips: ["Bring lamb to room temperature before searing", "A hot pan gives a better crust"]
  },

  // ==================== SNACKS (continued) ====================
  "s3": { // Greek Yogurt with Honey
    ingredients: [
      "1 cup Greek yogurt",
      "1 tbsp raw honey",
      "2 tbsp chopped walnuts",
      "Pinch of cinnamon (optional)"
    ],
    instructions: [
      "Spoon yogurt into a bowl.",
      "Drizzle with honey.",
      "Scatter walnuts over the top.",
      "Add cinnamon if using, and serve."
    ],
    tips: ["Use full-fat yogurt for a creamier snack", "Toast the walnuts for extra crunch"]
  },
  "s4": { // Fresh Fruit Platter
    ingredients: [
      "1 cup strawberries, halved",
      "1 cup grapes",
      "1 orange, segmented",
      "1 kiwi, sliced",
      "1/2 cup pineapple chunks",
      "1/2 cup Greek yogurt",
      "1 tsp honey",
      "1 tsp lime juice"
    ],
    instructions: [
      "Wash and cut the fruit into bite-size pieces.",
      "Arrange fruit on a platter.",
      "Stir yogurt with honey and lime juice for the dip.",
      "Serve the dip alongside the fruit."
    ],
    tips: ["Use whatever fruit is in season", "Pat fruit dry so the platter does not go watery"]
  },
  "s5": { // Avocado Toast Bites
    ingredients: [
      "4 slices wholegrain bread, cut into small squares",
      "1 ripe avocado",
      "8 cherry tomatoes, halved",
      "Handful of microgreens",
      "1 tsp lemon juice",
      "Salt and pepper",
      "Olive oil, for brushing"
    ],
    instructions: [
      "Brush bread with a little olive oil and toast until crisp.",
      "Mash avocado with lemon juice, salt, and pepper.",
      "Spread avocado on each toast bite.",
      "Top with cherry tomato and microgreens.",
      "Serve immediately."
    ],
    tips: ["Toast the bread well so it holds the topping", "Assemble just before serving"]
  },
  "s6": { // Trail Mix
    ingredients: [
      "1/2 cup almonds",
      "1/2 cup cashews",
      "1/3 cup dried cranberries",
      "1/4 cup dark chocolate chips",
      "2 tbsp unsweetened coconut flakes",
      "Pinch of sea salt"
    ],
    instructions: [
      "Combine nuts, cranberries, chocolate, and coconut in a bowl.",
      "Toss with a pinch of salt.",
      "Portion into 8 small handfuls.",
      "Store in an airtight jar."
    ],
    tips: ["A 1/4-cup handful is one serve", "Keep chocolate chips in a cool cupboard so they do not melt"]
  },
  "s7": { // Caprese Skewers
    ingredients: [
      "24 cherry tomatoes",
      "24 small mozzarella balls (bocconcini)",
      "24 fresh basil leaves",
      "2 tbsp balsamic glaze",
      "1 tbsp olive oil",
      "Salt and pepper",
      "24 small skewers or toothpicks"
    ],
    instructions: [
      "Thread tomato, basil, and mozzarella onto each skewer.",
      "Arrange on a plate.",
      "Drizzle with olive oil and balsamic glaze.",
      "Season lightly with salt and pepper and serve."
    ],
    tips: ["Use ripe tomatoes at room temperature", "Make up to 4 hours ahead and glaze just before serving"]
  },
  "s8": { // Edamame
    ingredients: [
      "2 cups frozen edamame in pods",
      "1/2 tsp sea salt",
      "Lemon wedges"
    ],
    instructions: [
      "Bring a pot of water to the boil.",
      "Add edamame and cook 4–5 minutes until bright green and tender.",
      "Drain well.",
      "Toss with sea salt and serve with lemon wedges."
    ],
    tips: ["Do not overboil or the pods go mushy", "Microwave in a splash of water for 3–4 minutes if you are short on time"]
  },
  "s9": { // Apple with Almond Butter
    ingredients: [
      "1 crisp apple",
      "2 tbsp almond butter",
      "Pinch of cinnamon"
    ],
    instructions: [
      "Wash and core the apple, then slice into wedges.",
      "Arrange on a plate with almond butter.",
      "Dust with cinnamon and serve."
    ],
    tips: ["A tart apple balances the almond butter", "Stir the almond butter if the oil has separated"]
  },
  "s10": { // Cottage Cheese Bowl
    ingredients: [
      "1 cup cottage cheese",
      "1 peach, sliced (fresh or thawed frozen)",
      "1 tsp honey",
      "Pinch of cinnamon"
    ],
    instructions: [
      "Spoon cottage cheese into a bowl.",
      "Top with peach slices.",
      "Drizzle with honey and dust with cinnamon.",
      "Serve chilled."
    ],
    tips: ["Choose a peach that gives slightly when pressed", "Swap peach for berries if peaches are out of season"]
  },

  // ==================== DESSERTS (continued) ====================
  "de4": { // Grilled Peaches
    ingredients: [
      "4 ripe peaches, halved and pitted",
      "1 cup vanilla Greek yogurt",
      "2 tbsp honey",
      "2 tbsp crushed pistachios",
      "1 tsp olive oil or cooking spray"
    ],
    instructions: [
      "Heat a grill or grill pan to medium.",
      "Brush peach cut-sides lightly with oil.",
      "Grill cut-side down 3–4 minutes until caramelised.",
      "Flip and grill 2 minutes more.",
      "Serve with yogurt, honey, and pistachios."
    ],
    tips: ["Ripe but firm peaches hold their shape", "A pan on the stove works if you do not have a grill"]
  },
  "de5": { // Chia Pudding Parfait
    ingredients: [
      "1/4 cup chia seeds",
      "1 cup coconut milk",
      "1 tbsp maple syrup",
      "1/2 tsp vanilla extract",
      "1/2 cup coconut cream",
      "1 mango, diced",
      "2 tbsp toasted coconut flakes"
    ],
    instructions: [
      "Stir chia seeds, coconut milk, maple syrup, and vanilla in a jar.",
      "Refrigerate at least 4 hours or overnight, stirring once after 30 minutes.",
      "Whip or stir coconut cream until smooth.",
      "Layer chia pudding, coconut cream, and mango in glasses.",
      "Top with toasted coconut and serve chilled."
    ],
    tips: ["Stir after 30 minutes to stop clumps", "Use canned coconut milk for a creamier set"]
  },
  "de6": { // Baked Apples
    ingredients: [
      "4 apples, cored",
      "1/2 cup rolled oats",
      "1/4 cup chopped walnuts",
      "2 tbsp maple syrup",
      "1 tsp cinnamon",
      "1 tbsp coconut oil or butter"
    ],
    instructions: [
      "Preheat oven to 180°C.",
      "Mix oats, walnuts, maple syrup, cinnamon, and coconut oil.",
      "Fill each apple with the oat mixture.",
      "Place in a baking dish with a splash of water.",
      "Bake 30–35 minutes until the apples are tender.",
      "Serve warm."
    ],
    tips: ["Granny Smith apples hold their shape", "Cover loosely with foil if the topping browns too fast"]
  },
  "de7": { // Avocado Chocolate Pudding
    ingredients: [
      "2 ripe avocados",
      "1/4 cup raw cacao or cocoa powder",
      "3 tbsp maple syrup",
      "1/4 cup almond milk",
      "1 tsp vanilla extract",
      "Pinch of salt"
    ],
    instructions: [
      "Scoop avocado into a blender.",
      "Add cacao, maple syrup, almond milk, vanilla, and salt.",
      "Blend until completely smooth, scraping the sides.",
      "Chill 30 minutes, then spoon into bowls."
    ],
    tips: ["Very ripe avocados give the silkiest texture", "Add a splash more milk if it is too thick"]
  },
  "de8": { // Strawberry Sorbet
    ingredients: [
      "4 cups frozen strawberries",
      "2–3 tbsp maple syrup or honey",
      "1 tbsp lime juice",
      "1–2 tbsp water if needed"
    ],
    instructions: [
      "Add frozen strawberries, sweetener, and lime juice to a food processor.",
      "Blend, scraping down the sides, until smooth.",
      "Add a splash of water only if the blades will not move.",
      "Serve straight away, or freeze 1 hour for a firmer scoop."
    ],
    tips: ["Frozen fruit is essential for the texture", "Taste and add more lime if the strawberries are very sweet"]
  },
  "de9": { // Protein Brownies
    ingredients: [
      "1 can black beans, rinsed and drained",
      "2 scoops chocolate protein powder",
      "1/4 cup cocoa powder",
      "1/4 cup maple syrup",
      "2 eggs",
      "2 tbsp coconut oil, melted",
      "1 tsp vanilla extract",
      "1/2 tsp baking powder",
      "Pinch of salt"
    ],
    instructions: [
      "Preheat oven to 180°C and line a small square tin.",
      "Blend all ingredients until smooth.",
      "Pour into the tin and smooth the top.",
      "Bake 22–25 minutes until just set.",
      "Cool before slicing into 12 squares."
    ],
    tips: ["Do not overbake or they dry out", "Rinse the beans well so the flavour stays chocolatey"]
  },
  "de10": { // Coconut Panna Cotta
    ingredients: [
      "400 ml coconut milk",
      "2 tsp powdered gelatine",
      "2 tbsp maple syrup or honey",
      "1/2 tsp vanilla extract",
      "2 passion fruit",
      "Fresh mint leaves"
    ],
    instructions: [
      "Sprinkle gelatine over 2 tbsp cold water and let bloom 5 minutes.",
      "Warm coconut milk with maple syrup and vanilla; do not boil.",
      "Stir in the bloomed gelatine until dissolved.",
      "Pour into 4 ramekins and chill at least 4 hours.",
      "Top with passion fruit pulp and mint before serving."
    ],
    tips: ["Chill overnight for the cleanest set", "Run a knife around the edge if you want to turn them out"]
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
