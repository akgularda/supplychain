import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'data');

describe('Auto-Update System', () => {
  let data;
  
  before(() => {
    const dataPath = join(DATA_DIR, 'top100-map-updated.json');
    const content = readFileSync(dataPath, 'utf-8');
    data = JSON.parse(content);
  });
  
  it('data file has auto-update metadata', () => {
    assert.ok(data.last_auto_update, 'Missing last_auto_update field');
    assert.ok(data.update_source, 'Missing update_source field');
    assert.ok(data.snapshot_date, 'Missing snapshot_date field');
  });
  
  it('last_auto_update is valid ISO date', () => {
    const date = new Date(data.last_auto_update);
    assert.ok(!isNaN(date.getTime()), 'last_auto_update is not a valid date');
  });
  
  it('update_source is companiesmarketcap.com', () => {
    assert.strictEqual(data.update_source, 'companiesmarketcap.com');
  });
  
  it('has 100 companies', () => {
    assert.strictEqual(data.companies.length, 100, 'Should have exactly 100 companies');
  });
  
  it('all companies have required fields', () => {
    data.companies.forEach((company, index) => {
      assert.ok(company.symbol, `Company ${index} missing symbol`);
      assert.ok(company.name, `Company ${index} missing name`);
      assert.ok(company.rank, `Company ${index} missing rank`);
      assert.ok(company.hq, `Company ${index} missing hq`);
      assert.ok(company.hq.country, `Company ${index} missing hq.country`);
    });
  });
  
  it('companies are sorted by rank', () => {
    for (let i = 1; i < data.companies.length; i++) {
      assert.ok(
        data.companies[i].rank >= data.companies[i - 1].rank,
        `Companies not sorted by rank at index ${i}`
      );
    }
  });
  
  it('ranks are between 1 and 100', () => {
    data.companies.forEach((company, index) => {
      assert.ok(
        company.rank >= 1 && company.rank <= 100,
        `Company ${index} (${company.symbol}) has invalid rank: ${company.rank}`
      );
    });
  });
  
  it('all companies have profile data', () => {
    data.companies.forEach((company, index) => {
      assert.ok(company.profile, `Company ${index} missing profile`);
      assert.ok(Array.isArray(company.profile.upstream), `Company ${index} profile.upstream not an array`);
      assert.ok(Array.isArray(company.profile.services), `Company ${index} profile.services not an array`);
      assert.ok(Array.isArray(company.profile.channels), `Company ${index} profile.channels not an array`);
      assert.ok(Array.isArray(company.profile.demand), `Company ${index} profile.demand not an array`);
    });
  });
});
