#+--------------------------------------------------------------------+
#| assign.coffee
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

# Assign sets a variable in your template.
#
#   {% assign foo = 'monkey' %}
#
# You can then use the variable later in the page.
#
#  {{ foo }}
#
class Liquid.Tags.Assign extends Liquid.Tag

  Syntax = ///((?:#{Liquid.VariableSignature.source})+)\s*=\s*((?:#{Liquid.StrictQuotedFragment.source})+)///


  constructor: (tagName, markup, tokens) ->
    if $ = markup.match(Syntax)
      @to = $[1]
      @from = $[2]
    else
      throw new Liquid.SyntaxError("Syntax error in 'assign' - Valid syntax: assign [var] = [source]")
    super tagName, markup, tokens


  render: (context) ->
    last = context.scopes.length-1
    context.scopes[last][@to] = context.get(@from)
    ""

Liquid.Template.registerTag "assign", Liquid.Tags.Assign
