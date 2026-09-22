export type FoodSelectionLine = {
  name: string;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function formatFoodLine(name: string, portion: number) {
  const rounded = Math.round(portion * 100) / 100;
  return rounded === 1 ? name : `${name} (${rounded}x)`;
}

export function combineFoodSelection(items: FoodSelectionLine[]) {
  const calories = items.reduce((sum, item) => sum + item.calories, 0);
  const protein = items.reduce((sum, item) => sum + item.protein, 0);
  const carbs = items.reduce((sum, item) => sum + item.carbs, 0);
  const fat = items.reduce((sum, item) => sum + item.fat, 0);
  return {
    name: items.map((item) => formatFoodLine(item.name, item.portion)).join(", "),
    lines: items.map((item) => formatFoodLine(item.name, item.portion)).join("\n"),
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
  };
}
