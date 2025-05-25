import { Injectable, computed, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import {
  Food,
  FoodEntry,
  NutritionData,
  MealType,
  WeightEntry,
  UserProfile,
} from '../models/nutrition.models';
import { format } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class NutritionService {
  // Signals for reactive state management
  private _foods = signal<Food[]>([]);
  private _foodEntries = signal<FoodEntry[]>([]);
  private _weightEntries = signal<WeightEntry[]>([]);
  private _userProfile = signal<UserProfile | null>(null);
  private _selectedDate = signal<string>(format(new Date(), 'yyyy-MM-dd'));

  // Computed signals
  readonly foods = this._foods.asReadonly();
  readonly foodEntries = this._foodEntries.asReadonly();
  readonly weightEntries = this._weightEntries.asReadonly();
  readonly userProfile = this._userProfile.asReadonly();
  readonly selectedDate = this._selectedDate.asReadonly();

  readonly todayEntries = computed(() =>
    this._foodEntries().filter((entry) => entry.date === this._selectedDate()),
  );

  readonly todayNutrition = computed(() => {
    return this.calculateTotalNutrition(this.todayEntries());
  });

  readonly nutritionProgress = computed(() => {
    const profile = this._userProfile();
    if (!profile) return null;

    const today = this.todayNutrition();
    const targets = profile.targets;

    return {
      calories: {
        current: today.calories,
        target: targets.calories,
        percentage: (today.calories / targets.calories) * 100,
      },
      protein: {
        current: today.protein,
        target: targets.protein,
        percentage: (today.protein / targets.protein) * 100,
      },
      carbs: {
        current: today.carbs,
        target: targets.carbs,
        percentage: (today.carbs / targets.carbs) * 100,
      },
      fat: {
        current: today.fat,
        target: targets.fat,
        percentage: (today.fat / targets.fat) * 100,
      },
    };
  });

  readonly mealBreakdown = computed(() => {
    const entries = this.todayEntries();
    const meals: Record<MealType, NutritionData> = {
      breakfast: this.calculateTotalNutrition(
        entries.filter((e) => e.meal === 'breakfast'),
      ),
      lunch: this.calculateTotalNutrition(
        entries.filter((e) => e.meal === 'lunch'),
      ),
      dinner: this.calculateTotalNutrition(
        entries.filter((e) => e.meal === 'dinner'),
      ),
      snacks: this.calculateTotalNutrition(
        entries.filter((e) => e.meal === 'snacks'),
      ),
    };
    return meals;
  });

  constructor() {
    this.loadData();
    this.seedSampleFoods();
  }

  // Date management
  setSelectedDate(date: string) {
    this._selectedDate.set(date);
  }

  // Food management
  async addFood(food: Omit<Food, 'id'>): Promise<Food> {
    const newFood: Food = {
      ...food,
      id: crypto.randomUUID(),
    };

    this._foods.update((foods) => [...foods, newFood]);
    await this.saveData();
    return newFood;
  }

  searchFoods(query: string): Food[] {
    if (!query.trim()) return this._foods();

    const lowercaseQuery = query.toLowerCase();
    return this._foods().filter(
      (food) =>
        food.name.toLowerCase().includes(lowercaseQuery) ||
        food.brand?.toLowerCase().includes(lowercaseQuery),
    );
  }

  // Food entry management
  async addFoodEntry(
    foodId: string,
    quantity: number,
    meal: MealType,
    date?: string,
  ): Promise<FoodEntry> {
    const food = this._foods().find((f) => f.id === foodId);
    if (!food) throw new Error('Food not found');

    const entry: FoodEntry = {
      id: crypto.randomUUID(),
      foodId,
      food,
      quantity,
      meal,
      date: date || this._selectedDate(),
      timestamp: new Date(),
    };

    this._foodEntries.update((entries) => [...entries, entry]);
    await this.saveData();
    return entry;
  }

  async updateFoodEntry(
    entryId: string,
    updates: Partial<Pick<FoodEntry, 'quantity' | 'meal'>>,
  ): Promise<void> {
    this._foodEntries.update((entries) =>
      entries.map((entry) =>
        entry.id === entryId ? { ...entry, ...updates } : entry,
      ),
    );
    await this.saveData();
  }

  async deleteFoodEntry(entryId: string): Promise<void> {
    this._foodEntries.update((entries) =>
      entries.filter((entry) => entry.id !== entryId),
    );
    await this.saveData();
  }

  // Weight tracking
  async addWeightEntry(weight: number, date?: string): Promise<WeightEntry> {
    const entry: WeightEntry = {
      id: crypto.randomUUID(),
      weight,
      date: date || this._selectedDate(),
      timestamp: new Date(),
    };

    this._weightEntries.update((entries) => [...entries, entry]);
    await this.saveData();
    return entry;
  }

  // User profile
  async updateUserProfile(profile: UserProfile): Promise<void> {
    this._userProfile.set(profile);
    await this.saveData();
  }

  // Utility methods
  private calculateTotalNutrition(entries: FoodEntry[]): NutritionData {
    return entries.reduce(
      (total, entry) => {
        const multiplier = entry.quantity / entry.food.servingSize;
        const nutrition = entry.food.nutrition;

        return {
          calories: total.calories + nutrition.calories * multiplier,
          protein: total.protein + nutrition.protein * multiplier,
          carbs: total.carbs + nutrition.carbs * multiplier,
          fat: total.fat + nutrition.fat * multiplier,
          fiber: total.fiber + nutrition.fiber * multiplier,
          sugar: total.sugar + nutrition.sugar * multiplier,
          sodium: total.sodium + nutrition.sodium * multiplier,
          potassium: total.potassium + nutrition.potassium * multiplier,
          calcium: total.calcium + nutrition.calcium * multiplier,
          iron: total.iron + nutrition.iron * multiplier,
          vitaminC: total.vitaminC + nutrition.vitaminC * multiplier,
          vitaminD: total.vitaminD + nutrition.vitaminD * multiplier,
        };
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        potassium: 0,
        calcium: 0,
        iron: 0,
        vitaminC: 0,
        vitaminD: 0,
      },
    );
  }

  // Data persistence
  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        Preferences.set({
          key: 'foods',
          value: JSON.stringify(this._foods()),
        }),
        Preferences.set({
          key: 'foodEntries',
          value: JSON.stringify(this._foodEntries()),
        }),
        Preferences.set({
          key: 'weightEntries',
          value: JSON.stringify(this._weightEntries()),
        }),
        Preferences.set({
          key: 'userProfile',
          value: JSON.stringify(this._userProfile()),
        }),
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private async loadData(): Promise<void> {
    try {
      const [foods, foodEntries, weightEntries, userProfile] =
        await Promise.all([
          Preferences.get({ key: 'foods' }),
          Preferences.get({ key: 'foodEntries' }),
          Preferences.get({ key: 'weightEntries' }),
          Preferences.get({ key: 'userProfile' }),
        ]);

      if (foods.value) {
        this._foods.set(JSON.parse(foods.value));
      }

      if (foodEntries.value) {
        this._foodEntries.set(JSON.parse(foodEntries.value));
      }

      if (weightEntries.value) {
        this._weightEntries.set(JSON.parse(weightEntries.value));
      }

      if (userProfile.value) {
        this._userProfile.set(JSON.parse(userProfile.value));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private seedSampleFoods(): void {
    if (this._foods().length === 0) {
      const sampleFoods: Food[] = [
        {
          id: '1',
          name: 'Banana',
          brand: 'Fresh',
          servingSize: 100,
          servingUnit: 'g',
          nutrition: {
            calories: 89,
            protein: 1.1,
            carbs: 22.8,
            fat: 0.3,
            fiber: 2.6,
            sugar: 12.2,
            sodium: 1,
            potassium: 358,
            calcium: 5,
            iron: 0.26,
            vitaminC: 8.7,
            vitaminD: 0,
          },
        },
        {
          id: '2',
          name: 'Chicken Breast',
          brand: 'Fresh',
          servingSize: 100,
          servingUnit: 'g',
          nutrition: {
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
            sugar: 0,
            sodium: 74,
            potassium: 256,
            calcium: 15,
            iron: 0.89,
            vitaminC: 0,
            vitaminD: 0,
          },
        },
        // Add more sample foods...
      ];

      this._foods.set(sampleFoods);
    }
  }
}
