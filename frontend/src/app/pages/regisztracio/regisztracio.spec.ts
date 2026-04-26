import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Regisztracio } from './regisztracio';

describe('Regisztracio', () => {
  let component: Regisztracio;
  let fixture: ComponentFixture<Regisztracio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Regisztracio],
    }).compileComponents();

    fixture = TestBed.createComponent(Regisztracio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
