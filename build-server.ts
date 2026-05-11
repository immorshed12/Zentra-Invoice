import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/server.cjs',
    format: 'cjs',
    external: ['vite', 'fsevents'],
    minify: true,
  });
  console.log('Server built successfully to dist/server.cjs');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
