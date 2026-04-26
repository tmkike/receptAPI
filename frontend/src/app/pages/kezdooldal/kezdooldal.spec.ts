import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Kezdooldal } from './kezdooldal';

describe('Kezdooldal', () => {
  let component: Kezdooldal;
  let fixture: ComponentFixture<Kezdooldal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kezdooldal],
    }).compileComponents();

    fixture = TestBed.createComponent(Kezdooldal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
