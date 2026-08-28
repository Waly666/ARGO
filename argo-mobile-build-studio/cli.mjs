import { applyProfile, applyAllProfiles } from './lib/apply-profile.mjs';
import { runBuild, runBuildAll } from './lib/run-build.mjs';
import { MOBILE_APPS } from './lib/apps.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const all = rest.includes('--all');
const appId = rest.find((a) => !a.startsWith('--'));

async function main() {
  if (cmd === 'apply') {
    if (all) {
      console.log(JSON.stringify(applyAllProfiles(), null, 2));
      return;
    }
    if (!appId || !MOBILE_APPS[appId]) {
      console.error('Uso: node cli.mjs apply <aula|cajero|jornadas> | apply --all');
      process.exit(1);
    }
    console.log(JSON.stringify(applyProfile(appId), null, 2));
    return;
  }

  if (cmd === 'build') {
    const profile = rest.includes('--preview') ? 'preview' : 'production';
    if (all) {
      const results = await runBuildAll({ buildProfile: profile, continueOnError: true, onLog: (t) => process.stdout.write(t) });
      console.log('\n', JSON.stringify(results, null, 2));
      return;
    }
    if (!appId || !MOBILE_APPS[appId]) {
      console.error('Uso: node cli.mjs build <aula|cajero|jornadas> [--preview] | build --all');
      process.exit(1);
    }
    await runBuild(appId, { buildProfile: profile, onLog: (t) => process.stdout.write(t) });
    return;
  }

  console.log(`Comandos:
  node cli.mjs apply <aula|cajero|jornadas>
  node cli.mjs apply --all
  node cli.mjs build <aula|cajero|jornadas> [--preview]
  node cli.mjs build --all [--preview]`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
