#+--------------------------------------------------------------------+
#| break.coffee
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

class Liquid.Tags.Break extends Liquid.Tag

  interrupt: ->
    new Liquid.BreakInterrupt

Liquid.Template.registerTag "break", Liquid.Tags.Break
