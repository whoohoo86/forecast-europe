import { LayoutModule } from '@angular/cdk/layout';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { ScaffoldComponent } from './scaffold.component';

describe('ScaffoldComponent', () => {
  let component: ScaffoldComponent;
  let fixture: ComponentFixture<ScaffoldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ScaffoldComponent],
      imports: [
        NoopAnimationsModule,
        LayoutModule,
        MatButtonModule,
        MatCardModule,
        MatGridListModule,
        MatIconModule,
        MatMenuModule,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScaffoldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
