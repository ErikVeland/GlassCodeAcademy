# GlassCode Academy Infrastructure as Code (Terraform)

This directory contains the Terraform configuration for deploying the GlassCode Academy infrastructure on AWS.

## Overview

The infrastructure consists of the following components:

1. **VPC** - Virtual Private Cloud with public and private subnets
2. **Database** - PostgreSQL database using Amazon RDS
3. **Redis** - Redis cluster using Amazon ElastiCache
4. **Storage** - S3 bucket for storing assets
5. **EKS** - Amazon Elastic Kubernetes Service for container orchestration
6. **CDN** - CloudFront CDN for content delivery
7. **Key Vault** - AWS Secrets Manager for storing secrets
8. **Monitoring** - Prometheus, Grafana, and Jaeger for observability
9. **GitHub OIDC** - OIDC provider for GitHub Actions

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- kubectl
- helm

## Modules

### VPC
Creates a VPC with public and private subnets across multiple availability zones.

### Database
Creates a PostgreSQL database instance using Amazon RDS.

### Redis
Creates a Redis cluster using Amazon ElastiCache.

### Storage
Creates an S3 bucket for storing assets with appropriate security settings.

### EKS
Creates an Amazon EKS cluster with managed node groups.

### CDN
Creates a CloudFront distribution for content delivery.

### Key Vault
Creates AWS Secrets Manager secrets for storing sensitive information.

### Monitoring
Deploys Prometheus, Grafana, and Jaeger to the EKS cluster for monitoring and observability.

### GitHub OIDC
Creates an OIDC provider for GitHub Actions to enable secretless deployments.

### Security Groups
Creates security groups for the various components.

## Variables

See [variables.tf](variables.tf) for a complete list of variables.

## Outputs

See [outputs.tf](outputs.tf) for a complete list of outputs.

## Deployment

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Review the execution plan:
   ```bash
   terraform plan
   ```

3. Apply the configuration:
   ```bash
   terraform apply
   ```

## Monitoring Stack

The monitoring stack includes:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboarding
- **Jaeger** - Distributed tracing

These components are deployed to the EKS cluster and can be accessed through internal services.

## GitHub OIDC

The GitHub OIDC module creates an OIDC provider that allows GitHub Actions to authenticate with AWS without using long-lived credentials.

## Security

- All resources are deployed within a VPC
- Database and Redis are deployed in private subnets
- Security groups restrict access to only necessary ports
- S3 bucket has public access blocked
- Secrets are stored in AWS Secrets Manager