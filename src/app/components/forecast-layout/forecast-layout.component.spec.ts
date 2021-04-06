import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastLayoutComponent } from './forecast-layout.component';

describe('ForecastLayoutComponent', () => {
  let component: ForecastLayoutComponent;
  let fixture: ComponentFixture<ForecastLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForecastLayoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForecastLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
