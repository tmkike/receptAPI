import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Bejelentkezes } from './bejelentkezes';

describe('Bejelentkezes', () => {
  let component: Bejelentkezes;
  let fixture: ComponentFixture<Bejelentkezes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bejelentkezes],
    }).compileComponents();

    fixture = TestBed.createComponent(Bejelentkezes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
