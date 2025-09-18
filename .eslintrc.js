module.exports = {
  root: true,
  extends: [
    '@medsas/eslint-config/base'
  ],
  settings: {
    next: {
      rootDir: ['apps/*/']
    }
  }
};