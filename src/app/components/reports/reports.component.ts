import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService } from '../../services/nutrition.service';
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Food, FoodEntry } from '../../models/nutrition.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  protected readonly Math = Math;
  protected readonly parseInt = parseInt;

  private nutritionService = inject(NutritionService);

  // State
  protected selectedTimeRange = '30';
  protected lineChartType: ChartType = 'line';
  protected pieChartType: ChartType = 'doughnut';

  // Chart data
  protected caloriesChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Calories',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  protected macrosChartData: ChartConfiguration['data'] = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [150, 270, 70],
        backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
      },
    ],
  };

  protected trendsChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Protein (g)',
        data: [],
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
      {
        label: 'Carbs (g)',
        data: [],
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
      {
        label: 'Fat (g)',
        data: [],
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
    ],
  };

  protected chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  protected pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  // Computed properties
  protected reportData = computed(() => {
    const days = parseInt(this.selectedTimeRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    return {
      dateRange,
      entries: this.nutritionService.foodEntries().filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      }),
      weightEntries: this.nutritionService.weightEntries().filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      }),
    };
  });

  protected averageCalories = computed(() => {
    const data = this.reportData();
    if (data.entries.length === 0) return 0;

    const dailyCalories = this.getDailyNutrition(data.entries, data.dateRange);
    const totalCalories = dailyCalories.reduce(
      (sum, day) => sum + day.calories,
      0,
    );
    return Math.round(totalCalories / dailyCalories.length);
  });

  protected averageProtein = computed(() => {
    const data = this.reportData();
    if (data.entries.length === 0) return 0;

    const dailyNutrition = this.getDailyNutrition(data.entries, data.dateRange);
    const totalProtein = dailyNutrition.reduce(
      (sum, day) => sum + day.protein,
      0,
    );
    return Math.round(totalProtein / dailyNutrition.length);
  });

  protected loggedDays = computed(() => {
    const data = this.reportData();
    const loggedDates = new Set(data.entries.map((entry) => entry.date));
    return loggedDates.size;
  });

  protected proteinGoalDays = computed(() => {
    const profile = this.nutritionService.userProfile();
    if (!profile) return 0;

    const data = this.reportData();
    const dailyNutrition = this.getDailyNutrition(data.entries, data.dateRange);
    return dailyNutrition.filter(
      (day) => day.protein >= profile.targets.protein,
    ).length;
  });

  protected weightChange = computed(() => {
    const data = this.reportData();
    if (data.weightEntries.length < 2) return 0;

    const sortedEntries = [...data.weightEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const first = sortedEntries[0].weight;
    const last = sortedEntries[sortedEntries.length - 1].weight;
    return Math.round((last - first) * 10) / 10;
  });

  protected weightUnit = computed(() => {
    // Could be configurable in user profile
    return 'kg';
  });

  protected caloriesTrend = computed(() => {
    // Calculate percentage change from previous period
    return 5; // Placeholder
  });

  protected weightTrend = computed(() => {
    const change = this.weightChange();
    if (change > 0) return 'Weight gain';
    if (change < 0) return 'Weight loss';
    return 'Stable weight';
  });

  protected goalAchievement = computed(() => {
    const profile = this.nutritionService.userProfile();
    if (!profile) return [];

    const data = this.reportData();
    const dailyNutrition = this.getDailyNutrition(data.entries, data.dateRange);
    const totalDays = parseInt(this.selectedTimeRange);

    return [
      {
        name: 'Calories',
        color: '#3b82f6',
        daysAchieved: dailyNutrition.filter(
          (day) =>
            Math.abs(day.calories - profile.targets.calories) <=
            profile.targets.calories * 0.1,
        ).length,
        percentage: Math.round(
          (dailyNutrition.filter(
            (day) =>
              Math.abs(day.calories - profile.targets.calories) <=
              profile.targets.calories * 0.1,
          ).length /
            totalDays) *
            100,
        ),
      },
      {
        name: 'Protein',
        color: '#10b981',
        daysAchieved: dailyNutrition.filter(
          (day) => day.protein >= profile.targets.protein,
        ).length,
        percentage: Math.round(
          (dailyNutrition.filter(
            (day) => day.protein >= profile.targets.protein,
          ).length /
            totalDays) *
            100,
        ),
      },
      {
        name: 'Fiber',
        color: '#f59e0b',
        daysAchieved: dailyNutrition.filter(
          (day) => day.fiber >= profile.targets.fiber,
        ).length,
        percentage: Math.round(
          (dailyNutrition.filter((day) => day.fiber >= profile.targets.fiber)
            .length /
            totalDays) *
            100,
        ),
      },
    ];
  });

  protected weeklyProgress = computed(() => {
    const data = this.reportData();
    const lastWeek = eachDayOfInterval({
      start: startOfWeek(new Date()),
      end: endOfWeek(new Date()),
    });

    return lastWeek.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = data.entries.filter((entry) => entry.date === dateStr);
      // Calculate goal achievement percentage for this day
      const percentage = dayEntries.length > 0 ? 75 : 0; // Placeholder calculation

      return {
        date: dateStr,
        dayOfWeek: format(date, 'EEE')[0],
        percentage,
      };
    });
  });

  protected frequentFoods = computed(() => {
    const data = this.reportData();
    const foodCounts = new Map<
      string,
      { count: number; totalCalories: number; food: Food }
    >();

    data.entries.forEach((entry) => {
      const key = entry.food.id;
      const current = foodCounts.get(key) || {
        count: 0,
        totalCalories: 0,
        food: entry.food,
      };
      const calories =
        entry.food.nutrition.calories *
        (entry.quantity / entry.food.servingSize);

      foodCounts.set(key, {
        count: current.count + 1,
        totalCalories: current.totalCalories + calories,
        food: entry.food,
      });
    });

    return Array.from(foodCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item) => ({
        name: item.food.name,
        count: item.count,
        avgCalories: Math.round(item.totalCalories / item.count),
      }));
  });

  ngOnInit(): void {
    this.updateCharts();
  }

  protected updateTimeRange(): void {
    this.updateCharts();
  }

  protected exportData(): void {
    const data = this.reportData();
    // Implementation for exporting data (CSV, PDF, etc.)
    console.log('Export data:', data);
  }

  protected getCaloriesTrendClass(): string {
    const trend = this.caloriesTrend();
    return trend > 0
      ? 'text-success-600'
      : trend < 0
        ? 'text-danger-600'
        : 'text-gray-600';
  }

  protected getWeightTrendClass(): string {
    const change = this.weightChange();
    return change > 0
      ? 'text-warning-600'
      : change < 0
        ? 'text-success-600'
        : 'text-gray-600';
  }

  protected getProgressDayClass(percentage: number): string {
    if (percentage >= 80) return 'bg-success-500 text-white';
    if (percentage >= 50) return 'bg-warning-500 text-white';
    if (percentage > 0) return 'bg-danger-500 text-white';
    return 'bg-gray-200 text-gray-600';
  }

  private updateCharts(): void {
    const data = this.reportData();
    const dailyNutrition = this.getDailyNutrition(data.entries, data.dateRange);

    // Update calories chart
    this.caloriesChartData = {
      labels: dailyNutrition.map((day) => format(new Date(day.date), 'MMM d')),
      datasets: [
        {
          label: 'Calories',
          data: dailyNutrition.map((day) => day.calories),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    };

    // Update macros chart
    const avgProtein = this.averageProtein();
    const avgCarbs = Math.round(
      dailyNutrition.reduce((sum, day) => sum + day.carbs, 0) /
        dailyNutrition.length,
    );
    const avgFat = Math.round(
      dailyNutrition.reduce((sum, day) => sum + day.fat, 0) /
        dailyNutrition.length,
    );

    this.macrosChartData = {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [
        {
          data: [avgProtein, avgCarbs, avgFat],
          backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
        },
      ],
    };

    // Update trends chart
    this.trendsChartData = {
      labels: dailyNutrition.map((day) => format(new Date(day.date), 'MMM d')),
      datasets: [
        {
          label: 'Protein (g)',
          data: dailyNutrition.map((day) => day.protein),
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          tension: 0.4,
        },
        {
          label: 'Carbs (g)',
          data: dailyNutrition.map((day) => day.carbs),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          tension: 0.4,
        },
        {
          label: 'Fat (g)',
          data: dailyNutrition.map((day) => day.fat),
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          tension: 0.4,
        },
      ],
    };
  }

  private getDailyNutrition(entries: FoodEntry[], dateRange: Date[]) {
    return dateRange.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter((entry) => entry.date === dateStr);

      const nutrition = dayEntries.reduce(
        (total, entry) => {
          const multiplier = entry.quantity / entry.food.servingSize;
          return {
            calories:
              total.calories + entry.food.nutrition.calories * multiplier,
            protein: total.protein + entry.food.nutrition.protein * multiplier,
            carbs: total.carbs + entry.food.nutrition.carbs * multiplier,
            fat: total.fat + entry.food.nutrition.fat * multiplier,
            fiber: total.fiber + entry.food.nutrition.fiber * multiplier,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );

      return { date: dateStr, ...nutrition };
    });
  }
}
