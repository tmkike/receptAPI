import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hozzaad } from './hozzaad';

describe('Hozzaad', () => {
  let component: Hozzaad;
  let fixture: ComponentFixture<Hozzaad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hozzaad],
    }).compileComponents();

    fixture = TestBed.createComponent(Hozzaad);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
