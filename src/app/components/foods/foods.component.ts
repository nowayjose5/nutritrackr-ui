import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService } from '../../services/nutrition.service';
import { Food } from '../../models/nutrition.models';
import { CreateFoodModalComponent } from '../shared/create-food-modal/create-food-modal.component';
import { FoodDetailsModalComponent } from '../shared/food-details-modal/food-details-modal.component';

@Component({
  selector: 'app-foods',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreateFoodModalComponent,
    FoodDetailsModalComponent,
  ],
  templateUrl: './foods.component.html',
})
export class FoodsComponent {
  private nutritionService = inject(NutritionService);

  // State
  protected searchQuery = '';
  protected selectedCategory = '';
  protected sortBy = 'name';
  protected currentPage = signal(1);
  protected pageSize = 12;
  protected showCreateModal = signal(false);
  protected selectedFood = signal<Food | null>(null);
  protected editingFood = signal<Food | null>(null);
  protected openMenuId = signal<string | null>(null);
  protected favoriteIds = signal<Set<string>>(new Set());

  // Computed properties
  protected allFoods = this.nutritionService.foods;

  protected filteredFoods = computed(() => {
    let foods = this.allFoods();

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      foods = foods.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.brand?.toLowerCase().includes(query),
      );
    }

    // Category filter
    if (this.selectedCategory) {
      foods = foods.filter(
        (food) => this.getFoodCategory(food) === this.selectedCategory,
      );
    }

    // Sort
    foods = [...foods].sort((a, b) => {
      switch (this.sortBy) {
        case 'calories':
          return b.nutrition.calories - a.nutrition.calories;
        case 'protein':
          return b.nutrition.protein - a.nutrition.protein;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return foods;
  });

  protected totalPages = computed(() =>
    Math.ceil(this.filteredFoods().length / this.pageSize),
  );

  protected paginatedFoods = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredFoods().slice(start, end);
  });

  protected visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  protected customFoodsCount = computed(
    () =>
      this.allFoods().filter((food) => this.getFoodCategory(food) === 'custom')
        .length,
  );

  protected recentlyUsedCount = computed(() => {
    // This would be based on recent food entries
    return 0;
  });

  protected favoriteFoodsCount = computed(() => this.favoriteIds().size);

  // Methods
  protected onSearchInput(): void {
    this.currentPage.set(1);
  }

  protected applyFilters(): void {
    this.currentPage.set(1);
  }

  protected trackByFoodId(index: number, food: Food): string {
    return food.id;
  }

  protected getFoodCategory(food: Food): string {
    // Simple categorization logic - could be enhanced
    if (!food.brand || food.brand === 'Custom') return 'custom';

    const name = food.name.toLowerCase();
    if (
      name.includes('chicken') ||
      name.includes('beef') ||
      name.includes('fish')
    )
      return 'proteins';
    if (
      name.includes('apple') ||
      name.includes('banana') ||
      name.includes('berry')
    )
      return 'fruits';
    if (
      name.includes('broccoli') ||
      name.includes('carrot') ||
      name.includes('lettuce')
    )
      return 'vegetables';
    if (
      name.includes('rice') ||
      name.includes('bread') ||
      name.includes('pasta')
    )
      return 'grains';
    if (
      name.includes('milk') ||
      name.includes('cheese') ||
      name.includes('yogurt')
    )
      return 'dairy';

    return 'other';
  }

  protected openCreateFoodModal(): void {
    this.editingFood.set(null);
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.editingFood.set(null);
  }

  protected onFoodCreated(): void {
    this.closeCreateModal();
  }

  protected openFoodDetails(food: Food): void {
    this.selectedFood.set(food);
    this.openMenuId.set(null);
  }

  protected closeFoodDetails(): void {
    this.selectedFood.set(null);
  }

  protected addFoodToMeal(event: {
    foodId: string;
    meal: string;
    quantity: number;
  }): void {
    // This would open the add to diary modal
    console.log('Add to meal:', event);
  }

  protected toggleFoodMenu(foodId: string): void {
    this.openMenuId.update((current) => (current === foodId ? null : foodId));
  }

  protected editFood(food: Food): void {
    this.editingFood.set(food);
    this.showCreateModal.set(true);
    this.openMenuId.set(null);
  }

  protected duplicateFood(food: Food): void {
    // Create a copy of the food
    this.editingFood.set({ ...food, id: '', name: `${food.name} (Copy)` });
    this.showCreateModal.set(true);
    this.openMenuId.set(null);
  }

  protected deleteFood(food: Food): void {
    if (confirm(`Are you sure you want to delete "${food.name}"?`)) {
      // Implementation for deleting food
      console.log('Delete food:', food);
    }
    this.openMenuId.set(null);
  }

  protected toggleFavorite(food: Food): void {
    this.favoriteIds.update((favorites) => {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(food.id)) {
        newFavorites.delete(food.id);
      } else {
        newFavorites.add(food.id);
      }
      return newFavorites;
    });
  }

  protected isFavorite(food: Food): boolean {
    return this.favoriteIds().has(food.id);
  }

  protected scanBarcode(): void {
    // Implementation for barcode scanning using Capacitor Camera
    console.log('Scan barcode');
  }

  // Pagination methods
  protected setPage(page: number): void {
    this.currentPage.set(page);
  }

  protected previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((page) => page - 1);
    }
  }

  protected nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((page) => page + 1);
    }
  }
}
