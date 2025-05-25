import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NutritionService } from '../../services/nutrition.service';
import { format } from 'date-fns';
import { NutritionProgressComponent } from '../shared/nutrition-progress/nutrition-progress.component';
import { MealSummaryComponent } from '../shared/meal-summary/meal-summary.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NutritionProgressComponent,
    MealSummaryComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly Math = Math;
  private nutritionService = inject(NutritionService);

  protected todayNutrition = this.nutritionService.todayNutrition;
  protected nutritionProgress = this.nutritionService.nutritionProgress;
  protected mealBreakdown = this.nutritionService.mealBreakdown;
  protected selectedDate = this.nutritionService.selectedDate;

  protected userName = computed(() => {
    const profile = this.nutritionService.userProfile();
    return profile?.name || 'User';
  });

  protected recentEntries = computed(() => {
    return this.nutritionService
      .todayEntries()
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 5);
  });

  protected getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  protected formatDate(dateString: string): string {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  }
}
