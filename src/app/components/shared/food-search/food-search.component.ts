import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Food } from '../../../models/nutrition.models';
import { NutritionService } from '../../../services/nutrition.service';

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-search.component.html',
})
export class FoodSearchComponent {
  @Output() selectFood = new EventEmitter<Food>();

  private nutritionService = inject(NutritionService);

  // reactive query and results
  query = signal('');
  results = signal<Food[]>([]);

  onQueryChange(value: string) {
    this.query.set(value);
    const q = value.trim();
    if (q.length) {
      this.results.set(this.nutritionService.searchFoods(q));
    } else {
      this.results.set([]);
    }
  }

  clear() {
    this.query.set('');
    this.results.set([]);
  }
}
