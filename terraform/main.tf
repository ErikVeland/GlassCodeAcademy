# Terraform configuration for GlassCode Academy infrastructure

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

# AWS provider configuration
provider "aws" {
  region = var.aws_region
}

# Create VPC
module "vpc" {
  source = "./modules/vpc"

  name = "${var.project_name}-${var.environment}"
  cidr = var.vpc_cidr
  azs  = var.availability_zones

  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

# Create database
module "database" {
  source = "./modules/database"

  identifier = "${var.project_name}-${var.environment}"
  db_name    = var.database_name
  username   = var.database_username
  password   = var.database_password

  subnet_ids             = module.vpc.private_subnets
  vpc_security_group_ids = [module.security_groups.database_sg_id]
}

# Create Redis
module "redis" {
  source = "./modules/redis"

  replication_group_id = "${var.project_name}-${var.environment}"
  node_type            = var.redis_node_type

  subnet_ids             = module.vpc.private_subnets
  vpc_security_group_ids = [module.security_groups.redis_sg_id]
}

# Create storage
module "storage" {
  source = "./modules/storage"

  bucket_name = "${var.project_name}-${var.environment}-assets"
}

# Create EKS cluster
module "eks" {
  source = "./modules/eks"

  cluster_name = "${var.project_name}-${var.environment}"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnets
}

# Create CDN
module "cdn" {
  source = "./modules/cdn"

  bucket_domain_name      = module.storage.s3_bucket_bucket_domain_name
  bucket_hosted_zone_id   = module.storage.s3_bucket_hosted_zone_id
  aliases                 = ["${var.project_name}.com"]
}

# Create key vault
module "key_vault" {
  source = "./modules/key_vault"

  project_name = var.project_name
  environment  = var.environment
  secrets = {
    database_password = var.database_password
    jwt_secret        = "super-secret-jwt-key"
    redis_password    = "super-secret-redis-password"
  }
}

# Create monitoring stack
module "monitoring" {
  source = "./modules/monitoring"

  cluster_name                    = module.eks.cluster_name
  cluster_endpoint                = module.eks.cluster_endpoint
  cluster_certificate_authority_data = module.eks.cluster_certificate_authority_data
  oidc_provider_arn               = module.eks.cluster_oidc_issuer_url
  vpc_id                          = module.vpc.vpc_id
  subnet_ids                      = module.vpc.private_subnets
}

# Create GitHub OIDC
module "github_oidc" {
  source = "./modules/github_oidc"

  github_org   = var.github_org
  github_repo  = var.github_repo
  aws_region   = var.aws_region
  project_name = var.project_name
}

# Create security groups
module "security_groups" {
  source = "./modules/security_groups"

  vpc_id = module.vpc.vpc_id
}
