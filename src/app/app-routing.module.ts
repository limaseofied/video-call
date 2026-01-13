import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VideoCallComponent } from './video-call/video-call.component';
import { SubscriptionCallComponent } from './subscription-call/subscription-call.component';

const routes: Routes = [
  // Redirect root to VideoCall by default
  { path: '', redirectTo: 'call', pathMatch: 'full' },

  // Video call routes
  { path: 'call', component: VideoCallComponent },            // generic call page
  { path: 'call/:roomId', component: VideoCallComponent },    // join a specific room

  // Subscription call route (5-minute timed call)
  { path: 'subscription-call', component: SubscriptionCallComponent },

  // Wildcard fallback
  { path: '**', redirectTo: 'call' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
