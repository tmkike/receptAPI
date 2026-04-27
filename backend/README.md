# Recept API – Backend

Express.js + SQLite alapú REST API, JWT autentikációval és képfeltöltéssel.

---

## Technológiák

| Csomag | Szerepe |
|---|---|
| express | HTTP szerver és routing |
| better-sqlite3 | SQLite adatbázis (szinkron) |
| jsonwebtoken | JWT token generálás / ellenőrzés |
| bcryptjs | Jelszó hashelés |
| multer | Képfeltöltés (multipart/form-data) |
| cors | Cross-Origin kérések engedélyezése |
| dotenv | Környezeti változók betöltése |

---

## Mappastruktúra

```
backend/
├── data/
│   └── app.db              # SQLite adatbázis
├── src/
│   ├── index.js            # Szerver belépési pont
│   ├── app.js              # Express app, middleware, route bekötések
│   ├── config.js           # Konfiguráció (.env alapján)
│   ├── db/
│   │   ├── sqlite.js       # DB kapcsolat
│   │   ├── migrate.js      # Táblák létrehozása
│   │   └── seed.js         # Alap adatok feltöltése (20 recept)
│   ├── middleware/
│   │   ├── auth.js         # JWT ellenőrzés (védett route-okhoz)
│   │   └── upload.js       # Multer konfiguráció (kép feltöltés)
│   ├── routes/
│   │   ├── auth.routes.js      # /api/login, /api/register
│   │   ├── recipes.routes.js   # /api/dailyRecipes, /api/addRecept, /api/autocomplete, /api/report
│   │   ├── favorites.routes.js # /api/favorites
│   │   └── profile.routes.js   # /api/getProfile
│   └── utils/
│       └── jwt.js          # Token generálás és ellenőrzés segédfüggvények
├── uploads/                # Feltöltött képek tárolási helye
├── .env.example            # Környezeti változók sablonja
├── .gitignore
├── API_URLS.md             # API végpontok részletes leírása (HU)
└── package.json
```

---

## Indítás

### 1. Klónozás után

```bash
cd backend
npm install
```

### 2. Környezeti változók

Másold le a `.env.example` fájlt és nevezd át `.env`-re:

```bash
cp .env.example .env
```

Tartalom:

```
PORT=3000
JWT_SECRET=change-this-in-dev
DB_PATH=./data/app.db
UPLOAD_DIR=./uploads
```

> A `JWT_SECRET` értékét éles használat előtt **mindenképpen** cseréld le egy hosszú, véletlenszerű stringre.

### 3. Szerver indítása

```bash
# Sima indítás
npm start

# Fejlesztői mód (automatikus újraindítás fájlváltozáskor)
npm run dev
```

A szerver alapból a **http://localhost:3000** címen fut.

### 4. Seed futtatása (opcionális, ha üres a DB)

```bash
npm run seed
```

Ez 20 magyar receptet tölt be az adatbázisba. Ha már vannak receptek, nem futtatja újra.

---

## Egészség ellenőrzés

```
GET http://localhost:3000/health
→ { "status": "ok" }
```

---

## Angular frontend bekötése

### 1. CORS

A backend jelenleg **minden origint** enged (`cors()` middleware). Fejlesztés közben ez megfelelő.

Éles környezetben az `src/app.js`-ben szűkítsd le:

```js
app.use(cors({ origin: 'http://localhost:4200' }));
```

### 2. API URL beállítása Angularban

Hozz létre egy `environment` változót a frontend projektben:

**`frontend/src/environments/environment.ts`**
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

**`frontend/src/environments/environment.prod.ts`**
```ts
export const environment = {
  production: true,
  apiUrl: 'https://sajat-szerver.hu/api'
};
```

### 3. HttpClient bekötése (`app.config.ts`)

```ts
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

### 4. JWT token kezelése

Bejelentkezés / regisztráció után tárold el a tokent:

```ts
localStorage.setItem('token', response.token);
localStorage.setItem('userid', response.userid);
```

Kijelentkezéskor töröld:

```ts
localStorage.removeItem('token');
localStorage.removeItem('userid');
```

### 5. HTTP Interceptor JWT-hez

Hozz létre egy interceptort, ami minden kéréshez automatikusan csatolja a tokent:

**`frontend/src/app/interceptors/auth.interceptor.ts`**
```ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
```

Regisztráld az `app.config.ts`-ben:

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

### 6. Példa API hívás service-ben

```ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getDailyRecipes() {
    return this.http.get(`${this.api}/dailyRecipes`);
  }

  login(username: string, password: string) {
    return this.http.post(`${this.api}/login`, { username, password });
  }

  addFavorite(receptID: string) {
    return this.http.post(`${this.api}/favorites`, { type: 'toFavorite', receptID });
  }
}
```

### 7. Képfeltöltés (`addRecept`)

```ts
addRecept(formData: FormData) {
  return this.http.post(`${this.api}/addRecept`, formData);
  // Ne állíts be Content-Type headert – a böngésző automatikusan kezeli
}
```

Angular oldalon:

```ts
const fd = new FormData();
fd.append('receptNev', 'Sajtos tészta');
fd.append('receptSzoveg', 'Leírás...');
fd.append('receptIdo', '30 perc');
fd.append('hozzavalok', JSON.stringify(['sajt', 'tészta']));
fd.append('kep', fileInputElement.files[0]);
this.recipeService.addRecept(fd).subscribe(...);
```

---

## Védett végpontok

A következő végpontok **JWT tokent igényelnek** a `Authorization: Bearer <token>` fejlécben:

| Végpont | Metódus |
|---|---|
| /api/addRecept | POST |
| /api/favorites | POST |
| /api/getProfile | GET |
| /api/report | POST |

Token nélküli kérés esetén a válasz:
```json
{ "error": "missing_or_invalid_token" }
```
(HTTP 401)
