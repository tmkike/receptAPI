/**
 * Letölti az ételképeket a TheMealDB ingyenes API-jából az uploads/ mappába
 * és frissíti a DB-ben az image_url mezőt.
 * Futtatás: node src/db/download-images.js
 */

const fs = require('fs');
const path = require('path');
const { db } = require('./sqlite');
const config = require('../config');

// Recept neve → TheMealDB keresőszó (angol)
const mealdbSearch = {
  'Sajtos teszta':       'pasta',
  'Paradicsomos leves':  'tomato soup',
  'Rantotta':            'omelette',
  'Csirkeporkolt':       'chicken',
  'Gombas rizotto':      'risotto',
  'Palacsinta':          'pancake',
  'Lencseleves':         'lentil',
  'Tojasos nokedli':     'noodles',
  'Rakott krumpli':      'potato',
  'Gulyasleves':         'beef stew',
  'Lecsó':               'ratatouille',
  'Bundas kenyer':       'toast',
  'Toltott paprika':     'pepper',
  'Zoldborsofelem':      'peas',
  'Magyaros csirkemell': 'roast chicken',
  'Soska fozelek':       'spinach',
  'Halaszle':            'fish',
  'Káposztas teszta':    'pasta',
  'Fokhagymas gomba':    'mushroom',
  'Sult csirkecomb':     'roast chicken',
};

// Fájlnév slughoz
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i')
    .replace(/[óöőô]/g, 'o').replace(/[úüű]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getMealDbImageUrl(searchTerm) {
  const encoded = encodeURIComponent(searchTerm);
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encoded}`);
  if (!res.ok) throw new Error(`MealDB HTTP ${res.status}`);
  const data = await res.json();
  if (!data.meals || data.meals.length === 0) throw new Error(`Nincs találat: ${searchTerm}`);
  return data.meals[0].strMealThumb;
}

async function downloadImage(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} – ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

async function main() {
  if (!fs.existsSync(config.UPLOAD_DIR)) {
    fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
  }

  const recipes = db.prepare('SELECT id, name FROM recipes').all();
  const update = db.prepare('UPDATE recipes SET image_url = ? WHERE id = ?');

  for (const recipe of recipes) {
    const searchTerm = mealdbSearch[recipe.name] || recipe.name;
    const slug = toSlug(recipe.name);
    const filename = `recipe-${recipe.id}-${slug}.jpg`;
    const destPath = path.join(config.UPLOAD_DIR, filename);

    try {
      process.stdout.write(`Letöltés: ${recipe.name} (${searchTerm}) ... `);
      const imgUrl = await getMealDbImageUrl(searchTerm);
      await downloadImage(imgUrl, destPath);
      update.run(`/uploads/${filename}`, recipe.id);
      console.log('OK');
    } catch (err) {
      console.log(`HIBA: ${err.message}`);
    }
  }

  console.log('\nKész! Képek elérési útja frissítve a DB-ben.');
}

main();
