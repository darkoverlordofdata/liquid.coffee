#+--------------------------------------------------------------------+
#| elsecondition.coffee
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
Liquid = require('../liquid')

class Liquid.ElseCondition extends Liquid.Condition
  isElse: true
  evaluate: (context) ->
    true

  toString: ->
    "<ElseCondition>"
