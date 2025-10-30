# Key Vault module for GlassCode Academy (using AWS Secrets Manager)

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "secrets" {
  description = "Map of secrets to create"
  type        = map(string)
  default     = {}
}

output "secrets_manager_arn" {
  description = "ARN of the Secrets Manager"
  value       = aws_secretsmanager_secret.secrets[*].arn
}

output "key_vault_name" {
  description = "Name of the key vault"
  value       = var.project_name
}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Create secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets

  name        = "${var.project_name}-${var.environment}-${each.key}"
  description = "Secret for ${each.key} in ${var.project_name} ${var.environment}"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# Store secret values
resource "aws_secretsmanager_secret_version" "secret_versions" {
  for_each = var.secrets

  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = each.value
}