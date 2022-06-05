variable "api_id" {
  type = string
}

variable "route_key" {
  type = string
}

variable "method" {
  type    = string
  default = "POST"
}

variable "type" {
  type    = string
  default = "AWS_PROXY"
}

variable "uri" {
  type = string
}

variable "payload_version" {
  type    = string
  default = "1.0"
}
