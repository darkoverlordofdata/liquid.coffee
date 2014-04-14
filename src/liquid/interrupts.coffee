#+--------------------------------------------------------------------+
#| interrupt.coffee
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

class Liquid.Interrupt

  message: ''

  constructor: (@message = 'interrupt') ->

class Liquid.BreakInterrupt extends Liquid.Interrupt

class Liquid.ContinueInterrupt extends Liquid.Interrupt
