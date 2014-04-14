#+--------------------------------------------------------------------+
#| tag.coffee
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
Liquid = require('../liquid')

class Liquid.Tag


  constructor: (tagName, markup, tokens) ->
    @tagName = tagName
    @markup = markup
    @nodelist = @nodelist or []
    @parse tokens

  parse: (tokens) ->

  render: (context) ->
    ""

