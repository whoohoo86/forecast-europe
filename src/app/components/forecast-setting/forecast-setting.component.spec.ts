import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastSettingComponent } from './forecast-setting.component';

describe('ForecastSettingComponent', () => {
  let component: ForecastSettingComponent;
  let fixture: ComponentFixture<ForecastSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForecastSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForecastSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
