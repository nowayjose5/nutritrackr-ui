import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService } from '../../services/nutrition.service';
import { MealType, FoodEntry, Food } from '../../models/nutrition.models';
import { format, addDays, subDays } from 'date-fns';
import { FoodSearchComponent } from '../shared/food-search/food-search.component';
import { AddFoodModalComponent } from '../shared/add-food-modal/add-food-modal.component';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FoodSearchComponent,
    AddFoodModalComponent,
  ],
  templateUrl: './diary.component.html',
})
export class DiaryComponent {
  // at top of class
  protected preselectedFood = signal<Food | null>(null);
  protected readonly Math = Math;
  private nutritionService = inject(NutritionService);

  protected selectedDate = this.nutritionService.selectedDate;
  protected todayNutrition = this.nutritionService.todayNutrition;
  protected todayEntries = this.nutritionService.todayEntries;

  protected meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  protected showAddFoodModal = signal(false);
  protected selectedMeal = signal<MealType>('breakfast');

  protected previousDay(): void {
    const currentDate = new Date(this.selectedDate());
    const previousDate = subDays(currentDate, 1);
    this.nutritionService.setSelectedDate(format(previousDate, 'yyyy-MM-dd'));
  }

  protected nextDay(): void {
    const currentDate = new Date(this.selectedDate());
    const nextDate = addDays(currentDate, 1);
    this.nutritionService.setSelectedDate(format(nextDate, 'yyyy-MM-dd'));
  }

  protected formatDate(dateString: string): string {
    return format(new Date(dateString), 'EEEE, MMMM d');
  }

  protected getDateDescription(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = subDays(today, 1);
    const tomorrow = addDays(today, 1);

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Tomorrow';
    }
    return format(date, 'yyyy');
  }

  protected getMealEntries(meal: MealType): FoodEntry[] {
    return this.todayEntries().filter((entry) => entry.meal === meal);
  }

  protected openAddFoodModal(meal: MealType): void {
    this.selectedMeal.set(meal);
    this.showAddFoodModal.set(true);
  }

  protected closeAddFoodModal(): void {
    this.showAddFoodModal.set(false);
  }

  protected onFoodAdded(): void {
    this.closeAddFoodModal();
  }

  protected editEntry(entry: FoodEntry): void {
    // Implementation for editing entry
    console.log('Edit entry:', entry);
  }

  protected async deleteEntry(entryId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this food entry?')) {
      await this.nutritionService.deleteFoodEntry(entryId);
    }
  }

  // handler for search results
  protected onQuickSelect(food: Food) {
    this.preselectedFood.set(food);
    // you can choose a default meal or prompt for one
    this.selectedMeal.set('breakfast');
    this.showAddFoodModal.set(true);
  }
}
