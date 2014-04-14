#+--------------------------------------------------------------------+
#| unless.coffee
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

# Unless is a conditional just like 'if' but works on the inverse logic.
#
#   {% unless x < 0 %} x is greater than zero {% end %}
#
class Liquid.Tags.Unless extends Liquid.Tags.If

  render: (context) ->
    output = ''
    context.stack =>

      # First condition is interpreted backwards ( if not )
      block = @blocks[0]
      unless block.evaluate(context)
        output = @renderAll(block.attachment, context)
        return

      # After the first condition unless works just like if
      for block in @blocks[1..-1]
        if block.evaluate(context)
          output = @renderAll(block.attachment, context)
          return

      ''
    output

Liquid.Template.registerTag "unless", Liquid.Tags.Unless
