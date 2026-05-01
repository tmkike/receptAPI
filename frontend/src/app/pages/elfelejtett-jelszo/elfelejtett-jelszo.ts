import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-elfelejtett-jelszo',
  imports: [RouterLink, FormsModule],
  templateUrl: './elfelejtett-jelszo.html',
  styleUrl: './elfelejtett-jelszo.scss',
})
export class ElfelejtettJelszo {
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

  validateEmail(): void {
    this.emailTouched = true;
    this.emailInvalid = !this.isEmailValid(this.email);
    this.clearMessages();
  }

  validatePasswords(): void {
    this.passwordAgainTouched = true;
    this.passwordMismatch = this.password !== this.passwordAgain;
    this.clearMessages();
  }

  resetPassword(): void {
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
      .resetPassword(this.email.trim(), this.password)
      .pipe(
        timeout(10 * 1000),
        finalize(() => {
          this.isSubmitting = false;
        }),
      )
      .subscribe({
        next: () => {
          this.password = '';
          this.passwordAgain = '';
          this.successMessage = 'A jelszó sikeresen módosítva lett. Most már bejelentkezhetsz.';
          this.router.navigate(['/bejelentkezes']);
        },
        error: (error) => {
          this.errorMessage = this.getResetPasswordErrorMessage(
            error?.error?.error,
            error?.status,
            error?.name,
          );
        },
      });
  }

  private isEmailValid(email: string): boolean {
    const trimmedEmail = email.trim();
    const atIndex = trimmedEmail.indexOf('@');
    const dotAfterAtIndex = trimmedEmail.indexOf('.', atIndex + 1);

    return atIndex > 0 && dotAfterAtIndex > atIndex + 1 && dotAfterAtIndex < trimmedEmail.length - 1;
  }

  private getResetPasswordErrorMessage(
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

    if (errorCode === 'user_not_found') {
      return 'Nincs ilyen regisztrált felhasználó ezen az emailcímen.';
    }

    if (errorCode === 'password_too_short') {
      return 'A jelszónak legalább 6 karakter hosszúnak kell lennie.';
    }

    if (errorCode === 'missing_credentials') {
      return 'Add meg az e-mail címet és az új jelszót.';
    }

    return 'A jelszó módosítása nem sikerült. Próbáld újra később.';
  }
}
