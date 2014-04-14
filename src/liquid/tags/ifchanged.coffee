#+--------------------------------------------------------------------+
#| liquid.coffee
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

class Liquid.Tags.IfChanged extends Liquid.Block

  render: (context) ->
    output = ""
    context.stack =>
      output = @renderAll(@nodelist, context)
      if output isnt context.registers.ifchanged
        context.registers.ifchanged = output
      else
        output = ''

    output


Liquid.Template.registerTag "ifchanged", Liquid.Tags.IfChanged
