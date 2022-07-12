import { awscdk } from 'projen';

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Roman Filippov',
  authorAddress: 'rf@romanfilippov.com',
  cdkVersion: '2.31.1',
  defaultReleaseBranch: 'main',
  name: 'cdk-turborepo-remote-caching',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/moltar/cdk-turborepo-remote-caching.git',
  devDeps: ['aws-cdk'],
  depsUpgrade: false,
});

project.addTask('deploy', {
  exec: 'npx cdk deploy -a "npx ts-node -P tsconfig.dev.json --prefer-ts-exts src/turborepo-remote-caching.integ.ts"',
});

project.addTask('destroy', {
  exec: 'npx cdk destroy -a "npx ts-node -P tsconfig.dev.json --prefer-ts-exts src/turborepo-remote-caching.integ.ts"',
});

project.gitignore.addPatterns('cdk.out/');

project.synth();