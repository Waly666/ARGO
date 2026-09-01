import { spawn } from 'node:child_process';
import path from 'node:path';
import { MOBILE_APPS, appRoot } from './apps.mjs';
import { applyProfile } from './apply-profile.mjs';
import { loadProfile } from './profiles.mjs';

const EAS = 'pnpm dlx eas-cli@18.13.0';

function runCommand(cwd, command, args, onLine) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      env: { ...process.env, EAS_BUILD_NO_EXPO_GO_WARNING: 'true' },
    });
    let out = '';
    const push = (chunk) => {
      const text = String(chunk);
      out += text;
      onLine?.(text);
    };
    child.stdout.on('data', push);
    child.stderr.on('data', push);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ code, output: out });
      else reject(new Error(`Comando falló (${code}):\n${out}`));
    });
  });
}

/**
 * Aplica perfil y lanza EAS build (preview o production).
 * @param {string} appId
 * @param {{ buildProfile?: string, onLog?: (t: string) => void }} opts
 */
export async function runBuild(appId, opts = {}) {
  const app = MOBILE_APPS[appId];
  const clientId = opts.clientId;
  const profile = opts.profile ?? loadProfile(appId, clientId);
  const buildProfile = opts.buildProfile ?? profile.buildProfile ?? 'production';
  const root = appRoot(appId);

  applyProfile(appId, { ...profile, buildProfile }, clientId);

  const args = [
    'dlx',
    'eas-cli@18.13.0',
    'build',
    '--platform',
    'android',
    '--profile',
    buildProfile,
    '--non-interactive',
  ];

  opts.onLog?.(`\n▶ Build ${app.label} (${buildProfile}) en ${app.dir}\n`);
  const result = await runCommand(root, 'pnpm', args, opts.onLog);
  return {
    appId,
    label: app.label,
    buildProfile,
    output: result.output,
  };
}

export async function runBuildAll(opts = {}) {
  const results = [];
  for (const appId of Object.keys(MOBILE_APPS)) {
    try {
      const r = await runBuild(appId, opts);
      results.push({ ok: true, ...r });
    } catch (err) {
      results.push({ ok: false, appId, error: err.message });
      if (!opts.continueOnError) break;
    }
  }
  return results;
}
