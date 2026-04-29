const express = require('express');
const { db } = require('../db/sqlite');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/favorites', requireAuth, (req, res) => {
  const { type, receptID } = req.body || {};

  if (!type) {
    return res.status(400).json({ favoriteStatus: 'error', error: 'missing_type' });
  }

  if (type !== 'isFavorite' && !receptID) {
    return res.status(400).json({ favoriteStatus: 'error', error: 'missing_receptID' });
  }

  try {
    if (type === 'toFavorite') {
      db.prepare('INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(
        req.user.userid,
        receptID
      );
      return res.json({ favoriteStatus: 'added' });
    }

    if (type === 'removeFromfavorite') {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?').run(
        req.user.userid,
        receptID
      );
      return res.json({ favoriteStatus: 'removed' });
    }

    if (type === 'isFavorite') {
      const rows = db
        .prepare(
          `SELECT
            recipes.id,
            recipes.name,
            recipes.text,
            COALESCE(recipes.image_url, '') AS image_url,
            COALESCE(recipes.prep_time, '') AS prep_time
          FROM favorites
          JOIN recipes ON recipes.id = favorites.recipe_id
          WHERE favorites.user_id = ?
          ORDER BY recipes.name ASC`
        )
        .all(req.user.userid);

      const responseRecipes = rows.map((row) => ({
        receptID: String(row.id),
        receptNev: row.name,
        receptSzoveg: row.text,
        receptKepURL: row.image_url,
        receptIdo: row.prep_time,
      }));
      return res.json({ responseRecipes });
    }

    return res.status(400).json({ favoriteStatus: 'error', error: 'invalid_type' });
  } catch (_error) {
    return res.status(500).json({ favoriteStatus: 'error', error: 'favorite_operation_failed' });
  }
});

module.exports = router;
