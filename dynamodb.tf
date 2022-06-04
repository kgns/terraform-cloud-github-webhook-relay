resource "aws_dynamodb_table" "tf_webhooks" {
  name           = "tf_webhooks"
  billing_mode   = "PAY_PER_REQUEST"
  table_class    = "STANDARD"
  hash_key       = "repo"

  attribute {
    name = "repo"
    type = "S"
  }
}
