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

class Liquid.Tags.Extends  extends Liquid.Block

  Syntax            = ///(#{Liquid.QuotedFragment.source})///
  IsTag             = ///^#{Liquid.TagStart.source}///
  IsVariable        = ///^#{Liquid.VariableStart.source}///
  FullToken         = ///^#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///
  ContentOfVariable = ///^#{Liquid.VariableStart.source}(.*)#{Liquid.VariableEnd.source}$///

  constructor: (tagName, markup, tokens) ->

    if ($ = markup.match(Syntax))
      @templateName = $[1]
    else
      throw new Liquid.SyntaxError("Syntax Error in 'extends' - Valid syntax: extends [template]")
    super

    m = {}
    for node in @nodelist
      m[node.name] = node if node instanceof Liquid.Tags.Block
    @blocks = m

  parse: (tokens) ->
    @parseAll tokens


  render: (context) ->
    template = @loadTemplate(context)
    parentBlocks = @findBlocks(template.root)

    for name, block of @blocks
      if (pb = parentBlocks[name])?
        pb.parent = block.parent
        pb.addParent pb.nodelist
        pb.nodelist = block.nodelist
      else
        if @isExtending(template)
          template.root.nodelist.push block

    template.render(context)

  parseAll: (tokens) ->
    @nodelist ||= []
    @nodelist.length = 0

    while (token = tokens.shift())?
      if IsTag.test token
        if ($ = token.match(FullToken))
          # fetch the tag from registered blocks
          if tag = Liquid.Template.tags[$[1]]
            @nodelist.push new tag($[1], $[2], tokens)
          else
            # this tag is not registered with the system
            # pass it to the current block for special handling or error reporting
            @unknownTag $[1], $[2], tokens
        else
          throw new Liquid.SyntaxError("Tag '#{token}' was not properly terminated with regexp: #{TagEnd.inspect} ")
      else if IsVariable.test token
        @nodelist.push @createVariable(token)
      else if token is  ''
        # pass
      else
        @nodelist.push token

  loadTemplate: (context) ->
    source = Liquid.Template.fileSystem.readTemplateFile(context.get(@templateName))
    Liquid.Template.parse source

  findBlocks: (node, blocks={}) ->
    if node.nodelist?
      b = blocks
      for node in node.nodelist
        if node instanceof Liquid.Tags.Block
          b[node.name] = node
        else
          @findBlocks(node, b)
        b
    blocks

  isExtending: (template) ->
    for node in template.root.nodelist
      return true if node instanceof Extends
    false

Liquid.Template.registerTag "extends", Liquid.Tags.Extends
