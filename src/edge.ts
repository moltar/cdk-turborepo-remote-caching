import assert from 'assert';
import qs from 'querystring';
import type { CloudFrontRequestHandler } from 'aws-lambda';
import { SSM } from 'aws-sdk';
import { JWT_SECRET_NAME, JWT_SECRET_REGION } from './constants';
import { getSecret } from './utils/get-secret';
import { verify } from './utils/jwt';

const ARTIFACTS_PREFIX = '/v8/artifacts/';

export const handler: CloudFrontRequestHandler = async (event, context) => {
  console.log('event', JSON.stringify(event));
  console.log('context', JSON.stringify(context));
  console.log('context.functionName', context.functionName);

  const { cf } = event.Records[0];
  console.log(JSON.stringify(cf));

  const authorization = cf.request.headers.authorization;
  assert(authorization && authorization[0].value, 'authorization header is missing');
  assert(authorization[0].value.startsWith('Bearer'), 'authorization header is not bearer');

  const secret = await getSecret(
    cf.request.headers[JWT_SECRET_NAME][0].value,
    cf.request.headers[JWT_SECRET_REGION][0].value,
  );

  console.log('secret', secret); // TODO: rm

  await verify(secret, authorization[0].value);

  const parsedQueryString = qs.parse(cf.request.querystring);
  const teamId = parsedQueryString.slug;
  assert(teamId, 'teamId is undefined');

  // rewrite the request to namespace the artifacts with teamId
  // /v8/artifacts/c4ba7458a17ead8d -> /v8/artifacts/TEAM_ID/c4ba7458a17ead8d
  if (cf.request.uri.startsWith(ARTIFACTS_PREFIX)) {
    cf.request.uri = cf.request.uri.replace(ARTIFACTS_PREFIX, `${ARTIFACTS_PREFIX}${teamId}`);
  }

  return cf.request;
};