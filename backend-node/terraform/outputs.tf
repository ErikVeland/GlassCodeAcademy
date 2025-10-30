# Outputs for GlassCode Academy Infrastructure

output "database_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.glasscode_postgres.endpoint
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.glasscode_postgres.username
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.glasscode_postgres.db_name
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.glasscode_redis.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_cluster.glasscode_redis.cache_nodes[0].port
}

output "s3_bucket_name" {
  description = "S3 bucket name for assets"
  value       = aws_s3_bucket.glasscode_assets.bucket
}

output "iam_role_name" {
  description = "IAM role name for EC2 instances"
  value       = aws_iam_role.glasscode_ec2_role.name
}

output "security_group_ids" {
  description = "Security group IDs"
  value = {
    database = aws_security_group.db_sg.id
    redis    = aws_security_group.redis_sg.id
  }
}