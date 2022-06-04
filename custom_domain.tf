resource "aws_apigatewayv2_domain_name" "this" {
  count = local.custom_domain ? 1 : 0

  domain_name = var.custom_domain_name

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.validation[0].certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_route53_record" "custom_domain" {
  count = local.custom_domain ? 1 : 0

  name    = aws_apigatewayv2_domain_name.this[0].domain_name
  type    = "A"
  zone_id = var.hosted_zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.this[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.this[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_acm_certificate" "custom_domain" {
  count = local.custom_domain ? 1 : 0

  domain_name               = var.custom_domain_name
  validation_method         = "DNS"
  subject_alternative_names = ["*.${var.custom_domain_name}"]
}

resource "aws_route53_record" "validation" {
  count = local.custom_domain ? 1 : 0

  name    = tolist(aws_acm_certificate.custom_domain[0].domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.custom_domain[0].domain_validation_options)[0].resource_record_type
  zone_id = var.hosted_zone_id
  records = [tolist(aws_acm_certificate.custom_domain[0].domain_validation_options)[0].resource_record_value]
  ttl     = "300"
}

resource "aws_acm_certificate_validation" "validation" {
  count = local.custom_domain ? 1 : 0

  certificate_arn = aws_acm_certificate.custom_domain[0].arn
  validation_record_fqdns = [
    aws_route53_record.validation[0].fqdn,
  ]
}

resource "aws_apigatewayv2_api_mapping" "example" {
  count = local.custom_domain ? 1 : 0

  api_id      = aws_apigatewayv2_api.this.id
  domain_name = aws_apigatewayv2_domain_name.this[0].id
  stage       = aws_apigatewayv2_stage.default.id
}
