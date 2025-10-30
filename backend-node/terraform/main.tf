# GlassCode Academy Infrastructure as Code
# Terraform configuration for AWS deployment

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  required_version = ">= 1.0"
}

# Provider configuration
provider "aws" {
  region = var.aws_region
}

# PostgreSQL Database (RDS)
resource "aws_db_instance" "glasscode_postgres" {
  identifier             = "glasscode-postgres-${var.environment}"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp2"
  storage_encrypted      = true
  username               = var.db_username
  password               = var.db_password
  db_name                = var.db_name
  parameter_group_name   = "default.postgres15"
  skip_final_snapshot    = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "prod" ? "glasscode-postgres-final-snapshot" : null
  backup_retention_period = var.environment == "prod" ? 7 : 1
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  multi_az               = var.environment == "prod" ? true : false
  publicly_accessible    = false
  
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group.name
  
  tags = {
    Name        = "glasscode-postgres-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

# Redis (ElastiCache)
resource "aws_elasticache_cluster" "glasscode_redis" {
  cluster_id           = "glasscode-redis-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.environment == "prod" ? 2 : 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  
  security_group_ids   = [aws_security_group.redis_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet_group.name
  
  tags = {
    Name        = "glasscode-redis-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

# S3 Bucket for static assets
resource "aws_s3_bucket" "glasscode_assets" {
  bucket = "glasscode-academy-assets-${var.environment}-${random_string.bucket_suffix.result}"
  
  tags = {
    Name        = "glasscode-assets-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

resource "aws_s3_bucket_versioning" "assets_versioning" {
  bucket = aws_s3_bucket.glasscode_assets.id
  
  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets_encryption" {
  bucket = aws_s3_bucket.glasscode_assets.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "glasscode_ec2_role" {
  name = "glasscode-ec2-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "glasscode-ec2-role-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

# IAM Policy for S3 access
resource "aws_iam_policy" "glasscode_s3_policy" {
  name        = "glasscode-s3-policy-${var.environment}"
  description = "Policy for S3 access"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.glasscode_assets.arn,
          "${aws_s3_bucket.glasscode_assets.arn}/*"
        ]
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "s3_attachment" {
  role       = aws_iam_role.glasscode_ec2_role.name
  policy_arn = aws_iam_policy.glasscode_s3_policy.arn
}

# Security Groups
resource "aws_security_group" "db_sg" {
  name        = "glasscode-db-sg-${var.environment}"
  description = "Security group for PostgreSQL database"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "glasscode-db-sg-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

resource "aws_security_group" "redis_sg" {
  name        = "glasscode-redis-sg-${var.environment}"
  description = "Security group for Redis"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "glasscode-redis-sg-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

# Subnet Groups
resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "glasscode-db-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids
  
  tags = {
    Name        = "glasscode-db-subnet-group-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "glasscode-redis-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids
  
  tags = {
    Name        = "glasscode-redis-subnet-group-${var.environment}"
    Environment = var.environment
    Project     = "GlassCode Academy"
  }
}

# Random string for unique bucket names
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}