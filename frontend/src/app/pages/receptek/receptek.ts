import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  recipes: Recipe[] = [];
  isLoading = false;
  errorMessage = '';
  favoriteMessage = '';
  reportMessage = '';

  filters: RecipeFilter[] = [
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

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  toggleFilters(): void {
    this.filtersOpen = !this.filtersOpen;
  }

  toggleFilter(filter: RecipeFilter): void {
    filter.active = !filter.active;
  }

  loadRecipes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getDailyRecipes().subscribe({
      next: (response) => {
        this.recipes = response.responseRecipes;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'A receptek betöltése nem sikerült.';
        this.isLoading = false;
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
