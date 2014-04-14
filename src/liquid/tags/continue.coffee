#+--------------------------------------------------------------------+
#| continue.coffee
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

class Liquid.Tags.Continue extends Liquid.Tag

  interrupt: ->
    new Liquid.ContinueInterrupt

Liquid.Template.registerTag "continue", Liquid.Tags.Continue
