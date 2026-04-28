import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-bejelentkezes',
  imports: [RouterLink, FormsModule],
  templateUrl: './bejelentkezes.html',
  styleUrl: './bejelentkezes.scss',
})
export class Bejelentkezes {
  email = '';
  password = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  clearMessages(): void {
    this.errorMessage = '';
  }

  login(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password || this.isSubmitting) {
      this.errorMessage = 'Add meg az e-mail címet és a jelszót.';
      return;
    }

    this.isSubmitting = true;

    this.apiService.login(this.email.trim(), this.password).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userid', response.userid);
        localStorage.setItem('username', this.email.trim());
        this.reloadOnRecipesPage();
      },
      error: (error) => {
        this.errorMessage = this.getLoginErrorMessage(error?.error?.error);
        this.isSubmitting = false;
      },
    });
  }

  private getLoginErrorMessage(errorCode: string | undefined): string {
    if (errorCode === 'invalid_credentials') {
      return 'Hibás e-mail cím vagy jelszó.';
    }

    if (errorCode === 'missing_credentials') {
      return 'Add meg az e-mail címet és a jelszót.';
    }

    return 'A bejelentkezés nem sikerült. Próbáld újra később.';
  }

  private reloadOnRecipesPage(): void {
    this.router.navigate(['/receptek']).then(() => {
      window.location.reload();
    });
  }
}
