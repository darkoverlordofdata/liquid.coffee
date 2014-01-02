#+--------------------------------------------------------------------+
#| case.coffee
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
Condition = require('../condition')
ElseCondition = require('../elsecondition')
Template = require('../template')
Utils = require('./utils')

module.exports = class Case extends Block

  tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)/
  tagWhenSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)(?:(?:\s+or\s+|\s*\,\s*)("[^"]+"|'[^']+'|[^\s,|]+.*))?/
  constructor: (tagName, markup, tokens) ->
    @blocks = []
    @nodelist = []
    parts = markup.match(@tagSyntax)
    if parts
      @left = parts[1]
    else
      throw ("Syntax error in 'case' - Valid syntax: case [condition]")
    super tagName, markup, tokens

  unknownTag: (tag, markup, tokens) ->
    switch tag
      when "when"
        @recordWhenCondition markup
      when "else"
        @recordElseCondition markup
      else
        super tag, markup, tokens

  render: (context) ->
    output = []
    execElseBlock = true

    context.stack =>
      i = 0

      while i < @blocks.length
        block = @blocks[i]
        if block.isElse
          output = Utils.flatten([output, @renderAll(block.attachment, context)]) if execElseBlock is true
          return output
        else if block.evaluate(context)
          execElseBlock = false
          output = Utils.flatten([output, @renderAll(block.attachment, context)])
        i++

    output

  recordWhenCondition: (markup) ->
    while markup
      parts = markup.match(@tagWhenSyntax)
      throw ("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ")  unless parts
      markup = parts[2]
      block = new Condition(@left, "==", parts[1])
      @blocks.push block
      @nodelist = block.attach([])

  recordElseCondition: (markup) ->
    throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")  unless (markup or "").trim() is ""
    block = new ElseCondition()
    @blocks.push block
    @nodelist = block.attach([])



Template.registerTag "case", Case
