Package.describe({
  name: 'ginsama:j-comments',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'An easy package for comments functionality',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Npm.depends({
  linkifyjs: '2.1.3'
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.3.2.2');
  api.use([
    'ecmascript',
    'accounts-base',
    'underscore',
    'mongo-livedata',
    'templating',
    'jquery',
    'check',
    'less@2.7.5_1',
    'tracker',
    'random',
    'reactive-dict',
    'session'
  ]);
  // Atmosphere Package Dependencies
  api.use([
    'aldeed:collection2@2.10.0', 'aldeed:simple-schema@1.5.3', 'dburles:collection-helpers@1.0.4',
    'momentjs:moment@2.15.1', 'reywood:publish-composite@1.4.2',
    'aldeed:template-extension@4.0.0', 'barbatus:stars-rating@1.1.1'
  ]);
  api.mainModule('j-comments.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use(['tinytest', 'accounts-password', 'audit-argument-checks', 'check']);
  api.use('ginsama:j-comments');
  api.mainModule('j-comments-tests.js');
});
