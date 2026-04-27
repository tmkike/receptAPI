import { Routes } from '@angular/router';
import { Bejelentkezes } from './pages/bejelentkezes/bejelentkezes';
import { Hozzaad } from './pages/hozzaad/hozzaad';
import { Kedvencek } from './pages/kedvencek/kedvencek';
import { Kezdooldal } from './pages/kezdooldal/kezdooldal';
import { Receptek } from './pages/receptek/receptek';
import { Regisztracio } from './pages/regisztracio/regisztracio';

export const routes: Routes = [
  { path: '', redirectTo: 'kezdooldal', pathMatch: 'full' },
  { path: 'kezdooldal', component: Kezdooldal },
  { path: 'receptek', component: Receptek },
  { path: 'kedvencek', component: Kedvencek },
  { path: 'hozzaad', component: Hozzaad },
  { path: 'bejelentkezes', component: Bejelentkezes },
  { path: 'regisztracio', component: Regisztracio },
  { path: '**', redirectTo: 'kezdooldal' },
];
