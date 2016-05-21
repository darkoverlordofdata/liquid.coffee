#+--------------------------------------------------------------------+
#| increment.coffee
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

class Liquid.Tags.Increment extends Liquid.Tag

  constructor: (tagName, markup, tokens) ->
    @variable = markup.trim()
    super tagName, markup, tokens

  render: (context) ->
    if context.scopes[0][@variable]? 
      value = context.scopes[0][@variable]
    else
      value = context.scopes[0][@variable] = -1
    value = value + 1
    context.scopes[0][@variable] = value
    value.toString()


  
    # value = context.scopes[0][@variable] or= 0
    # value = value + 1
    # context.scopes[0][@variable] = value
    # value.toString()

Liquid.Template.registerTag "increment", Liquid.Tags.Increment
