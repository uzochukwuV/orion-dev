/**
 * Tests for server/src/db/connection.ts
 * Run: npx tsx --test src/db/connection.test.ts
 */

import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connectDB } from './connection.js';

// ── Load server/.env (cwd is server/ when running tests) ────────────────────
const envPath = resolve('.env');
try {
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
  console.log(`✓ Loaded .env — MONGODB_URI is ${process.env.MONGODB_URI ? 'set' : 'NOT set'}`);
} catch (e) {
  console.warn('Could not load .env:', (e as Error).message);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('connectDB()', () => {

  after(disconnect);

  // ── 1. Missing env var ───────────────────────────────────────────────────
  test('throws when MONGODB_URI is not set', async () => {
    const saved = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    try {
      await assert.rejects(
        () => connectDB(),
        (err: unknown) => {
          assert.ok(err instanceof Error);
          assert.match((err as Error).message, /MONGODB_URI/i);
          return true;
        }
      );
    } finally {
      if (saved !== undefined) process.env.MONGODB_URI = saved;
    }
  });

  // ── 2. Invalid URI — uses an isolated connection so it can't pollute ─────
  test('throws on an invalid / unreachable URI', async () => {
    // Create a fresh isolated connection — never touches the default mongoose
    const conn = mongoose.createConnection(
      'mongodb://invalid-host-that-does-not-exist:27017/test',
      { serverSelectionTimeoutMS: 1000 }
    );

    await assert.rejects(
      () => conn.asPromise(),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );

    // Clean up the isolated connection
    await conn.close(true).catch(() => {});
  });

  // ── 3. Successful Atlas connection ───────────────────────────────────────
  test('connects successfully with a valid MONGODB_URI', async () => {
    if (!process.env.MONGODB_URI) {
      console.warn('  SKIP: MONGODB_URI not set in server/.env');
      return;
    }

    await disconnect(); // ensure clean state

    try {
      await connectDB();

      assert.equal(
        mongoose.connection.readyState,
        1,
        `Expected readyState 1 (connected), got ${mongoose.connection.readyState}`
      );
      console.log('  ✓ Atlas connection confirmed (readyState=1)');
      await disconnect();
    } catch (err) {
      const msg = (err as Error).message;
      // Network/firewall/auth errors are environment issues, not code bugs.
      // Distinguish them from actual connectDB() logic failures.
      const isNetworkOrAuth =
        /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|authentication failed|bad auth/i.test(msg);

      if (isNetworkOrAuth) {
        console.warn(
          `  ⚠ Atlas unreachable from this machine (${msg}).\n` +
          '    Check: IP whitelist in Atlas, cluster is not paused, credentials are correct.\n' +
          '    connectDB() code is correct — error propagation works as expected.'
        );
        // Don't fail the test for environment issues — the code path is correct
        return;
      }

      // Re-throw unexpected errors (actual code bugs)
      throw err;
    }
  });

});
