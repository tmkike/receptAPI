const { db } = require('./sqlite');
const { runMigrations } = require('./migrate');

runMigrations(db);

const countRow = db.prepare('SELECT COUNT(*) AS count FROM recipes').get();
if (countRow.count > 0) {
  console.log('Seed kihagyva: mar vannak receptek.');
  process.exit(0);
}

const recipes = [
  {
    name: 'Sajtos teszta',
    text: 'Foztuk ki a tesztat, keverjuk ossze sajttal es borssal.',
    prep_time: '20 perc',
    ingredients: ['teszta', 'sajt', 'so', 'bors'],
  },
  {
    name: 'Paradicsomos leves',
    text: 'Paradicsom alap, fuszerek, lassu fozes egy orán at.',
    prep_time: '35 perc',
    ingredients: ['paradicsom', 'hagyma', 'bazsalikom', 'fokhagyma'],
  },
  {
    name: 'Rantotta',
    text: 'Tojast felverjuk, serpenyoben vajban sutjuk.',
    prep_time: '10 perc',
    ingredients: ['tojas', 'vaj', 'so', 'bors'],
  },
  {
    name: 'Csirkeporkolt',
    text: 'Hagyman piritott csirke paprikaval, tejfollel taglava.',
    prep_time: '60 perc',
    ingredients: ['csirke', 'hagyma', 'paprika', 'tejfol'],
  },
  {
    name: 'Gombas rizotto',
    text: 'Rizottorizs alapleven, gombaval kremesre keverve.',
    prep_time: '40 perc',
    ingredients: ['rizs', 'gomba', 'parmezan', 'hagyma', 'vaj'],
  },
  {
    name: 'Palacsinta',
    text: 'Tesztat kikeverjuk, vekonyan kisutjuk, lekvárral toltjuk.',
    prep_time: '25 perc',
    ingredients: ['liszt', 'tojas', 'tej', 'lekvar'],
  },
  {
    name: 'Lencseleves',
    text: 'Lencset megfozzuk, zoldsegekkel es fustolt hússal izesitjuk.',
    prep_time: '50 perc',
    ingredients: ['lencse', 'sargarepa', 'zeller', 'fustolt hus'],
  },
  {
    name: 'Tojasos nokedli',
    text: 'Nokedlit megfozzuk, felvert tojassal atforrositjuk.',
    prep_time: '30 perc',
    ingredients: ['liszt', 'tojas', 'so', 'vaj'],
  },
  {
    name: 'Rakott krumpli',
    text: 'Retegesen rakjuk a krumplit, tojast, kolbaszt es tejfolt.',
    prep_time: '70 perc',
    ingredients: ['krumpli', 'tojas', 'kolbasz', 'tejfol'],
  },
  {
    name: 'Gulyasleves',
    text: 'Marhahus hagyman pirítva, paprikaval es krumplival megfozve.',
    prep_time: '90 perc',
    ingredients: ['marhahus', 'hagyma', 'paprika', 'krumpli', 'paradicsom'],
  },
  {
    name: 'Lecsó',
    text: 'Paprikat es paradicsomot hagyman pirítunk, tojassal gazdagitjuk.',
    prep_time: '35 perc',
    ingredients: ['paprika', 'paradicsom', 'hagyma', 'tojas'],
  },
  {
    name: 'Bundas kenyer',
    text: 'Kenyerszeleteket tojasba mártunk, vajban kisutjuk.',
    prep_time: '15 perc',
    ingredients: ['kenyer', 'tojas', 'tej', 'vaj', 'porcukor'],
  },
  {
    name: 'Toltott paprika',
    text: 'Daralt hússal toltott paprika paradicsomszoszban megfozve.',
    prep_time: '75 perc',
    ingredients: ['paprika', 'daralt hus', 'rizs', 'paradicsom', 'hagyma'],
  },
  {
    name: 'Zoldborsofelem',
    text: 'Zoldborsot vajban pároljuk, tejszínnel kremesre kesszük.',
    prep_time: '20 perc',
    ingredients: ['zoldborsó', 'vaj', 'tejszin', 'so'],
  },
  {
    name: 'Magyaros csirkemell',
    text: 'Csirkemell paprikas szoszban, tejfollel es petrezselyemmel.',
    prep_time: '45 perc',
    ingredients: ['csirkemell', 'paprika', 'tejfol', 'hagyma', 'petrezselyem'],
  },
  {
    name: 'Soska fozelek',
    text: 'Friss soskat megfozzuk, tejfollel es tojassal taglajuk.',
    prep_time: '30 perc',
    ingredients: ['soska', 'tejfol', 'tojas', 'vaj', 'fokhagyma'],
  },
  {
    name: 'Halaszle',
    text: 'Pontyhusbol es fejből fott gazdag paprikas halleves.',
    prep_time: '80 perc',
    ingredients: ['ponty', 'hagyma', 'paprika', 'paradicsom', 'paprikapaszta'],
  },
  {
    name: 'Káposztas teszta',
    text: 'Tesztat kaporral es pirított kaposztaval összeforgatjuk.',
    prep_time: '30 perc',
    ingredients: ['teszta', 'káposzta', 'hagyma', 'cukor', 'bors'],
  },
  {
    name: 'Fokhagymas gomba',
    text: 'Gombát vajban piritjuk, fokhagymával es petrezselyemmel.',
    prep_time: '15 perc',
    ingredients: ['gomba', 'fokhagyma', 'vaj', 'petrezselyem', 'so'],
  },
  {
    name: 'Sult csirkecomb',
    text: 'Fuszeres pacolasban fertoztetett csirkecomb sütőben sütve.',
    prep_time: '80 perc',
    ingredients: ['csirkecomb', 'fokhagyma', 'paprika', 'olivaolaj', 'kakukkfu'],
  },
];

const insertRecipe = db.prepare(
  'INSERT INTO recipes (name, text, image_url, prep_time, user_id) VALUES (?, ?, ?, ?, NULL)'
);
const insertIngredient = db.prepare(
  'INSERT INTO recipe_ingredients (recipe_id, ingredient) VALUES (?, ?)'
);

const tx = db.transaction(() => {
  for (const recipe of recipes) {
    const info = insertRecipe.run(recipe.name, recipe.text, '', recipe.prep_time);
    for (const ingredient of recipe.ingredients) {
      insertIngredient.run(info.lastInsertRowid, ingredient);
    }
  }
});

tx();
console.log('Seed kesz.');
