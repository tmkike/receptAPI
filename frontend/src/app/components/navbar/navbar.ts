import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService, AutocompleteRecipe } from '../../core/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  searchText = '';
  suggestions: AutocompleteRecipe[] = [];
  username = '';
  isLoggedIn = false;

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.loadProfile());
  }

  onSearchChange(): void {
    const keyword = this.searchText.trim();

    if (keyword.length < 2) {
      this.suggestions = [];
      return;
    }

    this.apiService.autocomplete(keyword).subscribe({
      next: (response) => {
        this.suggestions = response.responseRecipes;
      },
      error: () => {
        this.suggestions = [];
      },
    });
  }

  onSearch(): void {
    const keyword = this.searchText.trim();
    this.suggestions = [];
    this.router.navigate(['/receptek'], {
      queryParams: keyword ? { kereses: keyword } : {},
    });
  }

  selectSuggestion(recipeName: string): void {
    this.searchText = recipeName;
    this.suggestions = [];
    this.router.navigate(['/receptek'], {
      queryParams: { kereses: recipeName },
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('username');
    this.isLoggedIn = false;
    this.username = '';
    this.router.navigate(['/bejelentkezes']);
  }

  private loadProfile(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = Boolean(token);

    if (!token) {
      this.username = '';
      return;
    }

    this.username = localStorage.getItem('username') || 'Bejelentkezve';

    this.apiService.getProfile().subscribe({
      next: (profile) => {
        this.username = profile.username;
        localStorage.setItem('username', profile.username);
      },
      error: () => {
        this.username = localStorage.getItem('username') || 'Bejelentkezve';
      },
    });
  }
}
