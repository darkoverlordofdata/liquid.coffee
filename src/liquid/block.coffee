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
Liquid = require('../liquid')

class Liquid.Block extends Liquid.Tag

  IsTag             = ///^#{Liquid.TagStart.source}///
  IsVariable        = ///^#{Liquid.VariableStart.source}///
  FullToken         = ///^#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///
  ContentOfVariable = ///^#{Liquid.VariableStart.source}(.*)#{Liquid.VariableEnd.source}$///

  constructor: (tagName, markup, tokens) ->
    @blockName = tagName
    @blockDelimiter ="end#{@blockName}"
    super tagName, markup, tokens

  parse: (tokens) ->
    @nodelist or= []
    @nodelist.length = 0

    while (token = tokens.shift())?

      if IsTag.test token
        if $ = token.match(FullToken)

          # if we found the proper block delimitor just end parsing here and let the outer block
          # proceed
          if @blockDelimiter is $[1]
            @endTag()
            return

          # fetch the tag from registered blocks
          if tag = Liquid.Template.tags[$[1]]
            @nodelist.push new tag($[1], $[2], tokens)
          else
            # this tag is not registered with the system
            # pass it to the current block for special handling or error reporting
            @unknownTag $[1], $[2], tokens
        else
          throw new SyntaxError("Tag '#{token}' was not properly terminated with regexp: #{Liquid.TagEnd.source} ")
      else if IsVariable.test token
        @nodelist.push @createVariable(token)
      else if token is ''
        # pass
      else
        @nodelist.push token

    # Make sure that its ok to end parsing in the current block.
    # Effectively this method will throw and exception unless the current block is
    # of type Document
    @assertMissingDelimitation()


  endTag: ->

  unknownTag: (tag, params, tokens) ->
    if tag is "else"
      throw new SyntaxError("#{@blockName} tag does not expect else tag")
    else if tag is "end"
      throw new SyntaxError("'end' is not a valid delimiter for #{@blockName} tags. use #{@blockDelimiter}")
    else
      throw new SyntaxError("Unknown tag '#{tag}'")
    # switch tag
    #   when "else"
    #     throw new SyntaxError("#{@blockName} tag does not expect else tag")
    #   when "end"
    #     throw new SyntaxError("'end' is not a valid delimiter for #{@blockName} tags. use #{@blockDelimiter}")
    #   else
    #     throw new SyntaxError("Unknown tag '#{tag}'")

  createVariable: (token) ->
    if content = token.match(ContentOfVariable)
      new Liquid.Variable(content[1])
    else
      throw new Liquid.SyntaxError("Variable '#{token}' was not properly terminated with regexp: #{Liquid.VariableEnd.source} ")

  render: (context) ->
    @renderAll @nodelist, context

  renderAll: (list, context) ->
    output = []
    for token in list
      # Break out if we have any unhandled interrupts.
      break if context.hasInterrupt()

      try
        if token instanceof Liquid.Tags.Continue or token instanceof Liquid.Tags.Break
          context.pushInterrupt token.interrupt
          break

        output.push if token.render? then token.render(context) else token
      catch e
        context.handleError(e)
    output.join('')

  assertMissingDelimitation: ->
    throw new Liquid.SyntaxError("#{block_name} tag was never closed")



