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
  @ViewChild('fullDescriptionEditor') fullDescriptionEditor?: ElementRef<HTMLElement>;

  isLoggedIn = Boolean(localStorage.getItem('token'));
  recipeName = '';
  cookingTime: number | null = null;
  description = '';
  fullDescription = '';
  categories = [
    'Saláták',
    'Streetfood',
    'Vegetáriánus',
    'Vegán ételek',
    'Édes sütemények',
    'Sós sütemények',
    'Tésztafélék',
    'Savanyúságok',
    'Kenyérfélék',
    'Főzelék',
    'Levesek',
    'Halételek',
    'Marhaételek',
    'Sertésételek',
    'Csirkeételek',
    'Borjúételek',
    'Egyébb húsfélék',
    'Grill/Kerti ételek',
    'köretek',
  ];
  selectedCategory = '';
  selectedImageName = '';
  selectedImage: File | null = null;
  isSubmitting = false;
  saveMessage = '';
  errorMessage = '';

  constructor(private readonly apiService: ApiService) {}

  get canSaveRecipe(): boolean {
    return Boolean(
      this.isLoggedIn &&
        !this.isSubmitting &&
        this.recipeName.trim() &&
        this.description.trim() &&
        this.fullDescription.trim() &&
        this.cookingTime &&
        this.selectedCategory &&
        this.selectedImage,
    );
  }

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
    this.fullDescription = '';
    this.selectedCategory = '';
    this.selectedImageName = '';
    this.selectedImage = null;
    this.clearMessages();

    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }

    if (this.fullDescriptionEditor) {
      this.fullDescriptionEditor.nativeElement.innerHTML = '';
    }
  }

  saveRecipe(): void {
    this.clearMessages();
    this.isLoggedIn = Boolean(localStorage.getItem('token'));
    this.syncFullDescriptionFromEditor();

    if (!this.isLoggedIn) {
      this.errorMessage = 'Csak regisztrált, bejelentkezett tagok tölthetnek fel receptet.';
      return;
    }

    if (
      !this.recipeName.trim() ||
      !this.description.trim() ||
      !this.fullDescription.trim() ||
      !this.cookingTime ||
      !this.selectedCategory ||
      !this.selectedImage
    ) {
      this.errorMessage =
        'Töltsd ki a recept nevét, tölts fel képet, válassz kategóriát, add meg az elkészítési időt, a rövid leírást és a teljes leírást.';
      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const formData = new FormData();
    formData.append('receptNev', this.recipeName.trim());
    formData.append('receptSzoveg', this.description.trim());
    formData.append('receptLeiras', this.fullDescription.trim());
    formData.append('receptIdo', String(this.cookingTime));
    formData.append('receptKategoria', this.selectedCategory);
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
        this.errorMessage = this.getSaveErrorMessage(
          error?.error?.errorMessage || error?.error?.error,
        );
        this.isSubmitting = false;
      },
    });
  }

  formatEditor(command: string, value?: string): void {
    const editor = this.fullDescriptionEditor?.nativeElement;

    if (!editor || !this.isLoggedIn) {
      return;
    }

    editor.focus();
    document.execCommand(command, false, value);
    this.syncFullDescriptionFromEditor();
  }

  syncFullDescriptionFromEditor(): void {
    const editor = this.fullDescriptionEditor?.nativeElement;
    this.fullDescription = editor ? this.htmlToMarkdown(editor) : '';
  }

  private clearMessages(): void {
    this.saveMessage = '';
    this.errorMessage = '';
  }

  private htmlToMarkdown(root: HTMLElement): string {
    return Array.from(root.childNodes)
      .map((node) => this.nodeToMarkdown(node))
      .filter(Boolean)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private nodeToMarkdown(node: ChildNode): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '').replace(/\u00a0/g, ' ');
    }

    if (!(node instanceof HTMLElement)) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();
    const content = () =>
      Array.from(node.childNodes).map((child) => this.nodeToMarkdown(child)).join('').trim();

    if (tagName === 'br') {
      return '\n';
    }

    if (tagName === 'strong' || tagName === 'b') {
      return `**${content()}**`;
    }

    if (tagName === 'em' || tagName === 'i') {
      return `*${content()}*`;
    }

    if (tagName === 'code') {
      return `\`${content()}\``;
    }

    if (tagName === 'h1') {
      return `# ${content()}`;
    }

    if (tagName === 'h2') {
      return `## ${content()}`;
    }

    if (tagName === 'h3') {
      return `### ${content()}`;
    }

    if (tagName === 'ul') {
      return Array.from(node.children)
        .map((child) => `- ${this.nodeToMarkdown(child).trim()}`)
        .join('\n');
    }

    if (tagName === 'ol') {
      return Array.from(node.children)
        .map((child, index) => `${index + 1}. ${this.nodeToMarkdown(child).trim()}`)
        .join('\n');
    }

    if (tagName === 'li' || tagName === 'div' || tagName === 'p') {
      return content();
    }

    return content();
  }

  private getSaveErrorMessage(errorCode: string | undefined): string {
    if (errorCode === 'missing_or_invalid_token') {
      return 'Lejárt vagy hiányzó bejelentkezés. Jelentkezz be újra.';
    }

    if (errorCode === 'missing_required_fields') {
      return 'Töltsd ki a recept nevét, tölts fel képet, válassz kategóriát, add meg az elkészítési időt, a rövid leírást és a teljes leírást.';
    }

    return 'A recept mentése nem sikerült. Próbáld újra később.';
  }
}
