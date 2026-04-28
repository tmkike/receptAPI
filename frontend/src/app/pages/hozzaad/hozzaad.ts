import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-hozzaad',
  imports: [FormsModule],
  templateUrl: './hozzaad.html',
  styleUrl: './hozzaad.scss',
})
export class Hozzaad {
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  isLoggedIn = Boolean(localStorage.getItem('token'));
  recipeName = '';
  cookingTime: number | null = null;
  description = '';
  selectedImageName = '';
  selectedImage: File | null = null;
  isSubmitting = false;
  saveMessage = '';
  errorMessage = '';

  constructor(private readonly apiService: ApiService) {}

  onImageSelected(event: Event): void {
    if (!this.isLoggedIn) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedImage = file;
    this.selectedImageName = file?.name ?? '';
    this.clearMessages();
  }

  resetForm(): void {
    this.recipeName = '';
    this.cookingTime = null;
    this.description = '';
    this.selectedImageName = '';
    this.selectedImage = null;
    this.clearMessages();

    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
  }

  saveRecipe(): void {
    this.clearMessages();
    this.isLoggedIn = Boolean(localStorage.getItem('token'));

    if (!this.isLoggedIn) {
      this.errorMessage = 'Csak regisztrált, bejelentkezett tagok tölthetnek fel receptet.';
      return;
    }

    if (!this.recipeName.trim() || !this.description.trim() || !this.cookingTime) {
      this.errorMessage = 'Töltsd ki a recept nevét, az elkészítési időt és a leírást.';
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const formData = new FormData();
    formData.append('receptNev', this.recipeName.trim());
    formData.append('receptSzoveg', this.description.trim());
    formData.append('receptIdo', String(this.cookingTime));
    formData.append('hozzavalok', JSON.stringify([]));

    if (this.selectedImage) {
      formData.append('kep', this.selectedImage);
    }

    this.isSubmitting = true;

    this.apiService.addRecipe(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.resetForm();
        this.saveMessage = 'A recept sikeresen elmentve.';
      },
      error: (error) => {
        this.errorMessage = this.getSaveErrorMessage(error?.error?.errorMessage || error?.error?.error);
        this.isSubmitting = false;
      },
    });
  }

  private clearMessages(): void {
    this.saveMessage = '';
    this.errorMessage = '';
  }

  private getSaveErrorMessage(errorCode: string | undefined): string {
    if (errorCode === 'missing_or_invalid_token') {
      return 'Lejárt vagy hiányzó bejelentkezés. Jelentkezz be újra.';
    }

    if (errorCode === 'missing_required_fields') {
      return 'Töltsd ki a recept nevét, az elkészítési időt és a leírást.';
    }

    return 'A recept mentése nem sikerült. Próbáld újra később.';
  }
}
