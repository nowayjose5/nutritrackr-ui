export interface Food {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  nutrition: NutritionData;
  barcode?: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  potassium: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  vitaminD: number;
}

export interface FoodEntry {
  id: string;
  foodId: string;
  food: Food;
  quantity: number;
  meal: MealType;
  date: string;
  timestamp: Date;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  timestamp: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: 'lose' | 'maintain' | 'gain';
  targets: NutritionData;
}
