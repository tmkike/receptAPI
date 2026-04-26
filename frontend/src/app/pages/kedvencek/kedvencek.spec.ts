import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Kedvencek } from './kedvencek';

describe('Kedvencek', () => {
  let component: Kedvencek;
  let fixture: ComponentFixture<Kedvencek>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kedvencek],
    }).compileComponents();

    fixture = TestBed.createComponent(Kedvencek);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
