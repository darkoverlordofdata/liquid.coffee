#+--------------------------------------------------------------------+
#| liquid.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013 - 2014
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
Liquid = require('../liquid')

class Liquid.Block extends Liquid.Tag

  IsTag             = ///^#{Liquid.TagStart.source}///
  IsVariable        = ///^#{Liquid.VariableStart.source}///
  FullToken         = ///^#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///
  ContentOfVariable = ///^#{Liquid.VariableStart.source}(.*)#{Liquid.VariableEnd.source}$///

  constructor: (tagName, markup, tokens) ->
    @blockName = tagName
    @blockDelimiter ="end#{@blockName}"
    @blank = false
    @children = []
    @warnings = []
    super tagName, markup, tokens

  parse: (tokens) ->
    @blank = true
    @nodelist or= []
    @nodelist.length = 0

    # All child tags of the current block.
    @children = []

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
            @nodelist.push new tag($[1], $[2], tokens, @options || {})
          else
            # this tag is not registered with the system
            # pass it to the current block for special handling or error reporting
            @unknownTag $[1], $[2], tokens
        else
          throw new SyntaxError("Tag '#{token}' was not properly terminated with regexp: #{Liquid.TagEnd.source} ")
      else if IsVariable.test token
        new_var = @createVariable(token)
        @nodelist.push new_var
        @children.push new_var
        @blank = false
      else if token is ''
        # pass
      else
        @nodelist.push token
        @blank = @blank && /\A\s*\z/.test(token)

    # Make sure that its ok to end parsing in the current block.
    # Effectively this method will throw and exception unless the current block is
    # of type Document
    @assertMissingDelimitation()

  # warnings of this block and all sub-tags
  setWarnings: ->
    all_warnings = []
    all_warnings.concat(@warnings) if @warnings

    for node in @children
      all_warnings.concat(node.warnings || [])

    all_warnings

  endTag: ->

  unknownTag: (tag, params, tokens) ->
    switch tag
      when "else"
        throw new SyntaxError("#{@blockName} tag does not expect else tag")
      when "end"
        throw new SyntaxError("'end' is not a valid delimiter for #{@blockName} tags. use #{@blockDelimiter}")
      else
        throw new SyntaxError("Unknown tag '#{tag}'")

  createVariable: (token) ->
    if content = token.match(ContentOfVariable)
      new Liquid.Variable(content[1])
    else
      throw new Liquid.SyntaxError("Variable '#{token}' was not properly terminated with regexp: #{Liquid.VariableEnd.source} ")

  render: (context) ->
    @renderAll @nodelist, context

  assertMissingDelimitation: ->
    throw new Liquid.SyntaxError("#{block_name} tag was never closed")

  renderAll: (list, context) ->
    output = []
    context.resourceLimits.renderLengthCurrent = 0
    context.resourceLimits.renderScoreCurrent += list.length

    for token in list
      # Break out if we have any unhanded interrupts.
      break if context.hasInterrupt()

      try
        # If we get an Interrupt that means the block must stop processing. An
        # Interrupt is any command that stops block execution such as {% break %}
        # or {% continue %}
        if token instanceof Liquid.Tags.Continue or token instanceof Liquid.Tags.Break
          context.pushInterrupt token.interrupt
          break

        token_output = if token.render? then token.render(context) else token
        context.incrementUsedResources 'renderLengthCurrent', token_output
        if context.resourceLimitsReached()
          context.resourceLimitsReached(true)
          throw new Liquid.MemoryError("Memory limits exceeded")
        unless token instanceof Liquid.Tags.Block and token.blank
          output.push token_output
      catch e
        if Liquid.MemoryError instanceof e
          throw e
        else
          output.push context.handleError(e)

    output.join('')




