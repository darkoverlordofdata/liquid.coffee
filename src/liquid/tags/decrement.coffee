#+--------------------------------------------------------------------+
#| decrement.coffee
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

class Liquid.Tags.Decrement extends Liquid.Tag

  constructor: (tagName, markup, tokens) ->
    @variable = markup.trim()
    super tagName, markup, tokens

  render: (context) ->
    value = context.scopes[0][@variable] or= 0
    value = value - 1
    context.scopes[0][@variable] = value
    value.toString()

Liquid.Template.registerTag "decrement", Liquid.Tags.Decrement
