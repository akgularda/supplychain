import fs from 'node:fs';
import assert from 'node:assert/strict';

const DATA = JSON.parse(fs.readFileSync('data/top100-map.json', 'utf8'));

console.log('=== Data Verification Report ===\n');

let passCount = 0;
let failCount = 0;

function pass(message) {
  console.log(`✅ ${message}`);
  passCount++;
}

function fail(message) {
  console.log(`❌ ${message}`);
  failCount++;
}

// 1. Count verification
console.log('1. Count Verification');
console.log(`   Global nodes: ${DATA.nodes.length}`);
console.log(`   Global links: ${DATA.links.length}`);
console.log(`   Profiles: ${Object.keys(DATA.profiles).length}`);
if (DATA.nodes.length === 100 && Object.keys(DATA.profiles).length === 100) {
  pass('Exactly 100 nodes and 100 profiles\n');
} else {
  fail('Count mismatch\n');
}

// 2. HQ data verification (check global nodes)
console.log('2. HQ Data Verification');
const hqIssues = [];
DATA.nodes.forEach(n => {
  if (!n.hq?.city) hqIssues.push(`${n.symbol}: missing city`);
  if (!n.hq?.country) hqIssues.push(`${n.symbol}: missing country`);
  if (!n.hq?.country_code) hqIssues.push(`${n.symbol}: missing country_code`);
  if (!n.hq?.flag_emoji) hqIssues.push(`${n.symbol}: missing flag_emoji`);
  if (!n.hq?.logo_url) hqIssues.push(`${n.symbol}: missing logo_url`);
});
if (hqIssues.length > 0) {
  console.log('   Issues found:');
  hqIssues.slice(0, 10).forEach(i => console.log(`      ${i}`));
  if (hqIssues.length > 10) console.log(`      ... and ${hqIssues.length - 10} more`);
  fail('HQ data incomplete\n');
} else {
  pass('All 100 global nodes have complete HQ data\n');
}

// 2b. Profile nodes country verification
console.log('2b. Profile Nodes Country Verification');
let profileNodeCount = 0;
let profileNodeIssues = 0;
Object.values(DATA.profiles).forEach(profile => {
  if (profile.nodes) {
    profile.nodes.forEach(n => {
      profileNodeCount++;
      if (!n.c) profileNodeIssues++;
    });
  }
});
if (profileNodeIssues > 0) {
  fail(`${profileNodeIssues} profile nodes missing country code\n`);
} else {
  pass(`All ${profileNodeCount} profile nodes have country codes\n`);
}

// 3. Profile structure verification (check nodes array)
console.log('3. Profile Structure Verification');
const profileIssues = [];
Object.entries(DATA.profiles).forEach(([symbol, profile]) => {
  if (!Array.isArray(profile.nodes)) profileIssues.push(`${symbol}: missing nodes array`);
  if (!Array.isArray(profile.links)) profileIssues.push(`${symbol}: missing links array`);
  if (!profile.sourceByTier) profileIssues.push(`${symbol}: missing sourceByTier`);
  if (!profile.category) profileIssues.push(`${symbol}: missing category`);
  
  // Check for named entities in nodes
  if (profile.nodes && profile.nodes.length > 0) {
    const suppliers = profile.nodes.filter(n => n.kind === 'supplier');
    if (suppliers.length < 3) profileIssues.push(`${symbol}: only ${suppliers.length} suppliers`);
  }
});
if (profileIssues.length > 0) {
  console.log('   Issues found:');
  profileIssues.slice(0, 10).forEach(i => console.log(`      ${i}`));
  if (profileIssues.length > 10) console.log(`      ... and ${profileIssues.length - 10} more`);
  fail('Profile structure issues\n');
} else {
  pass('All profiles have correct structure\n');
}

// 4. Country code verification (check global nodes)
console.log('4. Country Code Verification');
const countryCodes = new Set(DATA.nodes.map(n => n.hq?.country_code).filter(Boolean));
const xxCount = DATA.nodes.filter(n => n.hq?.country_code === 'XX').length;
console.log(`   Unique countries: ${countryCodes.size}`);
console.log(`   XX placeholders: ${xxCount}`);
if (xxCount > 0) {
  fail('Some nodes have XX country code\n');
} else {
  pass('No XX placeholders\n');
}

