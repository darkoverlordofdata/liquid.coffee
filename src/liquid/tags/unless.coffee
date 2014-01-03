#+--------------------------------------------------------------------+
#| unless.coffee
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

class Liquid.Tags.Unless extends Liquid.Tags.If
  render: (context) ->
    output = ""
    context.stack =>

      # The first block is called if it evaluates to false...
      block = @blocks[0]
      unless block.evaluate(context)
        output = @renderAll(block.attachment, context)
        return

      # the rest are the same..
      i = 1

      while i < @blocks.length
        block = @blocks[i]
        if block.evaluate(context)
          output = @renderAll(block.attachment, context)
          return
        i++

    Liquid.Utils.flatten([output]).join ""

Liquid.Template.registerTag "unless", Liquid.Tags.Unless
