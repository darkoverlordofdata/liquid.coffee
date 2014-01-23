#+--------------------------------------------------------------------+
#| tag.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013 - 2014
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# Liquid Templates
#
Liquid = require('../liquid')

class Liquid.Tag

  Object.defineProperties Tag::,
    name:
      get: -> @constructor.name.toLowerCase()

  constructor: (tagName, markup, tokens, options) ->
    @tagName    = tagName
    @markup     = markup
    @nodelist   = @nodelist or []
    @options    = {}
    @parse tokens

  parse: (tokens) ->

  render: (context) ->
    ""

