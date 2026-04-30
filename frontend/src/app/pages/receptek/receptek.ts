import { Component, OnInit, computed, signal } from '@angular/core';
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
  favoriteRecipeIds = new Set<string>();
  favoriteSavingIds = new Set<string>();
  isLoading = signal(false);
  errorMessage = '';
  favoriteMessage = '';
  reportMessage = '';

  filters: RecipeFilter[] = [];

  constructor(
    private readonly apiService: ApiService,
    private readonly route: ActivatedRoute,
  ) {}

  get hasActiveFilters(): boolean {
    return this.filters.some((f) => f.active);
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm.set((params.get('kereses') || '').trim());
      this.currentPage = 1;
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

  isLoggedIn(): boolean {
    return Boolean(localStorage.getItem('token'));
  }

  isFavorite(recipe: Recipe): boolean {
    return this.favoriteRecipeIds.has(recipe.receptID);
  }

  isSavingFavorite(recipe: Recipe): boolean {
    return this.favoriteSavingIds.has(recipe.receptID);
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

    this.favoriteSavingIds = new Set(this.favoriteSavingIds).add(recipe.receptID);

    const request = this.isFavorite(recipe)
      ? this.apiService.removeFavorite(recipe.receptID)
      : this.apiService.addFavorite(recipe.receptID);

    request.subscribe({
      next: () => {
        if (this.isFavorite(recipe)) {
          const nextIds = new Set(this.favoriteRecipeIds);
          nextIds.delete(recipe.receptID);
          this.favoriteRecipeIds = nextIds;
          this.favoriteMessage = 'A recept kikerült a kedvencek közül.';
        } else {
          this.favoriteRecipeIds = new Set(this.favoriteRecipeIds).add(recipe.receptID);
          this.favoriteMessage = 'A recept bekerült a kedvencek közé.';
        }

        this.removeSavingFavorite(recipe.receptID);
      },
      error: () => {
        this.favoriteMessage = 'Nem sikerült módosítani a kedvenc állapotot.';
        this.removeSavingFavorite(recipe.receptID);
      },
    });
  }

  private loadFavoriteRecipeIds(): void {
    if (!this.isLoggedIn()) {
      this.favoriteRecipeIds = new Set();
      return;
    }

    this.apiService.getFavorites().subscribe({
      next: (response) => {
        this.favoriteRecipeIds = new Set(
          response.responseRecipes.map((recipe) => recipe.receptID),
        );
      },
      error: () => {
        this.favoriteRecipeIds = new Set();
      },
    });
  }

  private removeSavingFavorite(recipeId: string): void {
    const nextIds = new Set(this.favoriteSavingIds);
    nextIds.delete(recipeId);
    this.favoriteSavingIds = nextIds;
  }

  private normalizeText(value: string): string {
    return value.trim().toLocaleLowerCase('hu-HU');
  }

  private getActiveFilterNames(): string[] {
    return this.filters.filter((f) => f.active).map((f) => f.name);
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
