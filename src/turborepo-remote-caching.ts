import { aws_s3, aws_apigateway, Duration, aws_iam, RemovalPolicy, aws_logs } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TurborepoRemoteCaching extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const storage = new aws_s3.Bucket(this, 'Storage', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: Duration.days(1),
          expiration: Duration.days(7),
        },
      ],
    });

    const credentialsRole = new aws_iam.Role(this, 'Credentials', {
      assumedBy: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    storage.grantReadWrite(credentialsRole);

    const accessLog = new aws_logs.LogGroup(this, 'AccessLog', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const gateway = new aws_apigateway.RestApi(this, `${id}API`, {
      binaryMediaTypes: ['*/*'],
      description: 'API Gateway for Turborepo remote cache server.',
      deployOptions: {
        stageName: 'cache',
        accessLogDestination: new aws_apigateway.LogGroupLogDestination(accessLog),
        accessLogFormat: aws_apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
    });

    const v8 = gateway.root.addResource('v8');

    const resource = v8
      .addResource('artifacts')
      .addResource('{hash}');

    resource.addMethod(
      'PUT',

      new aws_apigateway.AwsIntegration({
        service: 's3',
        integrationHttpMethod: 'PUT',
        path: `${storage.bucketName}/{slug}/{hash}`,
        options: {
          credentialsRole,
          integrationResponses: [
            {
              statusCode: '200',
            },
          ],
          requestParameters: {
            'integration.request.path.slug': 'method.request.querystring.slug',
            'integration.request.path.hash': 'method.request.path.hash',
          },
        },
      }),

      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true,
            },
          },
        ],
        requestParameters: {
          'method.request.querystring.slug': true,
          'method.request.path.hash': true,
          'method.request.header.Content-Type': true,
        },
      });

    resource.addMethod(
      'GET',

      new aws_apigateway.AwsIntegration({
        service: 's3',
        integrationHttpMethod: 'GET',
        path: `${storage.bucketName}/{slug}/{hash}`,
        options: {
          credentialsRole,
          integrationResponses: [
            {
              statusCode: '200',
            },
          ],
          requestParameters: {
            'integration.request.path.slug': 'method.request.querystring.slug',
            'integration.request.path.hash': 'method.request.path.hash',
          },
        },
      }),

      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Content-Type': true,
            },
          },
        ],
        requestParameters: {
          'method.request.querystring.slug': true,
          'method.request.path.hash': true,
          'method.request.header.Content-Type': true,
        },
      });

    /**
     * The following endpoints are just stubs, and turbo isn't calling them during runs
     */

    const v2 = gateway.root.addResource('v2');

    v2
      .addResource('user')
      .addMethod('GET', new aws_apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '200',
        }],
      }));

    v2
      .addResource('teams')
      .addMethod('GET', new aws_apigateway.MockIntegration({
        integrationResponses: [{
          statusCode: '200',
        }],
      }));
  }
}