resource "aws_apigatewayv2_api" "this" {
  name          = "tf-gh-webhook-relay"
  protocol_type = "HTTP"

  disable_execute_api_endpoint = local.custom_domain
}

module "default_route" {
  source = "./modules/api_gateway_route"

  api_id          = aws_apigatewayv2_api.this.id
  route_key       = "$default"
  type            = "HTTP_PROXY"
  uri             = "https://api.github.com"
  payload_version = null
}

module "hooks_get_route" {
  source = "./modules/api_gateway_route"

  api_id          = aws_apigatewayv2_api.this.id
  route_key       = "GET /repos/{user}/{repo}/hooks"
  type            = "AWS_PROXY"
  uri             = module.get_hooks_lambda.invoke_arn
  payload_version = "1.0"
}

module "hooks_post_route" {
  source = "./modules/api_gateway_route"

  api_id          = aws_apigatewayv2_api.this.id
  route_key       = "POST /repos/{user}/{repo}/hooks"
  type            = "AWS_PROXY"
  uri             = module.post_hooks_lambda.invoke_arn
  payload_version = "1.0"
}

module "hooks_delete_route" {
  source = "./modules/api_gateway_route"

  api_id          = aws_apigatewayv2_api.this.id
  route_key       = "DELETE /repos/{user}/{repo}/hooks/{id}"
  type            = "AWS_PROXY"
  uri             = module.delete_hooks_lambda.invoke_arn
  payload_version = "1.0"
}

module "github_webhook_route" {
  source = "./modules/api_gateway_route"

  api_id          = aws_apigatewayv2_api.this.id
  route_key       = "POST /webhook/{user}/{repo}"
  type            = "AWS_PROXY"
  uri             = module.webhook_relay_lambda.invoke_arn
  payload_version = "2.0"
}
