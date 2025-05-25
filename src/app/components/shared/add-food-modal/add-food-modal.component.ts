import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService } from '../../../services/nutrition.service';
import { Food, MealType } from '../../../models/nutrition.models';

@Component({
  selector: 'app-add-food-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-food-modal.component.html',
})
export class AddFoodModalComponent implements OnInit {
  @Input() meal: MealType = 'breakfast';
  @Input() date: string = '';
  @Input() preselectedFood: Food | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() foodAdded = new EventEmitter<void>();

  protected readonly Math = Math;
  private nutritionService = inject(NutritionService);

  protected searchQuery = '';
  protected quantity = 1;
  protected searchResults = signal<Food[]>([]);
  protected selectedFood = signal<Food | null>(null);

  ngOnInit() {
    if (this.preselectedFood) {
      this.selectedFood.set(this.preselectedFood);
      this.quantity = this.preselectedFood.servingSize;
    }
  }

  protected onSearchInput(): void {
    if (this.searchQuery.trim()) {
      const results = this.nutritionService.searchFoods(this.searchQuery);
      this.searchResults.set(results);
    } else {
      this.searchResults.set([]);
    }
    this.selectedFood.set(null);
  }

  protected selectFood(food: Food): void {
    this.selectedFood.set(food);
    this.quantity = food.servingSize;
  }

  protected calculateNutrition(nutrient: keyof Food['nutrition']): number {
    const food = this.selectedFood();
    if (!food) return 0;

    const multiplier = this.quantity / food.servingSize;
    return food.nutrition[nutrient] * multiplier;
  }

  protected async addFood(): Promise<void> {
    const food = this.selectedFood();
    if (!food || this.quantity <= 0) return;

    try {
      await this.nutritionService.addFoodEntry(
        food.id,
        this.quantity,
        this.meal,
        this.date,
      );
      this.foodAdded.emit();
    } catch (error) {
      console.error('Error adding food entry:', error);
    }
  }
}
