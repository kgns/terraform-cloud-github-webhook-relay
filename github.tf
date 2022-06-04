data "github_repository" "repo" {
  for_each = toset(var.github_repositories)

  full_name = "${var.github_owner}/${each.key}"
}

resource "random_password" "secret" {
  count = var.custom_webhook_secret == "" ? 1 : 0

  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "github_repository_webhook" "relay" {
  for_each = data.github_repository.repo

  repository = each.value.full_name

  configuration {
    url          = "${local.api_endpoint}/${each.value.full_name}"
    content_type = "json"
    secret       = local.webhook_secret
    insecure_ssl = false
  }

  active = true

  events = [
    "pull_request",
    "push"
  ]
}
