import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Recipe } from '../../core/api.service';

type RecipeFilter = {
  name: string;
  active: boolean;
};

@Component({
  selector: 'app-receptek',
  imports: [RouterLink, FormsModule],
  templateUrl: './receptek.html',
  styleUrl: './receptek.scss',
})
export class Receptek implements OnInit {
  filtersOpen = false;
  recipesPerPage = 15;
  currentPage = 1;
  allRecipes = signal<Recipe[]>([]);
  searchTerm = signal('');
  recipes = computed(() => {
    const normalizedSearch = this.normalizeText(this.searchTerm());

    if (!normalizedSearch) {
      return this.allRecipes();
    }

    return this.allRecipes().filter((recipe) => {
      const recipeName = this.normalizeText(recipe.receptNev);
      const recipeText = this.normalizeText(recipe.receptSzoveg);
      return recipeName.includes(normalizedSearch) || recipeText.includes(normalizedSearch);
    });
  });
  favoriteRecipeIds = signal<Set<string>>(new Set());
  favoriteSavingIds = signal<Set<string>>(new Set());
  isLoading = signal(false);
  errorMessage = '';
  favoriteMessage = '';
  reportMessage = '';
  shareMessage = '';
  selectedRecipe = signal<Recipe | null>(null);
  private pendingRecipeId = '';

  filters: RecipeFilter[] = [];

  constructor(
    private readonly apiService: ApiService,
    private readonly route: ActivatedRoute,
  ) {}

  get hasActiveFilters(): boolean {
    return this.filters.some((f) => f.active);
  }

