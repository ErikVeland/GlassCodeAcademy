# Outputs for GlassCode Academy infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnets" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnets
}

output "private_subnets" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnets
}

output "database_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = module.database.db_instance_endpoint
}

output "database_name" {
  description = "Name of the database"
  value       = var.database_name
}

output "database_username" {
  description = "Username for the database"
  value       = var.database_username
}

output "redis_endpoint" {
  description = "Endpoint of the Redis cluster"
  value       = module.redis.redis_endpoint
}

output "redis_port" {
  description = "Port of the Redis cluster"
  value       = module.redis.redis_port
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.storage.s3_bucket_name
}

output "cdn_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cdn.cdn_domain_name
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = module.key_vault.key_vault_name
}

output "prometheus_endpoint" {
  description = "Endpoint of the Prometheus server"
  value       = module.monitoring.prometheus_endpoint
}

output "grafana_endpoint" {
  description = "Endpoint of the Grafana server"
  value       = module.monitoring.grafana_endpoint
}

output "jaeger_endpoint" {
  description = "Endpoint of the Jaeger server"
  value       = module.monitoring.jaeger_endpoint
}

output "github_oidc_arn" {
  description = "ARN of the GitHub OIDC provider"
  value       = module.github_oidc.oidc_provider_arn
}

output "github_oidc_url" {
  description = "URL of the GitHub OIDC provider"
  value       = module.github_oidc.oidc_provider_url
}

output "github_actions_role_arn" {
  description = "ARN of the GitHub Actions role"
  value       = module.github_oidc.github_actions_role_arn
}