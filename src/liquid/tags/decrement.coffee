#+--------------------------------------------------------------------+
#| decrement.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
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
Tag = require('../tag')
Template = require('../template')

module.exports = class Decrement extends Tag

  constructor: (tagName, markup, tokens) ->
    @variable = markup.trim()
    super tagName, markup, tokens

  render: (context) ->
    value = context.variable(@variable) or= 0
    value = value - 1
    context.vaiable(@variable) = value
    value.toString()

Template.registerTag "decrement", Decrement
