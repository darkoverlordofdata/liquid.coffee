#+--------------------------------------------------------------------+
#| document.coffee
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
module.exports = (Liquid) ->

  class Document extends Liquid.Block

    constructor: (tokens) ->
      @blockDelimiter = [] # [], really?
      @parse tokens

    assertMissingDelimitation: ->
    # Documents don't need to assert this...
