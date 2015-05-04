# example

this is a copy of the expressjs example at

https://github.com/Thuzi/facebook-node-sdk/tree/master/samples/scrumptious

It's been converted to a coffeescript project, using liquid.coffee templates

A neat feature of liquid is the {% raw %} tag. It's used in menu.tpl to embed mustache templates for the client.
The mustache '{{...}}' tags are unprocessed until the {% endraw %} is encountered.