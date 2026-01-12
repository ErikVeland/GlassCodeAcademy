/*
 * Script: update-quiz.js
 * Purpose: Validate admin quiz edit via Next proxy by GET -> PUT -> GET -> revert.
 */
const id = Number(process.env.QUIZ_ID || '205');
const base = process.env.BASE || 'http://localhost:3000';
const url = `${base}/api/LessonQuiz/${id}`;

async function main() {
  console.log('Target:', url);
  const get1 = await fetch(url);
  console.log('GET status:', get1.status);
  if (!get1.ok) throw new Error(`Initial GET failed: ${get1.status}`);
  const quiz = await get1.json();

  const original = { topic: quiz.topic, explanation: quiz.explanation };
  quiz.topic = 'automation-test';
  quiz.explanation = 'Edited via automated test';

  const put = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(quiz),
  });
  console.log('PUT status:', put.status);
  const putText = await put.text();
  if (!put.ok) throw new Error(`PUT failed: ${put.status} ${putText}`);

  const get2 = await fetch(url);
  console.log('Confirm status:', get2.status);
  if (!get2.ok) throw new Error(`Confirm GET failed: ${get2.status}`);
  const updated = await get2.json();
  console.log('Updated:', { id: updated.id, topic: updated.topic, explanation: updated.explanation });

  // Revert to original to avoid leaving test data behind
  updated.topic = original.topic;
  updated.explanation = original.explanation;
  const revert = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(updated),
  });
  console.log('Revert status:', revert.status);
  const get3 = await fetch(url);
  const final = await get3.json();
  console.log('Final:', { id: final.id, topic: final.topic, explanation: final.explanation });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});