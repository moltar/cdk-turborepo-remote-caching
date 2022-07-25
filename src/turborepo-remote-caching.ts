import { aws_s3, Duration, RemovalPolicy, aws_cloudfront, aws_cloudfront_origins, CfnOutput, Stack } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { JWT_SECRET_NAME, JWT_SECRET_REGION, SSM_PARAMETER_NAMESPACE } from './constants';

export class TurborepoRemoteCaching extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const secret = new Secret(this, 'JWT', {
      generateSecretString: {
        passwordLength: 32,
      },
    });

    const authorizer = new NodejsFunction(this, 'Authorizer', {
      description: 'Turborepo Remote Cache authorizer.',
      entry: require.resolve('./edge'),
      logRetention: RetentionDays.ONE_MONTH,
    });

    secret.grantRead(authorizer);

    new StringParameter(this, 'ParameterSecretName', {
      parameterName: `${SSM_PARAMETER_NAMESPACE}${authorizer.logGroup.logGroupName}/${JWT_SECRET_NAME}`,
      stringValue: secret.secretName,
      simpleName: false,
    });

    new StringParameter(this, 'ParameterSecretRegion', {
      parameterName: `${SSM_PARAMETER_NAMESPACE}${authorizer.logGroup.logGroupName}/${JWT_SECRET_REGION}`,
      stringValue: Stack.of(secret).region,
      simpleName: false,
    });

    const storage = new aws_s3.Bucket(this, 'CacheArtifacts', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      // blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(1),
          expiration: Duration.days(7),
        },
      ],
    });

    const originAccessIdentity = new aws_cloudfront.OriginAccessIdentity(this, 'OAI');

    storage.grantReadWrite(originAccessIdentity, 'v8/artifacts/*');

    const distribution = new aws_cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new aws_cloudfront_origins.S3Origin(storage, {
          originAccessIdentity,
        }),
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
        edgeLambdas: [
          {
            eventType: aws_cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            functionVersion: authorizer.currentVersion,
          },
        ],
      },
    });

    new CfnOutput(this, 'CacheAPIURL', {
      value: `https://${distribution.domainName}`,
      description: 'Cache API URL. Use it with the --api=https://*.cloudfront.net option.',
    });
  }
}