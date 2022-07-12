import { Stack, App } from 'aws-cdk-lib';
import { TurborepoRemoteCaching } from './turborepo-remote-caching';

const app = new App({
  analyticsReporting: false,
});

const stack = new Stack(
  app,
  TurborepoRemoteCaching.name, {
    env: {
      account: '708548510583',
      region: 'eu-west-1',
    },
  },
);

new TurborepoRemoteCaching(stack, TurborepoRemoteCaching.name);