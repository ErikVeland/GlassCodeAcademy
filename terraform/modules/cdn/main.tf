# CDN module for GlassCode Academy

variable "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  type        = string
}

variable "bucket_hosted_zone_id" {
  description = "Hosted zone ID of the S3 bucket"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  type        = string
  default     = ""
}

variable "aliases" {
  description = "List of aliases for the CloudFront distribution"
  type        = list(string)
  default     = []
}

variable "price_class" {
  description = "Price class for the CloudFront distribution"
  type        = string
  default     = "PriceClass_All"
}

variable "enabled" {
  description = "Enable the CloudFront distribution"
  type        = bool
  default     = true
}

variable "default_root_object" {
  description = "Default root object"
  type        = string
  default     = "index.html"
}

variable "minimum_protocol_version" {
  description = "Minimum SSL protocol version"
  type        = string
  default     = "TLSv1.2_2021"
}

output "cdn_id" {
  description = "ID of the CloudFront distribution"
  value       = module.cdn.cloudfront_distribution_id
}

output "cdn_arn" {
  description = "ARN of the CloudFront distribution"
  value       = module.cdn.cloudfront_distribution_arn
}

output "cdn_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cdn.cloudfront_distribution_domain_name
}

output "cdn_zone_id" {
  description = "Zone ID of the CloudFront distribution"
  value       = module.cdn.cloudfront_distribution_hosted_zone_id
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

module "cdn" {
  source  = "terraform-aws-modules/cloudfront/aws"
  version = "~> 3.0"

  aliases = var.aliases

  comment             = "CloudFront distribution for GlassCode Academy"
  enabled             = var.enabled
  is_ipv6_enabled     = true
  price_class         = var.price_class
  retain_on_delete    = false
  wait_for_deployment = false

  # Logging
  logging = {
    bucket = var.bucket_domain_name
    prefix = "cloudfront-logs/"
  }

  # Default cache behavior
  default_cache_behavior = {
    target_origin_id       = "s3_origin"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    # Cache policy
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingOptimized

    # Origin request policy
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # Managed-AllViewer

    # Response headers policy
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03" # Managed-SecurityHeadersPolicy
  }

  # Ordered cache behaviors
  ordered_cache_behavior = [
    {
      path_pattern           = "/api/*"
      target_origin_id       = "s3_origin"
      viewer_protocol_policy = "redirect-to-https"

      allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods  = ["GET", "HEAD"]

      # Cache policy
      cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingOptimized

      # Origin request policy
      origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # Managed-AllViewer
    }
  ]

  # Origins
  origin = {
    s3_origin = {
      domain_name = var.bucket_domain_name
      origin_id   = "s3_origin"

      s3_origin_config = {
        origin_access_identity = "origin-access-identity/cloudfront/${module.cdn.cloudfront_origin_access_identity}"
      }
    }
  }

  # Restrictions
  restrictions = {
    geo_restriction = {
      restriction_type = "none"
    }
  }

  # SSL certificate
  viewer_certificate = {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = var.minimum_protocol_version
  }

  tags = {
    Project     = "glasscode-academy"
    Environment = "dev"
  }
}