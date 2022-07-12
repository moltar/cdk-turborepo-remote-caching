import { aws_s3, Duration, RemovalPolicy, aws_cloudfront, aws_cloudfront_origins, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TurborepoRemoteCaching extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const storage = new aws_s3.Bucket(this, 'CacheArtifacts', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
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
      },
    });

    new CfnOutput(this, 'DistributionURL', {
      description: 'Distribution URL.',
      value: `https://${distribution.domainName}`,
    });
  }
}