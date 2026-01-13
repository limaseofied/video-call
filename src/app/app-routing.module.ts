import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VideoCallComponent } from './video-call/video-call.component';
import { SubscriptionCallComponent } from './subscription-call/subscription-call.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent },
  // Video call routes
  { path: 'call', component: VideoCallComponent },            // generic call page
  { path: 'call/:roomId', component: VideoCallComponent },    // join a specific room
  // Subscription call route (5-minute timed call)
  { path: 'subscription-call', component: SubscriptionCallComponent },

  // Wildcard fallback
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
