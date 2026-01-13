import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  user: any = {};

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.http.get('http://localhost:8000/api/user', {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).subscribe(res => this.user = res);
  }

  logout() {
    this.auth.logout();
  }
}
