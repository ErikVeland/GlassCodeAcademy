# Variables for GlassCode Academy infrastructure

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "glasscode-academy"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "glasscode"
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "glasscode"
}

variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "glasscode-academy"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "GlassCodeAcademy"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis AUTH token/password"
  type        = string
  sensitive   = true
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}

variable "prometheus_admin_password" {
  description = "Admin password for Prometheus basic auth"
  type        = string
  sensitive   = true
}

variable "jaeger_admin_password" {
  description = "Admin password for Jaeger basic auth"
  type        = string
  sensitive   = true
}