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

  class If extends Liquid.Block
    tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/
    constructor: (tag, markup, tokens) ->
      @nodelist = []
      @blocks = []
      @pushBlock "if", markup
      super tag, markup, tokens

    unknownTag: (tag, markup, tokens) ->
      if ["elsif", "else"].include(tag)
        @pushBlock tag, markup
      else
        super tag, markup, tokens

    render: (context) ->
      output = ""
      context.stack =>
        i = 0

        while i < @blocks.length
          block = @blocks[i]
          if block.evaluate(context)
            output = @renderAll(block.attachment, context)
            return
          i++

      [output].flatten().join ""

    pushBlock: (tag, markup) ->
      block = undefined
      if tag is "else"
        block = new Liquid.ElseCondition()
      else
        expressions = markup.split(/\b(and|or)\b/).reverse()
        expMatches = expressions.shift().match(@tagSyntax)
        throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
        condition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3])
        while expressions.length > 0
          operator = expressions.shift()
          expMatches = expressions.shift().match(@tagSyntax)
          throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
          newCondition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3])
          newCondition[operator] condition
          condition = newCondition
        block = condition
      block.attach []
      @blocks.push block
      @nodelist = block.attachment

    Liquid.Template.registerTag "if", If

  class Unless extends If
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

      [output].flatten().join ""

    Liquid.Template.registerTag "unless", Unless
