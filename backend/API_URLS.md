## API URL-ok (rovid leiras)

Alap utvonal: /api

1. POST /api/login
- Cel: bejelentkezes
- Keres (JSON): {"username":"...","password":"..."}
- Sikeres valasz: {"token":"...","userid":"..."}

2. POST /api/register
- Cel: regisztracio
- Keres (JSON): {"username":"...","password":"..."}
- Sikeres valasz: {"token":"...","userid":"...","is_valid":"ok"}
- Hibas valasz: {"is_valid":"no","error":"..."}

3. GET /api/dailyRecipes
- Cel: napi receptek lekerese
- Mukodes: keresenkent veletlenszeru 5 recept
- Valasz: {"responseRecipes":[{"receptNev":"...","receptSzoveg":"...","receptKepURL":"...","receptID":"..."}, ...]}

4. GET /api/recipes
- Cel: osszes recept lekerese
- Mukodes: letrehozas szerinti csokkeno sorrendben adja vissza a recepteket
- Valasz: {"responseRecipes":[{"receptNev":"...","receptSzoveg":"...","receptKepURL":"...","receptID":"..."}, ...]}

5. POST /api/report
- Cel: recept jelentese
- Vedelme: JWT kotelezo
- Keres (JSON): {"receptID":"..."}
- Sikeres valasz: {"is_reported":"ok"}
- Dupla jelentes (ugyanaz a felhasznalo + recept): hiba (duplicate_report)

6. POST /api/addRecept
- Cel: uj recept rogzitese
- Vedelme: JWT kotelezo
- Keres: multipart/form-data
- Mezok: receptNev, receptSzoveg, receptIdo, receptKategoria, hozzavalok[] + kep (field: kep)
- Sikeres valasz: {"is_recorded":"yes"}
- Hibas valasz: {"is_recorded":"no","errorMessage":"..."}

7. POST /api/autocomplete
- Cel: receptnev automatikus kiegeszites
- Keres (JSON): {"keyword":"..."}
- Valasz: {"responseRecipes":[{"receptNev":"..."}, ...]}

8. POST /api/searchRecipes
- Cel: recept kereses nevben, rovid szovegben es receptleirasban
- Keres (JSON): {"keyword":"..."}
- Valasz: {"responseRecipes":[{"receptNev":"...","receptSzoveg":"...","receptLeiras":"...","receptKepURL":"...","receptID":"..."}, ...]}

9. POST /api/favorites
- Cel: kedvencek kezelese
- Vedelme: JWT kotelezo minden muvelethez
- Keres (JSON): {"type":"toFavorite|removeFromfavorite|isFavorite","receptID":"..."}
- toFavorite valasz: {"favoriteStatus":"added"}
- removeFromfavorite valasz: {"favoriteStatus":"removed"}
- isFavorite valasz: {"responseRecipes":[{"receptID":"..."}, ...]}
- Hibas valasz: {"favoriteStatus":"error","error":"..."}

10. GET /api/getProfile
- Cel: profil adatok lekerese
- Vedelme: JWT kotelezo
- Valasz: {"username":"..."}

## JWT hasznalat
- Fejlec: Authorization: Bearer <token>
- Vedett vegpontok: /api/addRecept, /api/getProfile, /api/favorites, /api/report
