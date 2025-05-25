import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NutritionData, MealType } from '../../../models/nutrition.models';

@Component({
  selector: 'app-meal-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meal-summary.component.html',
})
export class MealSummaryComponent {
  @Input() mealBreakdown!: Record<MealType, NutritionData>;
  protected readonly Math = Math;

  protected meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  protected getMealIconClass(meal: MealType): string {
    const baseClass = 'w-10 h-10 rounded-lg flex items-center justify-center';

    switch (meal) {
      case 'breakfast':
        return `${baseClass} bg-yellow-100 text-yellow-600`;
      case 'lunch':
        return `${baseClass} bg-green-100 text-green-600`;
      case 'dinner':
        return `${baseClass} bg-blue-100 text-blue-600`;
      case 'snacks':
        return `${baseClass} bg-purple-100 text-purple-600`;
      default:
        return `${baseClass} bg-gray-100 text-gray-600`;
    }
  }
}
