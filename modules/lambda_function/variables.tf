variable "function_name" {
  type = string
}

variable "dynamodb_table_arn" {
  type = string
}

variable "api_gateway_execution_arn" {
  type = string
}

variable "dynamodb_permission" {
  type = string
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}
