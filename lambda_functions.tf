module "post_hooks_lambda" {
  source = "./modules/lambda_function"

  function_name             = "post-hooks"
  dynamodb_permission       = "PutItem"
  dynamodb_table_arn        = aws_dynamodb_table.tf_webhooks.arn
  api_gateway_execution_arn = aws_apigatewayv2_api.this.execution_arn
}

module "get_hooks_lambda" {
  source = "./modules/lambda_function"

  function_name             = "get-hooks"
  dynamodb_permission       = "Query"
  dynamodb_table_arn        = aws_dynamodb_table.tf_webhooks.arn
  api_gateway_execution_arn = aws_apigatewayv2_api.this.execution_arn
}

module "delete_hooks_lambda" {
  source = "./modules/lambda_function"

  function_name             = "delete-hooks"
  dynamodb_permission       = "DeleteItem"
  dynamodb_table_arn        = aws_dynamodb_table.tf_webhooks.arn
  api_gateway_execution_arn = aws_apigatewayv2_api.this.execution_arn
}

module "webhook_relay_lambda" {
  source = "./modules/lambda_function"

  function_name             = "webhook-relay"
  dynamodb_permission       = "Query"
  dynamodb_table_arn        = aws_dynamodb_table.tf_webhooks.arn
  api_gateway_execution_arn = aws_apigatewayv2_api.this.execution_arn
  environment_variables     = {GITHUB_WEBHOOK_SECRET = local.webhook_secret}
}
