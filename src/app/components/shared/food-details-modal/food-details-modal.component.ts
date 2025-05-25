import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Food } from '../../../models/nutrition.models';

@Component({
  selector: 'app-food-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './food-details-modal.component.html',
})
export class FoodDetailsModalComponent {
  @Input() food!: Food;
  @Output() close = new EventEmitter<void>();
  @Output() addToMeal = new EventEmitter<{
    foodId: string;
    meal: string;
    quantity: number;
  }>();
}
