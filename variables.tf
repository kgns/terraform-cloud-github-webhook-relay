variable "aws_region" {
  type    = string
}

variable "github_owner" {
  type    = string
}

variable "github_repositories" {
  type = list(string)
}

variable "custom_domain_name" {
  type    = string
  default = ""
}

variable "hosted_zone_id" {
  type    = string
  default = ""
}

variable "custom_webhook_secret" {
  type      = string
  default   = ""
  sensitive = true
}
