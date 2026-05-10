import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, Recipe } from '../../core/api.service';

@Component({
  selector: 'app-kezdooldal',
  imports: [RouterLink],
  templateUrl: './kezdooldal.html',
  styleUrl: './kezdooldal.scss',
})
export class Kezdooldal implements OnInit {
  dailyRecipes = signal<Recipe[]>([]);
  favoriteRecipeIds = signal<Set<string>>(new Set());
  favoriteSavingIds = signal<Set<string>>(new Set());
  isLoadingRecipes = signal(false);
  recipesErrorMessage = signal('');
  favoriteMessage = signal('');
  shareMessage = signal('');
  selectedRecipe = signal<Recipe | null>(null);

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDailyRecipes();
    this.loadFavoriteRecipeIds();
  }

  loadDailyRecipes(): void {
    this.isLoadingRecipes.set(true);
    this.recipesErrorMessage.set('');

    this.apiService.getDailyRecipes().subscribe({
      next: (response) => {
        this.dailyRecipes.set(response.responseRecipes);
        this.isLoadingRecipes.set(false);
      },
      error: () => {
        this.recipesErrorMessage.set('A receptek betöltése nem sikerült.');
        this.isLoadingRecipes.set(false);
      },
    });
  }

  getImageUrl(recipe: Recipe): string {
    return this.apiService.getImageUrl(recipe.receptKepURL);
  }

  openRecipeDetails(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
  }

  closeRecipeDetails(): void {
    this.selectedRecipe.set(null);
    this.shareMessage.set('');
  }

  onRecipeCardKeydown(event: KeyboardEvent, recipe: Recipe): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    this.openRecipeDetails(recipe);
  }

  stopRecipeDetailsClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  async shareRecipe(recipe: Recipe): Promise<void> {
    const recipeUrl = `${window.location.origin}/receptek?recept=${encodeURIComponent(recipe.receptID)}`;
    this.shareMessage.set('');

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(recipeUrl);
      } else {
        this.copyTextWithFallback(recipeUrl);
      }

      this.shareMessage.set('A recept linkje a vágólapra került.');
    } catch (_error) {
      this.shareMessage.set('Nem sikerült a linket a vágólapra másolni.');
    }
  }

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem('token'));
  }

  isFavorite(recipe: Recipe): boolean {
    return this.favoriteRecipeIds().has(recipe.receptID);
  }

  isSavingFavorite(recipe: Recipe): boolean {
    return this.favoriteSavingIds().has(recipe.receptID);
  }

  toggleFavorite(recipe: Recipe): void {
    if (!this.isLoggedIn() || this.isSavingFavorite(recipe)) {
      return;
    }

    this.favoriteMessage.set('');
    this.favoriteSavingIds.update((ids) => new Set(ids).add(recipe.receptID));

    const request = this.isFavorite(recipe)
      ? this.apiService.removeFavorite(recipe.receptID)
      : this.apiService.addFavorite(recipe.receptID);

    request.subscribe({
      next: () => {
        if (this.isFavorite(recipe)) {
          this.favoriteRecipeIds.update((ids) => {
            const nextIds = new Set(ids);
            nextIds.delete(recipe.receptID);
            return nextIds;
          });
          this.favoriteMessage.set('A recept kikerült a kedvencek közül.');
        } else {
          this.favoriteRecipeIds.update((ids) => new Set(ids).add(recipe.receptID));
          this.favoriteMessage.set('A recept bekerült a kedvencek közé.');
        }

        this.removeSavingFavorite(recipe.receptID);
      },
      error: () => {
        this.favoriteMessage.set('Nem sikerült módosítani a kedvenc állapotot.');
        this.removeSavingFavorite(recipe.receptID);
      },
    });
  }

  private loadFavoriteRecipeIds(): void {
    if (!this.isLoggedIn()) {
      this.favoriteRecipeIds.set(new Set());
      return;
    }

    this.apiService.getFavorites().subscribe({
      next: (response) => {
        this.favoriteRecipeIds.set(
          new Set(response.responseRecipes.map((recipe) => recipe.receptID)),
        );
      },
      error: () => {
        this.favoriteRecipeIds.set(new Set());
      },
    });
  }

  private removeSavingFavorite(recipeId: string): void {
    this.favoriteSavingIds.update((ids) => {
      const nextIds = new Set(ids);
      nextIds.delete(recipeId);
      return nextIds;
    });
  }

  renderMarkdown(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const lines = this.escapeHtml(value).split(/\r?\n/);
    const htmlParts: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const closeList = () => {
      if (listType) {
        htmlParts.push(`</${listType}>`);
        listType = null;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        closeList();
        continue;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        closeList();
        const level = headingMatch[1].length + 2;
        htmlParts.push(`<h${level}>${this.renderInlineMarkdown(headingMatch[2])}</h${level}>`);
        continue;
      }

      const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
      if (unorderedMatch) {
        if (listType !== 'ul') {
          closeList();
          htmlParts.push('<ul>');
          listType = 'ul';
        }
        htmlParts.push(`<li>${this.renderInlineMarkdown(unorderedMatch[1])}</li>`);
        continue;
      }

      const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
      if (orderedMatch) {
        if (listType !== 'ol') {
          closeList();
          htmlParts.push('<ol>');
          listType = 'ol';
        }
        htmlParts.push(`<li>${this.renderInlineMarkdown(orderedMatch[1])}</li>`);
        continue;
      }

      closeList();
      htmlParts.push(`<p>${this.renderInlineMarkdown(line)}</p>`);
    }

    closeList();
    return htmlParts.join('');
  }

  @HostListener('document:keydown.escape')
  closeRecipeDetailsWithEscape(): void {
    this.closeRecipeDetails();
  }

  private copyTextWithFallback(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private renderInlineMarkdown(value: string): string {
    return value
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
}
