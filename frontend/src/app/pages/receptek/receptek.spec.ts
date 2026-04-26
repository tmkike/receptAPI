import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Receptek } from './receptek';

describe('Receptek', () => {
  let component: Receptek;
  let fixture: ComponentFixture<Receptek>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Receptek],
    }).compileComponents();

    fixture = TestBed.createComponent(Receptek);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
