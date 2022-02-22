import { Stack, App } from 'aws-cdk-lib';
import { TurborepoRemoteCaching } from './turborepo-remote-caching';

const app = new App({ analyticsReporting: false });
new Stack(app, TurborepoRemoteCaching.name);
