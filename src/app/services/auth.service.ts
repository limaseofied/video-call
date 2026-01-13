import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8000/api'; // adjust your Laravel API

  constructor(private http: HttpClient) {}

  login(data: { email: string, password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  register(data: { name: string; email: string; password: string; password_confirmation: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/register`, data);
}


  // Add this method to return the token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Optional: check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}
