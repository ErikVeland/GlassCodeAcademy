# Storage module for GlassCode Academy

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "acl" {
  description = "ACL for the S3 bucket"
  type        = string
  default     = "private"
}

variable "block_public_acls" {
  description = "Block public ACLs"
  type        = bool
  default     = true
}

variable "block_public_policy" {
  description = "Block public policy"
  type        = bool
  default     = true
}

variable "ignore_public_acls" {
  description = "Ignore public ACLs"
  type        = bool
  default     = true
}

variable "restrict_public_buckets" {
  description = "Restrict public buckets"
  type        = bool
  default     = true
}

variable "versioning" {
  description = "Enable versioning"
  type        = bool
  default     = true
}

variable "sse_algorithm" {
  description = "Server-side encryption algorithm"
  type        = string
  default     = "AES256"
}

output "s3_bucket_id" {
  description = "ID of the S3 bucket"
  value       = module.s3_bucket.s3_bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.s3_bucket.s3_bucket_arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = var.bucket_name
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = module.s3_bucket.s3_bucket_bucket_domain_name
}

output "s3_bucket_hosted_zone_id" {
  description = "Hosted zone ID of the S3 bucket"
  value       = module.s3_bucket.s3_bucket_hosted_zone_id
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

module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = var.bucket_name
  acl    = var.acl

  # Block public access
  block_public_acls       = var.block_public_acls
  block_public_policy     = var.block_public_policy
  ignore_public_acls      = var.ignore_public_acls
  restrict_public_buckets = var.restrict_public_buckets

  # Versioning
  versioning = {
    enabled = var.versioning
  }

  # Server-side encryption
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = var.sse_algorithm
      }
    }
  }

  # Lifecycle rules
  lifecycle_rule = [
    {
      id      = "log"
      enabled = true
      prefix  = "log/"

      transition = [
        {
          days            = 30
          storage_class   = "STANDARD_IA"
        },
        {
          days            = 60
          storage_class   = "GLACIER"
        }
      ]

      expiration = {
        days = 90
      }
    }
  ]

  tags = {
    Project     = var.bucket_name
    Environment = "dev"
  }
}