const { Client } = require('pg');

const table = process.argv[2] || 'lesson_quizzes';

(async () => {
  const conn =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/glasscode_dev';
  const client = new Client({ connectionString: conn });
  await client.connect();
  const res = await client.query(
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
    [table]
  );
  console.log(res.rows);
  await client.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
