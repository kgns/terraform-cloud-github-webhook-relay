resource "aws_apigatewayv2_route" "this" {
  api_id    = var.api_id
  route_key = var.route_key

  target = "integrations/${aws_apigatewayv2_integration.this.id}"
}

resource "aws_apigatewayv2_integration" "this" {
  api_id           = var.api_id
  integration_type = var.type

  integration_method     = var.method
  payload_format_version = var.payload_version
  integration_uri        = var.uri
}