  get hasSearchTerm(): boolean {
    return Boolean(this.searchTerm().trim());
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm.set((params.get('kereses') || '').trim());
      this.pendingRecipeId = (params.get('recept') || '').trim();
      this.currentPage = 1;
      this.openPendingRecipeDetails();
    });
    this.loadCategories();
    this.loadFavoriteRecipeIds();
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  toggleFilter(filter: RecipeFilter): void {
    filter.active = !filter.active;
    this.currentPage = 1;
    this.loadRecipes();
  }

  clearFilters(): void {
    this.filters.forEach((f) => (f.active = false));
    this.currentPage = 1;
    this.loadRecipes();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.recipes().length / this.recipesPerPage));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get paginatedRecipes(): Recipe[] {
    const startIndex = (this.currentPage - 1) * this.recipesPerPage;
    return this.recipes().slice(startIndex, startIndex + this.recipesPerPage);
  }

  get shouldShowPagination(): boolean {
    return this.recipes().length > this.recipesPerPage;
  }

  get paginationLabel(): string {
    const totalRecipes = this.recipes().length;
    const firstRecipeNumber = (this.currentPage - 1) * this.recipesPerPage + 1;
    const lastRecipeNumber = Math.min(this.currentPage * this.recipesPerPage, totalRecipes);
    return `${firstRecipeNumber}-${lastRecipeNumber} / ${totalRecipes} recept`;
  }

  changeRecipesPerPage(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  openRecipeDetails(recipe: Recipe): void {
    this.selectedRecipe.set(recipe);
    this.lockPageScroll();
  }

  closeRecipeDetails(): void {
    this.selectedRecipe.set(null);
    this.shareMessage = '';
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
    this.shareMessage = '';

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(recipeUrl);
      } else {
        this.copyTextWithFallback(recipeUrl);
      }

      this.shareMessage = 'A recept linkje a vágólapra került.';
    } catch (_error) {
      this.shareMessage = 'Nem sikerült a linket a vágólapra másolni.';
    }
  }

  @HostListener('document:keydown.escape')
  closeRecipeDetailsWithEscape(): void {
    this.closeRecipeDetails();
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (response) => {
        this.filters = response.categories.map((c) => ({ name: c.name, active: false }));
        this.loadRecipes();
      },
      error: () => {
        this.loadRecipes();
      },
    });
  }

  loadRecipes(): void {
    const activeFilterNames = this.getActiveFilterNames();

    this.isLoading.set(true);
    this.errorMessage = '';

    // Ha nincs aktív filter, mindent betöltünk (üres categories = minden)
    this.apiService.getRecipes(activeFilterNames).subscribe({
      next: (response) => {
        this.allRecipes.set(response.responseRecipes);
        this.currentPage = 1;
        this.openPendingRecipeDetails();
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage = 'A receptek betöltése nem sikerült.';
        this.isLoading.set(false);
      },
    });
  }

  addToFavorites(recipe: Recipe): void {
    this.favoriteMessage = '';
    this.reportMessage = '';

    if (!localStorage.getItem('token')) {
      this.favoriteMessage = 'Kedvenchez adáshoz előbb jelentkezz be.';
      return;
    }

    this.apiService.addFavorite(recipe.receptID).subscribe({
      next: () => {
        this.favoriteMessage = 'A recept bekerült a kedvencek közé.';
      },
      error: () => {
        this.favoriteMessage = 'Nem sikerült kedvenchez adni a receptet.';
      },
    });
  }

  reportRecipe(recipe: Recipe): void {
    this.favoriteMessage = '';
    this.reportMessage = '';

    if (!localStorage.getItem('token')) {
      this.reportMessage = 'Recept jelentéséhez előbb jelentkezz be.';
      return;
    }

    this.apiService.reportRecipe(recipe.receptID).subscribe({
      next: () => {
        this.reportMessage = 'Köszönjük, a recept jelentése rögzítve lett.';
      },
      error: (error) => {
        this.reportMessage = this.getReportErrorMessage(error?.error?.error);
      },
    });
  }

  getImageUrl(recipe: Recipe): string {
    return this.apiService.getImageUrl(recipe.receptKepURL);
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

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem('token'));
  }

  isFavorite(recipe: Recipe): boolean {
    return this.favoriteRecipeIds().has(recipe.receptID);
  }

  isSavingFavorite(recipe: Recipe): boolean {
    return this.favoriteSavingIds().has(recipe.receptID);
  }

  favoriteButtonText(recipe: Recipe): string {
    if (!this.isLoggedIn()) {
      return 'Jelentkezz be';
    }

    return this.isFavorite(recipe) ? 'Kedvencekből kivétel' : 'Kedvencekhez adás';
  }

  toggleFavorite(recipe: Recipe): void {
    this.favoriteMessage = '';
    this.reportMessage = '';

    if (!this.isLoggedIn()) {
      this.favoriteMessage = 'Kedvenchez adáshoz előbb jelentkezz be.';
      return;
    }

    if (this.isSavingFavorite(recipe)) {
      return;
    }

    const wasFavorite = this.isFavorite(recipe);
    this.favoriteSavingIds.update((ids) => new Set(ids).add(recipe.receptID));
    this.setFavoriteState(recipe.receptID, !wasFavorite);

    const request = wasFavorite
      ? this.apiService.removeFavorite(recipe.receptID)
      : this.apiService.addFavorite(recipe.receptID);

    request.subscribe({
      next: () => {
        if (wasFavorite) {
          this.favoriteMessage = 'A recept kikerült a kedvencek közül.';
        } else {
          this.favoriteMessage = 'A recept bekerült a kedvencek közé.';
        }

        this.removeSavingFavorite(recipe.receptID);
      },
      error: () => {
        this.setFavoriteState(recipe.receptID, wasFavorite);
        this.favoriteMessage = 'Nem sikerült módosítani a kedvenc állapotot.';
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
        this.favoriteRecipeIds.set(new Set(
          response.responseRecipes.map((recipe) => recipe.receptID),
        ));
      },
      error: () => {
        this.favoriteRecipeIds.set(new Set());
      },
    });
  }

  private setFavoriteState(recipeId: string, isFavorite: boolean): void {
    this.favoriteRecipeIds.update((ids) => {
      const nextIds = new Set(ids);

      if (isFavorite) {
        nextIds.add(recipeId);
      } else {
        nextIds.delete(recipeId);
      }

      return nextIds;
    });
  }

  private removeSavingFavorite(recipeId: string): void {
    this.favoriteSavingIds.update((ids) => {
      const nextIds = new Set(ids);
      nextIds.delete(recipeId);
      return nextIds;
    });
  }

  private normalizeText(value: string): string {
    return value.trim().toLocaleLowerCase('hu-HU');
  }

  private getActiveFilterNames(): string[] {
    return this.filters.filter((f) => f.active).map((f) => f.name);
  }

  private openPendingRecipeDetails(): void {
    if (!this.pendingRecipeId || !this.allRecipes().length) {
      return;
    }

    const recipe = this.allRecipes().find((item) => item.receptID === this.pendingRecipeId);

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

  private getReportErrorMessage(errorCode: string | undefined): string {
    if (errorCode === 'duplicate_report') {
      return 'Ezt a receptet már jelentetted.';
    }

    if (errorCode === 'recipe_not_found') {
      return 'A recept már nem található.';
    }

    return 'A recept jelentése nem sikerült.';
  }
}
