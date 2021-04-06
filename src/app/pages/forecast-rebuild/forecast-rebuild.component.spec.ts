import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastRebuildComponent } from './forecast-rebuild.component';

describe('ForecastRebuildComponent', () => {
  let component: ForecastRebuildComponent;
  let fixture: ComponentFixture<ForecastRebuildComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForecastRebuildComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForecastRebuildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
