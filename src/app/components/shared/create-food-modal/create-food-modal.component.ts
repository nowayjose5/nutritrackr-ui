import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NutritionService } from '../../../services/nutrition.service';
import { Food } from '../../../models/nutrition.models';

@Component({
  selector: 'app-create-food-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-food-modal.component.html',
})
export class CreateFoodModalComponent {
  @Input() editingFood: Food | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() foodCreated = new EventEmitter<Food>();

  private nutritionService = inject(NutritionService);
  private fb = inject(FormBuilder);

  protected saving = signal(false);
  protected foodForm: FormGroup;

  constructor() {
    this.foodForm = this.fb.group({
      name: ['', Validators.required],
      brand: [''],
      servingSize: ['', [Validators.required, Validators.min(0.1)]],
      servingUnit: ['', Validators.required],
      calories: ['', [Validators.required, Validators.min(0)]],
      protein: ['', [Validators.required, Validators.min(0)]],
      carbs: ['', [Validators.required, Validators.min(0)]],
      fat: ['', [Validators.required, Validators.min(0)]],
      fiber: [0, Validators.min(0)],
      sugar: [0, Validators.min(0)],
      sodium: [0, Validators.min(0)],
      potassium: [0, Validators.min(0)],
      calcium: [0, Validators.min(0)],
      iron: [0, Validators.min(0)],
      vitaminC: [0, Validators.min(0)],
      vitaminD: [0, Validators.min(0)],
    });

    // If editing, populate form
    if (this.editingFood) {
      this.foodForm.patchValue({
        name: this.editingFood.name,
        brand: this.editingFood.brand,
        servingSize: this.editingFood.servingSize,
        servingUnit: this.editingFood.servingUnit,
        ...this.editingFood.nutrition,
      });
    }
  }

  protected async saveFood(): Promise<void> {
    if (this.foodForm.valid) {
      this.saving.set(true);

      try {
        const formValue = this.foodForm.value;
        const foodData = {
          name: formValue.name,
          brand: formValue.brand || 'Custom',
          servingSize: formValue.servingSize,
          servingUnit: formValue.servingUnit,
          nutrition: {
            calories: formValue.calories,
            protein: formValue.protein,
            carbs: formValue.carbs,
            fat: formValue.fat,
            fiber: formValue.fiber,
            sugar: formValue.sugar,
            sodium: formValue.sodium,
            potassium: formValue.potassium,
            calcium: formValue.calcium,
            iron: formValue.iron,
            vitaminC: formValue.vitaminC,
            vitaminD: formValue.vitaminD,
          },
        };

        const createdFood = await this.nutritionService.addFood(foodData);
        this.foodCreated.emit(createdFood);
      } catch (error) {
        console.error('Error saving food:', error);
      } finally {
        this.saving.set(false);
      }
    }
  }
}