// 5. Source verification
console.log('5. Source Verification');
let sourceBackedCount = 0;
Object.values(DATA.profiles).forEach(p => {
  if (p.sources && p.sources.length > 0) sourceBackedCount++;
});
console.log(`   Source-backed profiles: ${sourceBackedCount}/100`);
if (sourceBackedCount === 100) {
  pass('All profiles are source-backed\n');
} else {
  fail(`${100 - sourceBackedCount} profiles lack sources\n`);
}

// 6. Rank verification
console.log('6. Rank Verification');
const ranks = DATA.nodes.map(n => n.rank).sort((a, b) => a - b);
const expectedRanks = Array.from({length: 100}, (_, i) => i + 1);
const missingRanks = expectedRanks.filter(r => !ranks.includes(r));
const duplicateRanks = ranks.filter((r, i) => ranks.indexOf(r) !== i);
if (missingRanks.length > 0) {
  fail(`Missing ranks: ${missingRanks.join(', ')}\n`);
} else if (duplicateRanks.length > 0) {
  fail(`Duplicate ranks: ${duplicateRanks.join(', ')}\n`);
} else {
  pass('All ranks 1-100 present exactly once\n');
}

// 7. Market cap data verification
console.log('7. Market Cap Data Verification');
const missingCap = DATA.nodes.filter(n => !n.marketcap || n.marketcap <= 0);
if (missingCap.length > 0) {
  fail(`${missingCap.length} nodes missing market cap\n`);
} else {
  const totalCap = DATA.nodes.reduce((sum, n) => sum + n.marketcap, 0);
  console.log(`   Total market cap: $${(totalCap / 1e12).toFixed(2)}T`);
  console.log(`   Average market cap: $${(totalCap / 100 / 1e9).toFixed(1)}B`);
  pass('All nodes have market cap data\n');
}

// 8. Symbol uniqueness
console.log('8. Symbol Uniqueness');
const symbols = DATA.nodes.map(n => n.symbol);
const uniqueSymbols = new Set(symbols);
if (symbols.length !== uniqueSymbols.size) {
  const duplicates = symbols.filter((s, i) => symbols.indexOf(s) !== i);
  fail(`Duplicate symbols: ${[...new Set(duplicates)].join(', ')}\n`);
} else {
  pass('All symbols are unique\n');
}

// 9. Profile completeness (check nodes by kind)
console.log('9. Profile Completeness');
let completeProfiles = 0;
Object.values(DATA.profiles).forEach(p => {
  if (!p.nodes) return;
  const suppliers = p.nodes.filter(n => n.kind === 'supplier').length;
  const services = p.nodes.filter(n => n.kind === 'service').length;
  const channels = p.nodes.filter(n => n.kind === 'channel').length;
  const demand = p.nodes.filter(n => n.kind === 'demand').length;
  const minEntities = 3;
  if (suppliers >= minEntities && services >= minEntities && channels >= minEntities && demand >= minEntities) {
    completeProfiles++;
  }
});
console.log(`   Complete profiles: ${completeProfiles}/100`);
if (completeProfiles === 100) {
  pass('All profiles have sufficient entities\n');
} else {
  fail(`${100 - completeProfiles} profiles have insufficient entities\n`);
}

// 10. Metadata verification
console.log('10. Metadata Verification');
if (DATA.meta?.generatedAt && DATA.meta?.lastUpdated && DATA.meta?.source) {
  console.log(`   Generated: ${DATA.meta.generatedAt}`);
  console.log(`   Last Updated: ${DATA.meta.lastUpdated}`);
  console.log(`   Source: ${DATA.meta.source}`);
  pass('Metadata complete\n');
} else {
  fail('Metadata incomplete\n');
}

// Summary
console.log('=== Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log('');

if (failCount === 0) {
  console.log('✅ All data verification checks passed!');
  console.log('');
  console.log('Run automated tests for complete verification:');
  console.log('  node tests/supply-chain-research-quality.test.mjs');
  console.log('  node tests/no-xx-country-codes.test.mjs');
  console.log('  node tests/profile-link-metadata.test.mjs');
  process.exit(0);
} else {
  console.log('❌ Some data verification checks failed. Please review and fix.');
  process.exit(1);
}
