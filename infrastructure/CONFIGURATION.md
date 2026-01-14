# Infrastructure Configuration Guide

This guide explains how to configure the Todo application infrastructure for different environments without modifying source code.

## Configuration Options

### Environment Variables

Set these environment variables before deploying:

```bash
# AWS Account and Region (automatically detected if AWS CLI is configured)
export CDK_DEFAULT_ACCOUNT="123456789012"  # Your AWS account ID
export CDK_DEFAULT_REGION="us-east-1"      # Your preferred region
```

### CDK Context Variables

Configure in `cdk.json` or pass via command line with `-c` flag:

#### Required Configuration

- **environmentName**: Environment identifier (e.g., 'dev', 'staging', 'prod')
  - Default: `dev`
  - Controls removal policies and resource retention

#### Optional Configuration (Custom Domain)

- **domainName**: Full domain name for your application (e.g., 'todo.example.com')
- **hostedZoneName**: Route53 hosted zone name (e.g., 'example.com')

**Important**: Both `domainName` and `hostedZoneName` must be provided together, or neither.

## Deployment Examples

### Development Environment (No Custom Domain)

```bash
# Uses DESTROY removal policy - data will be deleted when stack is destroyed
cdk deploy -c environmentName=dev
```

### Development Environment (With Custom Domain)

```bash
cdk deploy \
  -c environmentName=dev \
  -c domainName=todo.dev.example.com \
  -c hostedZoneName=dev.example.com
```

### Production Environment (With Custom Domain)

```bash
# Uses RETAIN removal policy - data is preserved when stack is destroyed
cdk deploy \
  -c environmentName=prod \
  -c domainName=todo.example.com \
  -c hostedZoneName=example.com
```

### Using cdk.json for Persistent Configuration

Edit `infrastructure/cdk.json` and add your configuration to the `context` section:

```json
{
  "context": {
    "environmentName": "prod",
    "domainName": "todo.example.com",
    "hostedZoneName": "example.com"
  }
}
```

## Security Considerations

### Removal Policies

The stack automatically configures removal policies based on `environmentName`:

- **Development** (`dev`, `development`): `RemovalPolicy.DESTROY`
  - DynamoDB table and S3 bucket will be **permanently deleted** when stack is destroyed
  - S3 objects are automatically deleted
  - ⚠️ **WARNING**: All data will be lost!

- **Production** (any other value): `RemovalPolicy.RETAIN`
  - DynamoDB table and S3 bucket are **preserved** when stack is destroyed
  - Manual cleanup required if you want to delete resources
  - ✅ **Safe default**: Prevents accidental data loss

### Best Practices

1. **Never hardcode credentials** in source code or configuration files
2. **Use environment-specific configurations** via CDK context or environment variables
3. **Set `environmentName=prod`** for production deployments to prevent accidental data deletion
4. **Test in development** before deploying to production
5. **Review CloudFormation changeset** before approving production deployments
