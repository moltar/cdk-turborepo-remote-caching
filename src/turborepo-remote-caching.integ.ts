import { Stack, App } from 'aws-cdk-lib';
import { TurborepoRemoteCaching } from './turborepo-remote-caching';

const app = new App({
  analyticsReporting: false,
});

const stack = new Stack(
  app,
  TurborepoRemoteCaching.name,
);

new TurborepoRemoteCaching(stack, TurborepoRemoteCaching.name);