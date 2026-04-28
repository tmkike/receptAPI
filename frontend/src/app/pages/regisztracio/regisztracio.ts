import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  successMessage = '';

  clearMessages(): void {
    this.successMessage = '';
  }

  onEmailChange(): void {
    this.successMessage = '';

    if (this.emailTouched) {
      this.emailInvalid = !this.isEmailValid(this.email);
    }
  }

  onPasswordChange(): void {
    this.successMessage = '';

    if (this.passwordAgainTouched) {
      this.passwordMismatch = this.password !== this.passwordAgain;
    }
  }

  validatePasswords(): void {
    this.passwordAgainTouched = true;
    this.passwordMismatch = this.password !== this.passwordAgain;
    this.successMessage = '';
  }

  validateEmail(): void {
    this.emailTouched = true;
    this.emailInvalid = !this.isEmailValid(this.email);
    this.successMessage = '';
  }

  register(): void {
    this.emailTouched = true;
    this.passwordAgainTouched = true;
    this.emailInvalid = !this.isEmailValid(this.email);
    this.passwordMismatch = this.password !== this.passwordAgain;
    this.successMessage = '';

    if (this.emailInvalid || this.passwordMismatch) {
      return;
    }

    this.successMessage = 'A regisztrációs adatok rendben vannak. Backend kapcsolat később kerül rá.';
  }

  private isEmailValid(email: string): boolean {
    const trimmedEmail = email.trim();
    const atIndex = trimmedEmail.indexOf('@');
    const dotAfterAtIndex = trimmedEmail.indexOf('.', atIndex + 1);

    return atIndex > 0 && dotAfterAtIndex > atIndex + 1 && dotAfterAtIndex < trimmedEmail.length - 1;
  }
}
