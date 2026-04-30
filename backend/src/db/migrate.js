const { db } = require('./sqlite');

function runMigrations(database = db) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      image_url TEXT,
      prep_time TEXT,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      ingredient TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      UNIQUE(user_id, recipe_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recipe_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      UNIQUE(user_id, recipe_id)
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
  `);

  const recipeColumns = database.prepare('PRAGMA table_info(recipes)').all();
  const hasCategoryColumn = recipeColumns.some((column) => column.name === 'category');

  if (!hasCategoryColumn) {
    database.exec("ALTER TABLE recipes ADD COLUMN category TEXT DEFAULT 'Egyéb húsfélék'");
  }

  database.exec(`
    UPDATE recipes
    SET category = CASE name
      WHEN 'Sajtos teszta' THEN 'Tésztafélék'
      WHEN 'Paradicsomos leves' THEN 'Levesek'
      WHEN 'Rantotta' THEN 'Vegetáriánus'
      WHEN 'Csirkeporkolt' THEN 'Csirkeételek'
      WHEN 'Gombas rizotto' THEN 'Vegetáriánus'
      WHEN 'Palacsinta' THEN 'Édes sütemények'
      WHEN 'Lencseleves' THEN 'Levesek'
      WHEN 'Tojasos nokedli' THEN 'Tésztafélék'
      WHEN 'Rakott krumpli' THEN 'Köretek'
      WHEN 'Gulyasleves' THEN 'Marhaételek'
      WHEN 'Lecsó' THEN 'Vegetáriánus'
      WHEN 'Bundas kenyer' THEN 'Sós sütemények'
      WHEN 'Toltott paprika' THEN 'Sertésételek'
      WHEN 'Zoldborsofelem' THEN 'Főzelék'
      WHEN 'Magyaros csirkemell' THEN 'Csirkeételek'
      WHEN 'Soska fozelek' THEN 'Főzelék'
      WHEN 'Halaszle' THEN 'Halételek'
      WHEN 'Káposztas teszta' THEN 'Tésztafélék'
      WHEN 'Fokhagymas gomba' THEN 'Vegetáriánus'
      WHEN 'Sult csirkecomb' THEN 'Csirkeételek'
      ELSE 'Egyéb húsfélék'
    END
    WHERE category IS NULL OR TRIM(category) = '' OR category = 'Egyeb';

    CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
  `);
}

if (require.main === module) {
  runMigrations();
  console.log('SQLite migracio kesz.');
}

module.exports = { runMigrations };
