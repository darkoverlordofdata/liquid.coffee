#+--------------------------------------------------------------------+
#| extends.coffee
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

Array.prototype.inject = (memo, iterator, context) ->
  @each (value, index) ->
    memo = iterator.call(context, memo, value, index, @)
  , @
  memo

class Liquid.Tags.Extends extends Liquid.Tag

  Syntax = ///(#{Liquid.QuotedFragment.source})///

  constructor: (tagName, markup, tokens) ->
    if ($ = Syntax.exec(markup))?
      @name = $[1]
    else
      throw new Liquid.SyntaxError("Syntax Error in 'block' - Valid syntax: extends [template]")

    super tagName, markup, tokens if tokens?

    @blocks = @nodelist.inject '', (m, node) =>
      if node instanceof Liquid.Tags.Block
        m[node.name] = node
        m

  parse: (tokens) ->
    @parseAll tokens

  render: (context) ->
    template = @loadTemplate(context)
    parent_blocks = @findBlocks(template.root)

    @blocks.forEach (name, block) =>
      if (pb = parent_blocks[name])?
        pb.parent = block.parent
        pb.addParent pb.nodelist
        pb.nodelist = block.nodelist
      else
        if @isExtending(template)
          template.root.nodelist.push block

    template.render context

  parseAll: (tokens) ->
    @nodelist or= []
    @nodelist.length = 0

    while (token = tokens.shift())?

      if ///^#{Liquid.TagStart.source}///.test token

        if ($ = token.match(///^#{Liquid.TagStart.source}\s*(\w+)\s*(.*)?#{Liquid.TagEnd.source}$///))?
          # fetch the tag from registered blocks
          if (tag = Liquid.Template.tags[$[1]])?
            @nodelist.push new tag($[1], $[2], tokens)
          else
            # this tag is not registered with the system
            # pass it to the current block for special handling or error reporting
            @unknownTag($[1], $[2], tokens)
        else
          throw new Liquid.SyntaxError("Tag '#{token}' was not properly terminated with regexp: #{Liquid.TagEnd.source} ")

        else if ($ = token.match(///^#{Liquid.VariableStart.source}///))?
          @nodelist.push @createVariable(token)

        else if token is ''
          # pass
        else
          @nodelist.push token


  loadTemplate: (context) ->
    source = Liquid.Template.fileSystem.readTemplateFile(context[@template_name])
    Liquid.Template.parse source

  findBlocks: (node, blocks={}) ->
    if node.respondTo(@nodelist)
      node.nodelist.inject(blocks) (b, node) =>
        if node instanceof Liquid.Tags.Block
          b[node.name] = node
        else
          @findBlocks node, b
        b
    blocks

  isExtending: (template) ->
    template.root.nodelist.any (node) =>
      node instanceof Extends


Liquid.Template.registerTag "extends", Liquid.Tags.Extends
