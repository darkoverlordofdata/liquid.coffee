#+--------------------------------------------------------------------+
#| if.coffee
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
Block = require('../block')
Template = require('../template')
Utils = require('./utils')

module.exports = class If extends Block
  tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/
  constructor: (tag, markup, tokens) ->
    @nodelist = []
    @blocks = []
    @pushBlock "if", markup
    super tag, markup, tokens

  unknownTag: (tag, markup, tokens) ->
    if tag in ["elsif", "else"]
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

    Utils.flatten([output]).join ""

  pushBlock: (tag, markup) ->
    block = undefined
    if tag is "else"
      block = new ElseCondition()
    else
      expressions = markup.split(/\b(and|or)\b/).reverse()
      expMatches = expressions.shift().match(@tagSyntax)
      throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
      condition = new Condition(expMatches[1], expMatches[2], expMatches[3])
      while expressions.length > 0
        operator = expressions.shift()
        expMatches = expressions.shift().match(@tagSyntax)
        throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
        newCondition = new Condition(expMatches[1], expMatches[2], expMatches[3])
        newCondition[operator] condition
        condition = newCondition
      block = condition
    block.attach []
    @blocks.push block
    @nodelist = block.attachment


Template.registerTag "if", If
