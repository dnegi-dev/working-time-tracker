/**
 * Layer rules (see docs/dev/ARCHITECTURE.md):
 *   domain      ← pure, imports nothing outside domain
 *   ports       ← domain types only
 *   application ← domain, ports (+ zod)
 *   adapters    ← domain, ports (never application or ui)
 *   ui          ← application, domain, i18n, ports (types)  — never adapters
 *   main.ts / wiring ← composition root, may import everything
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { pathNot: '^src/domain' },
    },
    {
      name: 'ports-only-domain',
      severity: 'error',
      from: { path: '^src/ports' },
      to: { pathNot: '^src/(domain|ports)' },
    },
    {
      name: 'application-no-outer-layers',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/(adapters|ui|wiring|i18n)' },
    },
    {
      name: 'adapters-no-app-or-ui',
      severity: 'error',
      from: { path: '^src/adapters' },
      to: { path: '^src/(application|ui|wiring)' },
    },
    {
      name: 'ui-no-adapters',
      severity: 'error',
      from: { path: '^src/ui' },
      to: { path: '^src/(adapters|wiring)' },
    },
    {
      name: 'i18n-standalone',
      severity: 'error',
      from: { path: '^src/i18n' },
      to: { path: '^src/(?!i18n)' },
    },
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.js', '.svelte'] },
  },
};
