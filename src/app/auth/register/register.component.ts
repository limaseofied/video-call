import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  error = '';
  success = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]]
    });
  }

  // Strict-mode safe getter
  get f(): { [key: string]: AbstractControl } {
    return this.registerForm.controls;
  }

  register() {
    if (this.registerForm.invalid) return;

    const { name, email, password, password_confirmation } = this.registerForm.value;

    this.auth.register({ name, email, password, password_confirmation }).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.access_token);
        this.success = 'Registration successful!';
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Registration failed';
      }
    });
  }
}
