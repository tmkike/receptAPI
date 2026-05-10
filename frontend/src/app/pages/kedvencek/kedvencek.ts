import { Component, HostListener, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Recipe } from '../../core/api.service';

type FavoriteFilter = {
  name: string;
  active: boolean;
};

@Component({
  selector: 'app-kedvencek',
  imports: [RouterLink, FormsModule],
  templateUrl: './kedvencek.html',
  styleUrl: './kedvencek.scss',
})
export class Kedvencek implements OnInit {
  filtersOpen = false;
  favoritesPerPage = 15;
  favorites = signal<Recipe[]>([]);
  isLoading = signal(false);
  statusMessage = signal('');
  errorMessage = signal('');
  shareMessage = signal('');
  selectedRecipe = signal<Recipe | null>(null);
  private pendingRecipeId = '';

  filters: FavoriteFilter[] = [
    { name: 'Saláták', active: true },
    { name: 'Streetfood', active: true },
    { name: 'Vegetáriánus', active: true },
    { name: 'Vegán ételek', active: true },
    { name: 'Édes sütemények', active: true },
    { name: 'Sós sütemények', active: true },
    { name: 'Tésztafélék', active: true },
    { name: 'Savanyúságok', active: true },
    { name: 'Kenyérfélék', active: true },
    { name: 'Főzelék', active: true },
    { name: 'Levesek', active: true },
    { name: 'Halételek', active: true },
    { name: 'Marhaételek', active: true },
    { name: 'Sertésételek', active: true },
    { name: 'Csirkeételek', active: true },
    { name: 'Borjúételek', active: true },
    { name: 'Egyéb húsfélék', active: true },
    { name: 'Grill/Kerti ételek', active: true },
    { name: 'Köretek', active: true },
  ];

  constructor(
    private readonly apiService: ApiService,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.pendingRecipeId = (params.get('recept') || '').trim();
      this.openPendingRecipeDetails();
    });
    this.loadFavorites();
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  toggleFilter(filter: FavoriteFilter): void {
    filter.active = !filter.active;
  }

  loadFavorites(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');

    if (!localStorage.getItem('token')) {
      this.errorMessage.set('A kedvencek megtekintéséhez jelentkezz be.');
      return;
    }

    this.isLoading.set(true);

    this.apiService.getFavorites().subscribe({
      next: (response) => {
        this.favorites.set(response.responseRecipes);
        this.openPendingRecipeDetails();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('A kedvencek betöltése nem sikerült.');
        this.isLoading.set(false);
      },
    });
  }

  removeFromFavorites(recipe: Recipe): void {
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.apiService.removeFavorite(recipe.receptID).subscribe({
      next: () => {
        this.favorites.update((favorites) =>
          favorites.filter((item) => item.receptID !== recipe.receptID),
        );
        this.closeRecipeDetails();
        this.statusMessage.set('A recept kikerült a kedvencek közül.');
      },
      error: () => {
        this.errorMessage.set('Nem sikerült eltávolítani a receptet a kedvencekből.');
      },
    });
  }

  getImageUrl(recipe: Recipe): string {
    return this.apiService.getImageUrl(recipe.receptKepURL);
  }

  openRecipeDetails(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
    this.lockPageScroll();
  }

  closeRecipeDetails(): void {
    this.selectedRecipe.set(null);
    this.shareMessage.set('');
    this.unlockPageScroll();
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

  private openPendingRecipeDetails(): void {
    if (!this.pendingRecipeId || !this.favorites().length) {
      return;
    }

    const recipe = this.favorites().find((item) => item.receptID === this.pendingRecipeId);

    if (recipe) {
      this.selectedRecipe.set(recipe);
      this.lockPageScroll();
    }
  }

  private lockPageScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockPageScroll(): void {
    document.body.style.overflow = '';
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
