import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionCallComponent } from './subscription-call.component';

describe('SubscriptionCallComponent', () => {
  let component: SubscriptionCallComponent;
  let fixture: ComponentFixture<SubscriptionCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubscriptionCallComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
