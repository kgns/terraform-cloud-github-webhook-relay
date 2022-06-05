resource "aws_dynamodb_table" "tf_webhooks" {
  name         = "tf_webhooks"
  billing_mode = "PAY_PER_REQUEST"
  table_class  = "STANDARD"
  hash_key     = "repo"
  range_key    = "id"

  attribute {
    name = "repo"
    type = "S"
  }

  attribute {
    name = "id"
    type = "N"
  }
}
