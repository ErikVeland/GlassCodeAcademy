const sequelize = require('../src/config/database');
const Academy = require('../src/models/academyModel');

async function ensureDefaultAcademy() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    // Create table if missing in local dev
    await Academy.sync();

    const slug = 'glasscode-academy';
    const [academy, created] = await Academy.findOrCreate({
      where: { slug },
      defaults: {
        name: 'GlassCode Academy',
        description: 'Default academy for local development',
        isPublished: true,
        version: '1.0.0',
      },
    });

    console.log(
      created
        ? `Created default academy: ${academy.slug}`
        : `Default academy already exists: ${academy.slug}`
    );
    process.exit(0);
  } catch (err) {
    console.error('Failed to ensure default academy:', err);
    process.exit(1);
  }
}

ensureDefaultAcademy();