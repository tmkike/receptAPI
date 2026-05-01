import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-regisztracio',
  imports: [RouterLink, FormsModule],
  templateUrl: './regisztracio.html',
  styleUrl: './regisztracio.scss',
})
export class Regisztracio {
  email = '';
  password = '';
  passwordAgain = '';
  emailInvalid = false;
  emailTouched = false;
  passwordMismatch = false;
  passwordAgainTouched = false;
  passwordTooShort = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly apiService: ApiService,
    private readonly router: Router,
  ) {}

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  onEmailChange(): void {
    this.clearMessages();

    if (this.emailTouched) {
      this.emailInvalid = !this.isEmailValid(this.email);
    }
  }

  onPasswordChange(): void {
    this.clearMessages();
    this.passwordTooShort = false;

    if (this.passwordAgainTouched) {
      this.passwordMismatch = this.password !== this.passwordAgain;
    }
  }

  validatePasswords(): void {
    this.passwordAgainTouched = true;
    this.passwordMismatch = this.password !== this.passwordAgain;
    this.clearMessages();
  }

  validateEmail(): void {
    this.emailTouched = true;
    this.emailInvalid = !this.isEmailValid(this.email);
    this.clearMessages();
  }

  register(): void {
    this.emailTouched = true;
    this.passwordAgainTouched = true;
    this.emailInvalid = !this.isEmailValid(this.email);
    this.passwordMismatch = this.password !== this.passwordAgain;
    this.passwordTooShort = this.password.length < 6;
    this.clearMessages();

    if (this.emailInvalid || this.passwordMismatch || this.passwordTooShort || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.apiService
      .register(this.email.trim(), this.password)
      .pipe(
        timeout(10 * 1000),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userid', response.userid);
        localStorage.setItem('username', this.email.trim());
        this.successMessage = 'Sikeres regisztráció.';
        this.reloadOnRecipesPage();
      },
      error: (error) => {
        this.errorMessage = this.getRegisterErrorMessage(error?.error?.error, error?.status, error?.name);
      },
    });
  }

  private isEmailValid(email: string): boolean {
    const trimmedEmail = email.trim();
    const atIndex = trimmedEmail.indexOf('@');
    const dotAfterAtIndex = trimmedEmail.indexOf('.', atIndex + 1);

    return atIndex > 0 && dotAfterAtIndex > atIndex + 1 && dotAfterAtIndex < trimmedEmail.length - 1;
  }

  private getRegisterErrorMessage(
    errorCode: string | undefined,
    status?: number,
    errorName?: string,
  ): string {
    if (errorName === 'TimeoutError') {
      return 'A szerver túl lassan válaszolt. Próbáld újra.';
    }

    if (status === 0) {
      return 'Nem sikerült elérni a szervert. Ellenőrizd, hogy fut-e a backend.';
    }

    if (errorCode === 'username_exists') {
      return 'Ezzel az e-mail címmel már létezik fiók.';
    }

    if (errorCode === 'password_too_short') {
      return 'A jelszónak legalább 6 karakter hosszúnak kell lennie.';
    }

    if (errorCode === 'missing_credentials') {
      return 'Add meg az e-mail címet és a jelszót.';
    }

    return 'A regisztráció nem sikerült. Próbáld újra később.';
  }

  private reloadOnRecipesPage(): void {
    this.router.navigate(['/receptek']).then(() => {
      window.location.reload();
    });
  }
}
