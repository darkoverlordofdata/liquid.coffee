#+--------------------------------------------------------------------+
#| capture.coffee
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
# Capture Tag
#

module.exports = (Liquid) ->

  class Capture extends Liquid.Block

    tagSyntax: /(\w+)/
    constructor: (tagName, markup, tokens) ->
      parts = markup.match(@tagSyntax)
      if parts
        @to = parts[1]
      else
        throw ("Syntax error in 'capture' - Valid syntax: capture [var]")
      super tagName, markup, tokens

    render: (context) ->
      output = super(context)
      context.set @to, [output].flatten().join("")
      ""

    Liquid.Template.registerTag "capture", Capture
