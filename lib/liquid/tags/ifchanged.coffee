#+--------------------------------------------------------------------+
#| case.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2012
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# Case Tag
#

module.exports = (Liquid) ->

  class IfChanged extends Liquid.Block

    render: (context) ->
      output = ""
      context.stack =>
        results = @renderAll(@nodelist, context).join("")
        unless results is context.registers["ifchanged"]
          output = results
          context.registers["ifchanged"] = output

      output

    Liquid.Template.registerTag "ifchanged", IfChanged
