import { aws_s3, aws_apigateway, Duration, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TurborepoRemoteCaching extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const storage = new aws_s3.Bucket(this, 'Storage', {
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(1),
          expiration: Duration.days(7),
        },
      ],
    });

    const executeRole = new aws_iam.Role(this, 'api-gateway-s3-assume-role', {
      assumedBy: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    storage.grantReadWrite(executeRole);

    const gateway = new aws_apigateway.RestApi(this, 'assets-api', {
      binaryMediaTypes: ['*/*'],
      minimumCompressionSize: 0,
    });

    const s3Integration = new aws_apigateway.AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${storage.bucketName}/{folder}/{key}`,
      options: {
        credentialsRole: executeRole,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': 'integration.response.header.Content-Type',
            },
          },
        ],

        requestParameters: {
          'integration.request.path.folder': 'method.request.path.folder',
          'integration.request.path.key': 'method.request.path.key',
        },
      },
    });

    gateway.root
      .addResource('assets')
      .addResource('{folder}')
      .addResource('{key}')
      .addMethod('GET', s3Integration, {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true,
            },
          },
        ],
        requestParameters: {
          'method.request.path.folder': true,
          'method.request.path.key': true,
          'method.request.header.Content-Type': true,
        },
      });
  }
}