import { test } from 'vitest';
import assert from 'node:assert/strict';
import { navigateToRepos } from '../src/utils/navigation.js';

const createMockRouter = () => {
  const calls = [];
  return {
    calls,
    push: location => {
      calls.push(location);
      return Promise.resolve(location);
    },
  };
};

test('navigateToRepos pushes the /repos route', async () => {
  const router = createMockRouter();
  await navigateToRepos(router);

  assert.deepEqual(router.calls, ['/repos']);
});

test('navigateToRepos throws when router is invalid', () => {
  assert.throws(() => navigateToRepos(null), {
    name: 'TypeError',
  });
});
