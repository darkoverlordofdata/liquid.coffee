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
Liquid = require('../../liquid')

class Liquid.Tags.Case extends Liquid.Block

  Syntax     = ///(#{QuotedFragment})///
  WhenSyntax = ///(#{QuotedFragment})(?:(?:\s+or\s+|\s*\,\s*)(#{QuotedFragment}.*))?///

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
        if block.else()
          output = [output, @renderAll(block.attachment, context)].flatten if execElseBlock is true
          return output
        else if block.evaluate(context)
          execElseBlock = false
          output = [output, @renderAll(block.attachment, context)].flatten
        i++

    output

  recordWhenCondition: (markup) ->
    while markup
      parts = markup.match(@tagWhenSyntax)
      throw ("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ")  unless parts
      markup = parts[2]
      block = new Liquid.Condition(@left, "==", parts[1])
      @blocks.push block
      @nodelist = block.attach([])

  recordElseCondition: (markup) ->
    throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")  unless (markup or "").trim() is ""
    block = new Liquid.ElseCondition()
    @blocks.push block
    @nodelist = block.attach([])



Liquid.Template.registerTag "case", Liquid.Tags.Case
