const { PORT } = require('./config');
const { db } = require('./db/sqlite');
const { runMigrations } = require('./db/migrate');
const { createApp } = require('./app');

runMigrations(db);

const app = createApp();

app.listen(PORT, () => {
  console.log(`Backend fut: http://localhost:${PORT}`);
});
