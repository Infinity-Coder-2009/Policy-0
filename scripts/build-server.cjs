const esbuild = require('esbuild');
const fs = require('fs');

const banner = fs.readFileSync('./esbuild-banner.js', 'utf-8');

esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  packages: 'external',
  sourcemap: true,
  outfile: 'dist/server.cjs',
  banner: { js: banner },
}).then(() => {
  console.log('Build complete: dist/server.cjs');
  process.exit(0);
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});