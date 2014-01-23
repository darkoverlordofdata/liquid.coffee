#+--------------------------------------------------------------------+
#| document.coffee
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

class Liquid.Document extends Liquid.Block

  # we don't need markup to open this block
  constructor: (tokens, options = {}) ->
    # There isn't a real delimter
    @blockDelimiter = []
    @options = options
    @parse tokens

  # Document blocks don't need to be terminated since they are not actually opened
  assertMissingDelimitation: ->