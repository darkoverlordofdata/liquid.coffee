#+--------------------------------------------------------------------+
#| raw.coffee
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

class Liquid.Tags.Raw extends Liquid.Block

  #FullTokenPossiblyInvalid = ///^(.*)#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///
  FullToken         = ///^#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///

  constructor: (tag, markup, tokens) ->
    super tag, markup, tokens

  parse: (tokens) ->
    @nodelist ||= []
    @nodelist.length = 0

    while (token = tokens.shift())?
      if $ = token.match(FullToken)
        if @blockDelimiter is $[1]
          @endTag()
          return

      @nodelist.push(token) if token?


Liquid.Template.registerTag "raw", Liquid.Tags.Raw
