variable "aws_region" {
  type        = string
  description = "AWS Region to provision resources in"
}

variable "github_owner" {
  type        = string
  description = "GitHub owner of the repositories listed in github_repositories variable. Can be a user or an organization"
}

variable "github_repositories" {
  type        = list(string)
  description = "List of GitHub repositories that you want this terraform workspace to manage webhooks of"
}

variable "custom_domain_name" {
  type        = string
  description = "FQDN to use instead of the AWS API Gateway Endpoint. A hosted zone for the FQDN should be created and managed outside of this workspace if not already. (Leave empty if you don't need a custom domain name)"
  default     = ""
}

variable "hosted_zone_id" {
  type        = string
  description = "Hosted Zone ID to be used for Route 53 configuration for the custom_domain_name variable (Leave empty if you don't need a custom domain name)"
  default     = ""
}

variable "custom_webhook_secret" {
  type        = string
  description = "GitHub webhook secret to be used for the webhook relay endpoint. If left empty, this workspace utilizes random_password resource to create one for you"
  default     = ""
  sensitive   = true
}
