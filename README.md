# 📦 `cdk-turborepo-remote-caching`

> CDK Construct for Turborepo remote cache server.

!! ⚠️ There is no authentication (yet) and the server is wide open ⚠️ !!

This solution provides API Gateway (v1) that implements the Turborepo remote caching API interface
and S3 bucket for storing the cache artifacts.

## Usage

```ts
import { TurborepoRemoteCaching } from 'cdk-turborepo-remote-caching'

new TurborepoRemoteCaching(stack, 'TRC')
```

Get the API endpoint from the output:

```plain
https://abcdefg.execute-api.region-1.amazonaws.com/cache
```

Use it with `turbo run`:

Value for `--token` can be anything since there is no auth.

Team must be specified, and can be anything that begins with `team_`. This will namespace the cache
in the S3 bucket.

```sh
turbo run build --api="https://abcdefg.execute-api.region-1.amazonaws.com/cache" --token=x --team=team_whatever
```
