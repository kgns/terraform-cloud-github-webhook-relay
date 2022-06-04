resource "random_password" "secret" {
  count = var.custom_webhook_secret == "" ? 1 : 0

  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "github_repository_webhook" "relay" {
  for_each = toset(var.github_repositories)

  repository = each.key

  configuration {
    url          = "${local.api_endpoint}/webhook/${var.github_owner}/${each.key}"
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
