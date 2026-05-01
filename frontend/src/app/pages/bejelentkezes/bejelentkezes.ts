import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

type LoginErrorBody = {
  error?: string;
  message?: string;
  is_valid?: 'ok' | 'no';
};

@Component({
  selector: 'app-bejelentkezes',
  imports: [RouterLink, FormsModule],
  templateUrl: './bejelentkezes.html',
  styleUrl: './bejelentkezes.scss',
})
export class Bejelentkezes {
  email = '';
  password = '';
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  clearMessages(): void {
    this.errorMessage.set('');
  }

  login(): void {
    this.errorMessage.set('');

    if (!this.email.trim() || !this.password || this.isSubmitting()) {
      this.errorMessage.set('Add meg az e-mail címet és a jelszót.');
      return;
    }

    this.isSubmitting.set(true);

    this.apiService.login(this.email.trim(), this.password).subscribe({
      next: (response) => {
        if (response.is_valid === 'no' || !response.token) {
          this.errorMessage.set(this.getLoginErrorMessage(response.error));
          this.isSubmitting.set(false);
          return;
        }

        localStorage.setItem('token', response.token);
        localStorage.setItem('userid', response.userid);
        localStorage.setItem('username', this.email.trim());
        this.reloadOnRecipesPage();
      },
      error: (error) => {
        this.errorMessage.set(this.getLoginErrorMessage(this.getLoginErrorCode(error?.error)));
        this.isSubmitting.set(false);
      },
    });
  }

  private getLoginErrorCode(errorBody: LoginErrorBody | string | undefined): string | undefined {
    if (!errorBody) {
      return undefined;
    }

    if (typeof errorBody === 'string') {
      return errorBody;
    }

    return errorBody.error || errorBody.message;
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
