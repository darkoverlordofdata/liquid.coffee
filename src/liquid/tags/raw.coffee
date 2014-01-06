#+--------------------------------------------------------------------+
#| raw.coffee
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
Liquid = require('../../liquid')

class Liquid.Tags.Raw extends Liquid.Block

  FullTokenPossiblyInvalid = ///^(.*)#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///

  parse: (tokens) ->
    @nodelist or= []
    @nodelist.length = 0

    while (token = tokens.shift())?

      if ($ = token.match(FullTokenPossiblyInvalid))?
        @nodelist.push($[1]) if $[1] isnt ''
        if @blockDelimiter() is $[2]
          @endTag()
          return

      @nodelist.push(token) if token?

Liquid.Template.registerTag "raw", Liquid.Tags.Raw
