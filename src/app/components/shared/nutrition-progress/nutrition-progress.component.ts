import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NutritionProgress {
  calories: { current: number; target: number; percentage: number };
  protein: { current: number; target: number; percentage: number };
  carbs: { current: number; target: number; percentage: number };
  fat: { current: number; target: number; percentage: number };
}

@Component({
  selector: 'app-nutrition-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nutrition-progress.component.html',
})
export class NutritionProgressComponent {
  @Input() progress: NutritionProgress | null = null;
  protected readonly Math = Math;

  protected getProgressBarClass(percentage: number): string {
    if (percentage >= 100) return 'bg-success-500';
    if (percentage >= 80) return 'bg-warning-500';
    return 'bg-primary-500';
  }

  protected getRemainingCaloriesClass(): string {
    if (!this.progress) return 'text-gray-900';

    const remaining =
      this.progress.calories.target - this.progress.calories.current;
    if (remaining < 0) return 'text-danger-600';
    if (remaining < 200) return 'text-warning-600';
    return 'text-success-600';
  }
}
