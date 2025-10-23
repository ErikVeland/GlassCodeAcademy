// Test script to verify required environment variables are set
console.log('Testing required environment variables...');

const requiredEnvVars = [
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_API_BASE'
];

let allPresent = true;

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: ${process.env[envVar]}`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
    allPresent = false;
  }
}

if (allPresent) {
  console.log('✅ All required environment variables are set');
  process.exit(0);
} else {
  console.log('❌ Some required environment variables are missing');
  process.exit(1);
}