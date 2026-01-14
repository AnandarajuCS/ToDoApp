#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TodoInfrastructureStack } from '../lib/todo-infrastructure-stack';

const app = new cdk.App();

// Read configuration from CDK context (cdk.json or -c flags)
const domainName = app.node.tryGetContext('domainName');
const hostedZoneName = app.node.tryGetContext('hostedZoneName');
const environmentName = app.node.tryGetContext('environmentName') || 'dev';

// Get account and region from environment variables or use defaults
// SECURITY: Do not hardcode account IDs in source code
const account = process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID;
const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

if (!account) {
  console.warn('⚠️  WARNING: AWS account not detected. Set CDK_DEFAULT_ACCOUNT or AWS_ACCOUNT_ID environment variable.');
}

new TodoInfrastructureStack(app, 'TodoInfrastructureStack', {
  env: {
    account: account,
    region: region,
  },
  domainName: domainName,
  hostedZoneName: hostedZoneName,
  environmentName: environmentName,
  description: `Todo Application Infrastructure (${environmentName})`,
});
// Synthesize the CloudFormation template
app.synth();
