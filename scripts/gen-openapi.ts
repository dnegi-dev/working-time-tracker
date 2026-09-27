/**
 * Generates public/api/openapi.json from the command registry (single source of truth).
 * CI fails when the committed spec differs (npm run openapi:check).
 */
import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { commands } from '../src/application/commands/registry.ts';

type JsonSchema = { properties?: Record<string, { description?: string }>; required?: string[] };

const error = { $ref: '#/components/schemas/Error' };
const paths: Record<string, unknown> = {};

for (const [name, def] of Object.entries(commands)) {
  const schema = z.toJSONSchema(def.params, { io: 'input' }) as JsonSchema;
  const params = Object.entries(schema.properties ?? {}).map(([key, s]) => ({
    name: key,
    in: 'query',
    required: schema.required?.includes(key) ?? false,
    description: s.description,
    schema: { ...s, description: undefined },
  }));
  if ('debounce' in def)
    params.push({
      name: 'source',
      in: 'query',
      required: false,
      description: 'What triggered the call',
      schema: { type: 'string', enum: ['nfc', 'qr', 'geofence', 'shortcut'] } as never,
    });
  paths[`/${name}`] = {
    get: {
      operationId: name,
      summary: def.summary,
      description: `Deep link: \`wtt://${name}?…\` (iOS app) · \`<app>#/do/${name}?…\` (web/PWA)`,
      parameters: params,
      'x-deeplink': { native: `wtt://${name}`, web: `#/do/${name}` },
      responses: {
        200: {
          description: 'Done',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Result' } } },
        },
        400: {
          description: 'Invalid parameters',
          content: { 'application/json': { schema: error } },
        },
        404: {
          description: 'Unknown project/place',
          content: { 'application/json': { schema: error } },
        },
        503: {
          description: 'No app tab open to execute the call',
          content: { 'application/json': { schema: error } },
        },
      },
    },
  };
}

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Working Time – Command API',
    version: '1',
    description:
      'Every command is also a deep link. In the browser, calls are executed by the service worker in an open, logged-in app tab — open the app in another tab, then use "Try it out". Commands change state although they are GET, so they work as plain links (NFC, QR, Shortcuts).',
  },
  servers: [{ url: 'v1' }],
  paths,
  components: {
    schemas: {
      Result: {
        type: 'object',
        properties: {
          ok: { const: true },
          data: {
            type: 'object',
            properties: {
              running: { type: 'boolean' },
              since: { type: 'string', format: 'date-time' },
              project: { type: 'string' },
              place: { type: 'string' },
              mode: { enum: ['office', 'home'] },
              todayMinutes: { type: 'integer' },
              remainingTodayMinutes: { type: 'integer' },
              ignored: { type: 'string', description: 'Set when a duplicate trigger was ignored' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          ok: { const: false },
          status: { type: 'integer' },
          error: { type: 'string' },
        },
      },
    },
  },
};

writeFileSync('public/api/openapi.json', JSON.stringify(spec, null, 2) + '\n');
console.log(`openapi.json: ${Object.keys(paths).length} commands`);
