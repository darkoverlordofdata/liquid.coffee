#+--------------------------------------------------------------------+
#| block.coffee
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

# see https://github.com/danwrong/liquid-inheritance/blob/master/lib/tags/block.rb

class Liquid.Tags.BlockDrop extends Liquid.Drop

  constructor: (@block) ->

  super: ->
    @block.callSuper @context


class Liquid.Tags.Block extends Liquid.Block

  Syntax = /(\w)+/

  parent: null
  name: ''

  constructor: (tagName, markup, tokens) ->
    if $ = markup.match(Syntax)
      @name = $[1]
    else
      throw new Liquid.SyntaxError("Syntax Error in 'block' - Valid syntax: block [name]")

    super tagName, markup, tokens if tokens?

  render: (context) ->
    context.stack =>
      context.set 'block', new Liquid.BlockDrop(@)
      @renderAll @nodelist, context

  addParent: (nodelist) ->
    if @parent?
      @parent.addParent nodelist
    else
      @parent = Liquid.Tags.Block(@tagName, @name)
      @parent.nodelist = nodelist

  callSuper: (context) ->
    if @parent?
      @parent.render(context)
    else
      ''


Liquid.Template.registerTag "block", Liquid.Tags.Block
