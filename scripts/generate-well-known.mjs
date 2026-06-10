#!/usr/bin/env node
/**
 * Writes Universal Link / App Link association files into public/.well-known/
 *
 * Required env (add to .env or EAS secrets before deploy):
 *   EXPO_PUBLIC_APPLE_TEAM_ID          — Apple Developer Team ID (10 chars)
 *   EXPO_PUBLIC_ANDROID_SHA256_FINGERPRINT — EAS upload cert SHA-256
 *     Run: eas credentials -p android  →  Keystore → SHA256 Fingerprint
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', '.well-known');

/** Node does not load .env files — Expo does, but this script runs standalone. */
function loadEnvFiles(baseDir) {
  for (const file of ['.env', '.env.local', '.env.production']) {
    const path = join(baseDir, file);
    if (!existsSync(path)) continue;

    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

loadEnvFiles(root);

const teamId = process.env.EXPO_PUBLIC_APPLE_TEAM_ID ?? process.env.APPLE_TEAM_ID;
const androidSha =
  process.env.EXPO_PUBLIC_ANDROID_SHA256_FINGERPRINT ??
  process.env.ANDROID_SHA256_FINGERPRINT;

const iosBundleId = 'com.oqagileathletes.app';
const androidPackage = 'com.kroniumtech.agileathletes';

if (!teamId) {
  console.warn(
    '⚠️  EXPO_PUBLIC_APPLE_TEAM_ID not set — apple-app-site-association will use REPLACE_WITH_APPLE_TEAM_ID',
  );
}
if (!androidSha) {
  console.warn(
    '⚠️  EXPO_PUBLIC_ANDROID_SHA256_FINGERPRINT not set — assetlinks.json will use REPLACE_WITH_ANDROID_SHA256',
  );
}

const aasa = {
  applinks: {
    apps: [],
    details: [
      {
        appID: `${teamId ?? 'REPLACE_WITH_APPLE_TEAM_ID'}.${iosBundleId}`,
        paths: ['/connections', '/connections/*'],
      },
    ],
  },
};

const assetlinks = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: androidPackage,
      sha256_cert_fingerprints: [
        androidSha ?? 'REPLACE_WITH_ANDROID_SHA256',
      ],
    },
  },
];

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, 'apple-app-site-association'),
  `${JSON.stringify(aasa, null, 2)}\n`,
);
writeFileSync(
  join(outDir, 'assetlinks.json'),
  `${JSON.stringify(assetlinks, null, 2)}\n`,
);

console.log('Wrote public/.well-known/apple-app-site-association');
console.log('Wrote public/.well-known/assetlinks.json');
