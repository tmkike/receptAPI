import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export type AuthResponse = {
  token: string;
  userid: string;
  is_valid?: 'ok' | 'no';
};

export type Recipe = {
  receptNev: string;
  receptSzoveg: string;
  receptKepURL: string;
  receptID: string;
  receptIdo?: string;
  receptKategoria?: string;
};

export type AutocompleteRecipe = {
  receptNev: string;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly serverUrl = 'http://localhost:3000';

  register(username: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { username, password });
  }

  login(username: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password });
  }

  addRecipe(formData: FormData) {
    return this.http.post<{ is_recorded: 'yes' | 'no'; errorMessage?: string }>(
      `${this.apiUrl}/addRecept`,
      formData,
    );
  }

  getDailyRecipes() {
    return this.http.get<{ responseRecipes: Recipe[] }>(`${this.apiUrl}/dailyRecipes`);
  }

  getCategories() {
    return this.http.get<{ categories: { name: string; count: number }[] }>(`${this.apiUrl}/categories`);
  }

  getRecipes(categories: string[] = []) {
    const params = categories.length
      ? new HttpParams().set('categories', categories.join(','))
      : undefined;

    return this.http.get<{ responseRecipes: Recipe[] }>(`${this.apiUrl}/recipes`, { params });
  }

  addFavorite(receptID: string) {
    return this.http.post<{ favoriteStatus: 'added' | 'removed' | 'error'; error?: string }>(
      `${this.apiUrl}/favorites`,
      { type: 'toFavorite', receptID },
    );
  }

  removeFavorite(receptID: string) {
    return this.http.post<{ favoriteStatus: 'added' | 'removed' | 'error'; error?: string }>(
      `${this.apiUrl}/favorites`,
      { type: 'removeFromfavorite', receptID },
    );
  }

  getFavorites() {
    return this.http.post<{ responseRecipes: Recipe[] }>(`${this.apiUrl}/favorites`, {
      type: 'isFavorite',
    });
  }

  autocomplete(keyword: string) {
    return this.http.post<{ responseRecipes: AutocompleteRecipe[] }>(`${this.apiUrl}/autocomplete`, {
      keyword,
    });
  }

  reportRecipe(receptID: string) {
    return this.http.post<{ is_reported: 'ok' | 'no'; error?: string }>(`${this.apiUrl}/report`, {
      receptID,
    });
  }

  getProfile() {
    return this.http.get<{ username: string }>(`${this.apiUrl}/getProfile`);
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) {
      return '';
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${this.serverUrl}${imageUrl}`;
  }
}
