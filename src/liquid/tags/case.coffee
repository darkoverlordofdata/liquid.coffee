#+--------------------------------------------------------------------+
#| case.coffee
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

class Liquid.Tags.Case extends Liquid.Block

  Syntax      =  ///(#{Liquid.StrictQuotedFragment.source})///
  WhenSyntax  =  ///(#{Liquid.StrictQuotedFragment.source})(?:(?:\s+or\s+|\s*\,\s*)(#{Liquid.StrictQuotedFragment.source}.*))?///

  constructor: (tagName, markup, tokens) ->
    @blocks = []
    @nodelist = []
    if $ = markup.match(Syntax)
      @left = $[1]
    else
      throw new Liquid.SyntaxError("Syntax error in 'case' - Valid syntax: case [condition]")
    super tagName, markup, tokens

  unknownTag: (tag, markup, tokens) ->
    @nodelist = []
    switch tag
      when "when"
        @recordWhenCondition markup
      when "else"
        @recordElseCondition markup
      else
        super tag, markup, tokens

  render: (context) ->
    output = ''
    context.stack =>
      execElseBlock = true

      #@blocks.forEach (block) =>
      for block in @blocks
        if block.else()
          if execElseBlock is true
            output += @renderAll(block.attachment, context)

        else if block.evaluate(context)
          execElseBlock = false
          output += @renderAll(block.attachment, context)
    output


  recordWhenCondition: (markup) ->
    while markup
      # Create a new nodelist and assign it to the new block
      if not ($ = markup.match(WhenSyntax))
        throw new Liquid.SyntaxError("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ")

      markup = $[2]
      block = new Liquid.Condition(@left, "==", $[1])
      block.attach @nodelist
      @blocks.push block

  recordElseCondition: (markup) ->
    unless (markup or "").trim() is ""
      throw new Liquid.SyntaxError("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")  unless (markup or "").trim() is ""

    block = new Liquid.ElseCondition()
    block.attach @nodelist
    @blocks.push block



Liquid.Template.registerTag "case", Liquid.Tags.Case
