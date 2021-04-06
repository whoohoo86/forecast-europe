import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastLayoutItemComponent } from './forecast-layout-item.component';

describe('ForecastLayoutItemComponent', () => {
  let component: ForecastLayoutItemComponent;
  let fixture: ComponentFixture<ForecastLayoutItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForecastLayoutItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForecastLayoutItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
