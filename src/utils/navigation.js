/**
 * Navigate to the repos overview route using the provided router instance.
 *
 * @param {{ push: (location: string | Record<string, any>) => any }} router
 * @returns {any}
 */
export const navigateToRepos = router => {
  if (!router || typeof router.push !== 'function')
    throw new TypeError('A Vue Router instance with a push method is required.');

  return router.push('/repos');
};
