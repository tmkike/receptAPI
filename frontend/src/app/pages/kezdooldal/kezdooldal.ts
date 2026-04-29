import { Component, OnInit, signal } from '@angular/core';
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
}
