Package.describe({
  name: "dburles:factory",
  summary: "Factories for Meteor",
  version: "1.5.0",
  git: "https://github.com/versolearning/meteor-factory.git",
});

Package.onUse(function (api) {
  api.versionsFrom(['2.3', '3.0']);
  api.use(["ecmascript", "minimongo@1.0.9 || 2.0.0", "underscore", "ejson", "random"]);
  api.addFiles("factory.js");
  api.export("Factory");
});

Package.onTest(function (api) {
  api.use(["ecmascript", "tinytest", "dburles:factory", "underscore"]);
  api.addFiles("factory_tests.js", "server");
});
