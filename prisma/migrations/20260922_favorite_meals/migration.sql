CREATE TABLE IF NOT EXISTS "FavoriteMeal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "nameKey" TEXT NOT NULL,
  "mealType" "MealType" NOT NULL,
  "calories" INTEGER,
  "protein" DOUBLE PRECISION,
  "carbs" DOUBLE PRECISION,
  "fat" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FavoriteMeal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FavoriteMeal_userId_nameKey_mealType_key"
  ON "FavoriteMeal"("userId", "nameKey", "mealType");

CREATE INDEX IF NOT EXISTS "FavoriteMeal_userId_idx" ON "FavoriteMeal"("userId");

ALTER TABLE "FavoriteMeal"
  ADD CONSTRAINT "FavoriteMeal_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
