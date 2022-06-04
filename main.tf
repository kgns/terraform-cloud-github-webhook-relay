terraform {
  required_version = ">=1.0.0"

  cloud {
    hostname = "app.terraform.io"

    workspaces {
      name = "github-webhook-relay"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 4.0"
    }
    archive = {
      source = "hashicorp/archive"
      version = "~> 2.2.0"
    }
    random = {
      source = "hashicorp/random"
      version = "~> 3.2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "github" {
  owner = var.github_owner
}

data "aws_caller_identity" "current" {}

locals {
  custom_domain = var.custom_domain_name != "" && var.hosted_zone_id != "" ? true : false
  webhook_secret = var.custom_webhook_secret != "" ? var.custom_webhook_secret : random_password.secret[0].result
  api_endpoint = local.custom_domain ? "https://${var.custom_domain_name}" : aws_apigatewayv2_api.this.api_endpoint
}
