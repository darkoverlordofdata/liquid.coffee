#+--------------------------------------------------------------------+
#| capture.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the MIT License
#|
#+--------------------------------------------------------------------+
#
# Liquid Templates
#
Liquid = require('../../liquid')

# Capture stores the result of a block into a variable without rendering it inplace.
#
#   {% capture heading %}
#     Monkeys!
#   {% endcapture %}
#   ...
#   <h1>{{ heading }}</h1>
#
# Capture is useful for saving content for use later in your template, such as
# in a sidebar or footer.
#
class Liquid.Tags.Capture extends Liquid.Block

  Syntax = /(\w+)/

  constructor: (tagName, markup, tokens) ->
    if $ = markup.match(Syntax)
      @to = $[1]
    else
      throw new Liquid.SyntaxError("Syntax error in 'capture' - Valid syntax: capture [var]")
    super tagName, markup, tokens

  render: (context) ->
    output = super(context)
    last = context.scopes.length-1
    context.scopes[last][@to] = output
    ''

Liquid.Template.registerTag "capture", Liquid.Tags.Capture
