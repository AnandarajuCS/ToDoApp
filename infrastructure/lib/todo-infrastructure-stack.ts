import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

/**
 * Configuration properties for the Todo Infrastructure Stack
 */
export interface TodoInfrastructureStackProps extends cdk.StackProps {
  /**
   * Custom domain name for the application (e.g., 'todo.example.com')
   * If not provided, only CloudFront distribution URL will be available
   */
  domainName?: string;
  
  /**
   * Route53 hosted zone name (e.g., 'example.com')
   * Required if domainName is provided
   */
  hostedZoneName?: string;
  
  /**
   * Environment name (e.g., 'dev', 'staging', 'prod')
   * Used to determine removal policies and other environment-specific settings
   */
  environmentName?: string;
}

export class TodoInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TodoInfrastructureStackProps) {
    super(scope, id, props);

    // Determine removal policy based on environment
    // SECURITY: DESTROY policy will permanently delete all data when stack is destroyed
    // Use RETAIN for production environments to prevent accidental data loss
    const environmentName = props?.environmentName || 'dev';
    const isDevelopment = environmentName === 'dev' || environmentName === 'development';
    const removalPolicy = isDevelopment ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
    
    if (removalPolicy === cdk.RemovalPolicy.DESTROY) {
      console.warn('⚠️  WARNING: Resources are configured with DESTROY removal policy.');
      console.warn('⚠️  All data will be permanently deleted when this stack is destroyed.');
      console.warn('⚠️  Set environmentName to "prod" or "production" to use RETAIN policy.');
    }

    // DynamoDB Table
    const todoTable = new dynamodb.Table(this, 'TodoTable', {
      tableName: 'TodoItems',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: removalPolicy,
      pointInTimeRecovery: true,
    });

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, 'TodoLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Scan',
              ],
              resources: [todoTable.tableArn],
            }),
          ],
        }),
      },
    });

    // Lambda functions
    const createTodoFunction = new lambda.Function(this, 'CreateTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/createTodo.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const getTodosFunction = new lambda.Function(this, 'GetTodosFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/getTodos.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const getTodoFunction = new lambda.Function(this, 'GetTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/getTodo.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const updateTodoFunction = new lambda.Function(this, 'UpdateTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/updateTodo.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const deleteTodoFunction = new lambda.Function(this, 'DeleteTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/deleteTodo.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const healthCheckFunction = new lambda.Function(this, 'HealthCheckFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handlers/healthCheck.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      environment: {
        TODO_TABLE_NAME: todoTable.tableName,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo Service',
      description: 'This service serves the Todo application API.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // API Gateway Resources and Methods
    const todosResource = api.root.addResource('todos');
    
    // POST /todos
    todosResource.addMethod('POST', new apigateway.LambdaIntegration(createTodoFunction));
    
    // GET /todos
    todosResource.addMethod('GET', new apigateway.LambdaIntegration(getTodosFunction));
    
    // Individual todo resource
    const todoResource = todosResource.addResource('{id}');
    
    // GET /todos/{id}
    todoResource.addMethod('GET', new apigateway.LambdaIntegration(getTodoFunction));
    
    // PUT /todos/{id}
    todoResource.addMethod('PUT', new apigateway.LambdaIntegration(updateTodoFunction));
    
    // DELETE /todos/{id}
    todoResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoFunction));

    // Health check endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(healthCheckFunction));

    // S3 Bucket for frontend hosting (private bucket with CloudFront access)
    const websiteBucket = new s3.Bucket(this, 'TodoWebsiteBucket', {
      bucketName: `todo-app-frontend-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: removalPolicy,
      autoDeleteObjects: isDevelopment, // Only auto-delete in development
    });

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'TodoOAC', {
      description: 'OAC for Todo App S3 bucket',
    });

    // Custom domain configuration
    // Custom domain is optional - only configure if provided
    const domainName = props?.domainName;
    const hostedZoneName = props?.hostedZoneName;
    
    let certificate: certificatemanager.ICertificate | undefined;
    let hostedZone: route53.IHostedZone | undefined;
    
    if (domainName && hostedZoneName) {
      // Lookup existing hosted zone
      hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: hostedZoneName,
      });

      // SSL Certificate for custom domain (must be in us-east-1 for CloudFront)
      certificate = new certificatemanager.Certificate(this, 'TodoCertificate', {
        domainName: domainName,
        validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
      });
    } else if (domainName || hostedZoneName) {
      // Error if only one is provided
      throw new Error('Both domainName and hostedZoneName must be provided together, or neither');
    }

    // CloudFront Distribution
    const distributionProps: cloudfront.DistributionProps = {
      ...(domainName && certificate ? {
        domainNames: [domainName],
        certificate: certificate,
      } : {}),
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    };
    
    const distribution = new cloudfront.Distribution(this, 'TodoDistribution', distributionProps);

    // Deploy frontend (placeholder - will be updated after frontend is built)
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../frontend/build')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // CloudWatch Alarms for monitoring
    const errorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      metric: api.metricServerError({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const latencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      metric: api.metricLatency({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 2000, // 2 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Lambda function error alarms
    [createTodoFunction, getTodosFunction, getTodoFunction, updateTodoFunction, deleteTodoFunction, healthCheckFunction].forEach((func, index) => {
      new cloudwatch.Alarm(this, `Lambda${index}ErrorAlarm`, {
        metric: func.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });
    });

    // Route53 record to point custom domain to CloudFront
    // Only create if custom domain is configured
    if (domainName && hostedZone) {
      const recordName = domainName.replace(`.${hostedZoneName}`, '');
      new route53.ARecord(this, 'TodoAliasRecord', {
        zone: hostedZone,
        recordName: recordName,
        target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    if (domainName) {
      new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${domainName}`,
        description: 'Custom Domain URL',
      });
    }

    new cdk.CfnOutput(this, 'TodoTableName', {
      value: todoTable.tableName,
      description: 'DynamoDB Table Name',
    });
  }
}