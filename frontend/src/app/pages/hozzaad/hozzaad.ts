import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hozzaad',
  imports: [FormsModule],
  templateUrl: './hozzaad.html',
  styleUrl: './hozzaad.scss',
})
export class Hozzaad {
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  recipeName = '';
  cookingTime: number | null = null;
  description = '';
  selectedImageName = '';
  saveMessage = '';

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImageName = input.files?.[0]?.name ?? '';
    this.saveMessage = '';
  }

  resetForm(): void {
    this.recipeName = '';
    this.cookingTime = null;
    this.description = '';
    this.selectedImageName = '';
    this.saveMessage = '';

    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
  }

  saveRecipe(): void {
    this.saveMessage = 'A recept piszkozatként elmentve. Backend kapcsolat később kerül rá.';
  }
}
