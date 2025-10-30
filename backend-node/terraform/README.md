# GlassCode Academy Infrastructure as Code

This directory contains Terraform configurations for provisioning the GlassCode Academy infrastructure.

## Overview

The Terraform configuration provisions the following AWS resources:

1. **PostgreSQL Database (RDS)** - For storing application data
2. **Redis (ElastiCache)** - For caching and session storage
3. **S3 Bucket** - For storing static assets
4. **IAM Role and Policy** - For secure access to AWS services
5. **Security Groups** - For network access control
6. **Subnet Groups** - For database and cache subnet configuration

## Prerequisites

- Terraform 1.0 or higher
- AWS CLI configured with appropriate credentials
- An existing VPC with public and private subnets

## Usage

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Plan the deployment**:
   ```bash
   terraform plan -var-file="terraform.tfvars"
   ```

3. **Apply the configuration**:
   ```bash
   terraform apply -var-file="terraform.tfvars"
   ```

4. **Destroy the infrastructure** (when no longer needed):
   ```bash
   terraform destroy -var-file="terraform.tfvars"
   ```

## Variables

The following variables can be configured in `terraform.tfvars`:

- `aws_region` - AWS region (default: us-west-2)
- `environment` - Deployment environment (dev, staging, prod)
- `vpc_id` - VPC ID where resources will be deployed
- `private_subnet_ids` - List of private subnet IDs
- `db_instance_class` - Database instance class
- `db_allocated_storage` - Allocated storage for database
- `db_username` - Database username
- `db_password` - Database password
- `db_name` - Database name
- `redis_node_type` - Redis node type

## Environment-Specific Configurations

### Development
- Single AZ database deployment
- Minimal instance sizes
- Versioning disabled on S3 bucket

### Production
- Multi AZ database deployment for high availability
- Enhanced backup retention
- Versioning enabled on S3 bucket
- Larger instance sizes

## Security

- All databases are encrypted at rest
- Network access is controlled through security groups
- S3 buckets use server-side encryption
- IAM roles follow the principle of least privilege

## Monitoring and Alerts

The infrastructure is designed to work with:
- CloudWatch for metrics and logs
- SNS for notifications
- CloudTrail for audit logging

## Cost Considerations

- Development environments use minimal resources to reduce costs
- Production environments use HA configurations for reliability
- All resources can be easily destroyed when not in use