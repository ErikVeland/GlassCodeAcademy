# Redis module for GlassCode Academy

variable "replication_group_id" {
  description = "Replication group ID"
  type        = string
}

variable "node_type" {
  description = "Redis node type"
  type        = string
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "6.2"
}

variable "port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "parameter_group_name" {
  description = "Redis parameter group name"
  type        = string
  default     = "default.redis6.x"
}

variable "subnet_ids" {
  description = "Subnet IDs for the Redis cluster"
  type        = list(string)
}

variable "vpc_security_group_ids" {
  description = "Security group IDs for the Redis cluster"
  type        = list(string)
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:05:00-sun:09:00"
}

variable "snapshot_window" {
  description = "Snapshot window"
  type        = string
  default     = "05:00-09:00"
}

variable "snapshot_retention_limit" {
  description = "Snapshot retention limit in days"
  type        = number
  default     = 7
}

variable "apply_immediately" {
  description = "Apply changes immediately"
  type        = bool
  default     = true
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable multi-AZ"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable in-transit encryption for Redis"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "Redis AUTH token (required when transit encryption is enabled)"
  type        = string
  sensitive   = true
}

output "redis_endpoint" {
  description = "Endpoint of the Redis cluster"
  value       = module.redis.replication_group_primary_endpoint_address
}

output "redis_port" {
  description = "Port of the Redis cluster"
  value       = var.port
}

output "redis_cluster_id" {
  description = "ID of the Redis cluster"
  value       = module.redis.replication_group_id
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

module "redis" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  replication_group_id          = var.replication_group_id
  node_type                     = var.node_type
  engine_version                = var.engine_version
  port                          = var.port
  parameter_group_name          = var.parameter_group_name
  maintenance_window            = var.maintenance_window
  snapshot_window               = var.snapshot_window
  snapshot_retention_limit      = var.snapshot_retention_limit
  apply_immediately             = var.apply_immediately
  automatic_failover_enabled    = var.automatic_failover_enabled
  multi_az_enabled              = var.multi_az_enabled
  transit_encryption_enabled    = var.transit_encryption_enabled
  auth_token                    = var.auth_token
  auth_token_update_strategy    = "SET"

  subnet_ids                   = var.subnet_ids
  security_group_ids           = var.vpc_security_group_ids

  tags = {
    Project     = var.replication_group_id
    Environment = "dev"
  }
}