import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { VideoCallComponent } from './video-call/video-call.component';
import { SubscriptionCallComponent } from './subscription-call/subscription-call.component';

@NgModule({
  declarations: [
    AppComponent,
    VideoCallComponent,
    SubscriptionCallComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
