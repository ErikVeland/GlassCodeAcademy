const sequelize = require('../src/config/database');
const Academy = require('../src/models/academyModel');

async function run() {
  try {
    await sequelize.authenticate();
    const all = await Academy.findAll();
    console.log('Academies:', all.map(a => ({ id: a.id, slug: a.slug, name: a.name })));
    const one = await Academy.findOne({ where: { slug: 'glasscode-academy' } });
    console.log('Find by slug:', one ? { id: one.id, slug: one.slug } : null);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();