#+--------------------------------------------------------------------+
#| drop.coffee
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

  class Drop

    setContext: (context) ->
      @context = context

    beforeMethod: (method) ->

    invokeDrop: (method) ->
      results = @beforeMethod()
      results = this[method].apply(this)  if not results and (method of this)
      results

    hasKey: (name) ->
      true
