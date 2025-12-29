#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TodoInfrastructureStack } from '../lib/todo-infrastructure-stack';

const app = new cdk.App();
new TodoInfrastructureStack(app, 'TodoInfrastructureStack', {
  env: {
    account: '622037664315',
    region: 'us-east-1',
  },
});