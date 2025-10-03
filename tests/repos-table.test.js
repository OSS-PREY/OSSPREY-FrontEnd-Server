import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadDescriptor = async relativePath => {
  const filepath = resolve(__dirname, '..', relativePath);
  const source = await readFile(filepath, 'utf8');
  const { descriptor } = parse(source, { filename: filepath });
  return { descriptor, filepath };
};

const loadComponent = async relativePath => {
  const { descriptor, filepath } = await loadDescriptor(relativePath);
  const script = compileScript(descriptor, { id: 'repo-table-test' });
  const template = compileTemplate({ source: descriptor.template?.content ?? '', id: 'repo-table-test', filename: filepath });
  const transformedScript = script.content.replace('export default', 'const __sfc__ =');
  const moduleCode = `\n${transformedScript}\n${template.code}\n__sfc__.render = render;\nexport default __sfc__;\n`;
  const tempDir = await mkdtemp(join(__dirname, '.repos-table-'));
  const modulePath = join(tempDir, 'component.mjs');
  await writeFile(modulePath, moduleCode, 'utf8');
  const module = await import(pathToFileURL(modulePath).href);
  await rm(tempDir, { recursive: true, force: true });
  return { component: module.default, descriptor };
};

test('ReposTable sorts rows by most recent start time', async () => {
  const { component } = await loadComponent('src/views/repos/ReposTable.vue');
  const rows = [
    { repoName: 'older/repo', startTime: '2025-09-01 08:00', completionTime: '2025-09-01 09:00', status: 'processed' },
    { repoName: 'newer/repo', startTime: '2025-10-01 08:00', completionTime: null, status: 'pending' },
  ];

  const setupResult = await component.setup({ title: 'Pending', rows }, { expose() {} });
  const sorted = setupResult.sortedRows.value.map(item => item.repoName);

  assert.deepEqual(sorted, ['newer/repo', 'older/repo']);
});

test('ReposTable template includes headers, empty state, and pending dash copy', async () => {
  const { descriptor } = await loadComponent('src/views/repos/ReposTable.vue');
  const template = descriptor.template?.content ?? '';
  const script = descriptor.scriptSetup?.content ?? '';

  assert.ok(template.includes('Repo Name'), 'Repo Name header should be present');
  assert.ok(template.includes('Task Initiation Time'), 'Task Initiation Time header should be present');
  assert.ok(template.includes('{{ timeColumnLabel }}'), 'Dynamic time column label should be present');
  assert.ok(template.includes('No items to show.'), 'Empty state copy should be present');
  assert.ok(template.includes('resolveTimeValue(row)'), 'Resolver helper should be wired into the template');
  assert.ok(script.includes("return '—'"), 'Pending completion should render as an em dash');
});
