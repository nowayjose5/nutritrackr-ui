import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NutritionService } from '../../services/nutrition.service';
import { UserProfile } from '../../models/nutrition.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  protected readonly Math = Math;

  private nutritionService = inject(NutritionService);
  private fb = inject(FormBuilder);

  protected saving = signal(false);

  protected userProfile = this.nutritionService.userProfile;

  // Forms
  protected profileForm: FormGroup;
  protected targetsForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      gender: ['', Validators.required],
      height: [
        '',
        [Validators.required, Validators.min(100), Validators.max(250)],
      ],
      activityLevel: ['', Validators.required],
      goals: ['', Validators.required],
    });

    this.targetsForm = this.fb.group({
      calories: [
        '',
        [Validators.required, Validators.min(1000), Validators.max(5000)],
      ],
      protein: [
        '',
        [Validators.required, Validators.min(50), Validators.max(300)],
      ],
      carbs: [
        '',
        [Validators.required, Validators.min(50), Validators.max(500)],
      ],
      fat: ['', [Validators.required, Validators.min(30), Validators.max(200)]],
      fiber: [
        '',
        [Validators.required, Validators.min(15), Validators.max(50)],
      ],
      sodium: [
        '',
        [Validators.required, Validators.min(1000), Validators.max(4000)],
      ],
      potassium: [3500],
      calcium: [1000],
      iron: [18],
      vitaminC: [90],
      vitaminD: [20],
    });

    // Load existing profile data
    const profile = this.userProfile();
    if (profile) {
      this.profileForm.patchValue(profile);
      this.targetsForm.patchValue(profile.targets);
    }
  }

  // Calculated values
  protected calculateBMI = computed(() => {
    const profile = this.userProfile();
    if (!profile || !profile.height) return 0;

    // Assuming we have current weight from weight entries
    const weightEntries = this.nutritionService.weightEntries();
    if (weightEntries.length === 0) return 0;

    const latestWeight = weightEntries[weightEntries.length - 1].weight;
    const heightInM = profile.height / 100;
    const bmi = latestWeight / (heightInM * heightInM);

    return Math.round(bmi * 10) / 10;
  });

  protected calculateBMR = computed(() => {
    const profile = this.userProfile();
    if (!profile) return 0;

    const weightEntries = this.nutritionService.weightEntries();
    if (weightEntries.length === 0) return 1800; // Default

    const weight = weightEntries[weightEntries.length - 1].weight;
    const height = profile.height;
    const age = profile.age;

    // Mifflin-St Jeor Equation
    if (profile.gender === 'male') {
      return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
    } else {
      return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
    }
  });

  protected calculateTDEE = computed(() => {
    const bmr = this.calculateBMR();
    const profile = this.userProfile();
    if (!profile) return bmr;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    return Math.round(bmr * activityMultipliers[profile.activityLevel] || 1.2);
  });

  protected calculatedCalories = computed(() => {
    const tdee = this.calculateTDEE();
    const profile = this.userProfile();
    if (!profile) return tdee;

    // Adjust based on goals
    switch (profile.goals) {
      case 'lose':
        return Math.round(tdee - 500); // 500 calorie deficit for 1lb/week loss
      case 'gain':
        return Math.round(tdee + 500); // 500 calorie surplus for 1lb/week gain
      case 'maintain':
      default:
        return tdee;
    }
  });

  protected calculatedProtein = computed(() => {
    const profile = this.userProfile();
    if (!profile) return 150;

    const weightEntries = this.nutritionService.weightEntries();
    if (weightEntries.length === 0) return 150;

    const weight = weightEntries[weightEntries.length - 1].weight;
    // 2.2g per kg of body weight for active individuals
    return Math.round(weight * 2.2);
  });

  protected calculatedCarbs = computed(() => {
    const calories = this.calculatedCalories();
    // 45-50% of calories from carbs
    return Math.round((calories * 0.475) / 4); // 4 calories per gram of carbs
  });

  protected calculatedFat = computed(() => {
    const calories = this.calculatedCalories();
    // 25-30% of calories from fat
    return Math.round((calories * 0.275) / 9); // 9 calories per gram of fat
  });

  protected getBMIClass(): string {
    const bmi = this.calculateBMI();
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  }

  protected async saveProfile(): Promise<void> {
    if (this.profileForm.valid) {
      this.saving.set(true);

      try {
        const formValue = this.profileForm.value;
        const currentProfile = this.userProfile();

        const updatedProfile: UserProfile = {
          id: currentProfile?.id || crypto.randomUUID(),
          ...formValue,
          targets: currentProfile?.targets || {
            calories: this.calculatedCalories(),
            protein: this.calculatedProtein(),
            carbs: this.calculatedCarbs(),
            fat: this.calculatedFat(),
            fiber: 25,
            sugar: 50,
            sodium: 2300,
            potassium: 3500,
            calcium: 1000,
            iron: 18,
            vitaminC: 90,
            vitaminD: 20,
          },
        };

        await this.nutritionService.updateUserProfile(updatedProfile);

        // Show success message (you could add a toast service)
        console.log('Profile saved successfully!');
      } catch (error) {
        console.error('Error saving profile:', error);
        // Show error message
      } finally {
        this.saving.set(false);
      }
    }
  }

  protected async saveTargets(): Promise<void> {
    if (this.targetsForm.valid) {
      this.saving.set(true);

      try {
        const formValue = this.targetsForm.value;
        const currentProfile = this.userProfile();

        if (currentProfile) {
          const updatedProfile: UserProfile = {
            ...currentProfile,
            targets: {
              ...currentProfile.targets,
              ...formValue,
            },
          };

          await this.nutritionService.updateUserProfile(updatedProfile);
          console.log('Nutrition targets saved successfully!');
        }
      } catch (error) {
        console.error('Error saving targets:', error);
      } finally {
        this.saving.set(false);
      }
    }
  }

  protected resetForm(): void {
    const profile = this.userProfile();
    if (profile) {
      this.profileForm.patchValue(profile);
      this.targetsForm.patchValue(profile.targets);
    } else {
      this.profileForm.reset();
      this.targetsForm.reset();
    }
  }

  protected useRecommendedTargets(): void {
    this.targetsForm.patchValue({
      calories: this.calculatedCalories(),
      protein: this.calculatedProtein(),
      carbs: this.calculatedCarbs(),
      fat: this.calculatedFat(),
      fiber: 25,
      sodium: 2300,
    });
  }
}
