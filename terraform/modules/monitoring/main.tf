# Monitoring module for GlassCode Academy (Prometheus, Grafana, Jaeger)

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  type        = string
}

variable "cluster_certificate_authority_data" {
  description = "Certificate authority data of the EKS cluster"
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the OIDC provider"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs"
  type        = list(string)
}

variable "prometheus_namespace" {
  description = "Namespace for Prometheus"
  type        = string
  default     = "monitoring"
}

variable "grafana_namespace" {
  description = "Namespace for Grafana"
  type        = string
  default     = "monitoring"
}

variable "jaeger_namespace" {
  description = "Namespace for Jaeger"
  type        = string
  default     = "observability"
}

output "prometheus_endpoint" {
  description = "Endpoint of the Prometheus server"
  value       = "http://prometheus-server.${var.prometheus_namespace}.svc.cluster.local"
}

output "grafana_endpoint" {
  description = "Endpoint of the Grafana server"
  value       = "http://grafana.${var.grafana_namespace}.svc.cluster.local"
}

output "jaeger_endpoint" {
  description = "Endpoint of the Jaeger server"
  value       = "http://jaeger-query.${var.jaeger_namespace}.svc.cluster.local"
}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.0"
    }
  }
}

# Kubernetes provider configuration
provider "kubernetes" {
  host                   = var.cluster_endpoint
  cluster_ca_certificate = base64decode(var.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", var.cluster_name]
  }
}

# Helm provider configuration
provider "helm" {
  kubernetes {
    host                   = var.cluster_endpoint
    cluster_ca_certificate = base64decode(var.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", var.cluster_name]
    }
  }
}

# Create namespaces
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = var.prometheus_namespace
  }
}

resource "kubernetes_namespace" "observability" {
  metadata {
    name = var.jaeger_namespace
  }
}

# Install Prometheus using Helm
resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "prometheus"
  version    = "25.0.0"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  set {
    name  = "server.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "alertmanager.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "kube-state-metrics.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "pushgateway.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "nodeExporter.service.type"
    value = "ClusterIP"
  }

  depends_on = [kubernetes_namespace.monitoring]
}

# Install Grafana using Helm
resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  version    = "8.0.0"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name

  set {
    name  = "service.type"
    value = "ClusterIP"
  }

  set {
    name  = "adminUser"
    value = "admin"
  }

  set {
    name  = "adminPassword"
    value = "admin"
  }

  set {
    name  = "datasources.datasources\\.yaml.apiVersion"
    value = "1"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].name"
    value = "Prometheus"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].type"
    value = "prometheus"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].url"
    value = "http://prometheus-server"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].access"
    value = "proxy"
  }

  set {
    name  = "datasources.datasources\\.yaml.datasources[0].isDefault"
    value = "true"
  }

  depends_on = [kubernetes_namespace.monitoring]
}

# Install Jaeger using Helm
resource "helm_release" "jaeger" {
  name       = "jaeger"
  repository = "https://jaegertracing.github.io/helm-charts"
  chart      = "jaeger"
  version    = "3.0.0"
  namespace  = kubernetes_namespace.observability.metadata[0].name

  set {
    name  = "provisionDataStore.cassandra"
    value = "false"
  }

  set {
    name  = "storage.type"
    value = "elasticsearch"
  }

  set {
    name  = "query.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "collector.service.type"
    value = "ClusterIP"
  }

  set {
    name  = "agent.service.type"
    value = "ClusterIP"
  }

  depends_on = [kubernetes_namespace.observability]
}

# Create ingress for Prometheus
resource "kubernetes_ingress_v1" "prometheus" {
  metadata {
    name      = "prometheus"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    annotations = {
      "kubernetes.io/ingress.class" = "alb"
      "alb.ingress.kubernetes.io/scheme" = "internal"
      "alb.ingress.kubernetes.io/target-type" = "ip"
    }
  }

  spec {
    rule {
      http {
        path {
          path = "/"
          backend {
            service {
              name = "prometheus-server"
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.prometheus]
}

# Create ingress for Grafana
resource "kubernetes_ingress_v1" "grafana" {
  metadata {
    name      = "grafana"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
    annotations = {
      "kubernetes.io/ingress.class" = "alb"
      "alb.ingress.kubernetes.io/scheme" = "internal"
      "alb.ingress.kubernetes.io/target-type" = "ip"
    }
  }

  spec {
    rule {
      http {
        path {
          path = "/"
          backend {
            service {
              name = "grafana"
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.grafana]
}

# Create ingress for Jaeger
resource "kubernetes_ingress_v1" "jaeger" {
  metadata {
    name      = "jaeger"
    namespace = kubernetes_namespace.observability.metadata[0].name
    annotations = {
      "kubernetes.io/ingress.class" = "alb"
      "alb.ingress.kubernetes.io/scheme" = "internal"
      "alb.ingress.kubernetes.io/target-type" = "ip"
    }
  }

  spec {
    rule {
      http {
        path {
          path = "/"
          backend {
            service {
              name = "jaeger-query"
              port {
                number = 80
              }
            }
          }
        }
      }
    }
  }

  depends_on = [helm_release.jaeger]
}