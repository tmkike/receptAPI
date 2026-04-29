import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
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
}
