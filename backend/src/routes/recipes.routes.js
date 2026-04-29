const express = require('express');
const { db } = require('../db/sqlite');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

function mapRecipe(row) {
  return {
    receptNev: row.name,
    receptSzoveg: row.text,
    receptKepURL: row.image_url,
    receptID: String(row.id),
    receptIdo: row.prep_time || '',
  };
}

function parseIngredients(rawValue) {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => String(item).trim()).filter(Boolean);
  }

  const raw = String(rawValue).trim();
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch (_e) {
    // Nem JSON, megyunk tovabb a vesszo szerinti bontassal.
  }

  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

router.get('/recipes', (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, name, text, COALESCE(image_url, '') AS image_url, COALESCE(prep_time, '') AS prep_time FROM recipes ORDER BY created_at DESC, id DESC"
    )
    .all();

  return res.json({ responseRecipes: rows.map(mapRecipe) });
});

router.get('/dailyRecipes', (_req, res) => {
  const rows = db
    .prepare(
      "SELECT id, name, text, COALESCE(image_url, '') AS image_url, COALESCE(prep_time, '') AS prep_time FROM recipes ORDER BY RANDOM() LIMIT 5"
    )
    .all();

  return res.json({ responseRecipes: rows.map(mapRecipe) });
});

router.post('/report', requireAuth, (req, res) => {
  const { receptID } = req.body || {};

  if (!receptID) {
    return res.status(400).json({ is_reported: 'no', error: 'missing_receptID' });
  }

  const recipe = db.prepare('SELECT id FROM recipes WHERE id = ?').get(receptID);
  if (!recipe) {
    return res.status(404).json({ is_reported: 'no', error: 'recipe_not_found' });
  }

  try {
    db.prepare('INSERT INTO reports (user_id, recipe_id) VALUES (?, ?)').run(
      req.user.userid,
      receptID
    );
    return res.json({ is_reported: 'ok' });
  } catch (error) {
    if (error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ is_reported: 'no', error: 'duplicate_report' });
    }
    return res.status(500).json({ is_reported: 'no', error: 'report_failed' });
  }
});

router.post('/addRecept', requireAuth, upload.single('kep'), (req, res) => {
  const { receptNev, receptSzoveg, receptIdo } = req.body || {};
  const hozzavalok = parseIngredients(req.body ? req.body.hozzavalok : null);

  if (!receptNev || !receptSzoveg || !receptIdo) {
    return res
      .status(400)
      .json({ is_recorded: 'no', errorMessage: 'missing_required_fields' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  const insertRecipe = db.prepare(
    'INSERT INTO recipes (name, text, image_url, prep_time, user_id) VALUES (?, ?, ?, ?, ?)'
  );

  const insertIngredient = db.prepare(
    'INSERT INTO recipe_ingredients (recipe_id, ingredient) VALUES (?, ?)'
  );

  const transaction = db.transaction(() => {
    const info = insertRecipe.run(
      String(receptNev).trim(),
      String(receptSzoveg).trim(),
      imageUrl,
      String(receptIdo).trim(),
      req.user.userid
    );

    const recipeId = info.lastInsertRowid;

    for (const ingredient of hozzavalok) {
      insertIngredient.run(recipeId, ingredient);
    }
  });

  try {
    transaction();
    return res.json({ is_recorded: 'yes' });
  } catch (_error) {
    return res.status(500).json({ is_recorded: 'no', errorMessage: 'record_failed' });
  }
});

router.post('/autocomplete', (req, res) => {
  const keyword = String((req.body && req.body.keyword) || '').trim();

  if (!keyword) {
    return res.json({ responseRecipes: [] });
  }

  const rows = db
    .prepare('SELECT name FROM recipes WHERE name LIKE ? ORDER BY name ASC LIMIT 15')
    .all(`%${keyword}%`);

  const responseRecipes = rows.map((row) => ({ receptNev: row.name }));
  return res.json({ responseRecipes });
});

module.exports = router;
