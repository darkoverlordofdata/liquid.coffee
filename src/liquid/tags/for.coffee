#+--------------------------------------------------------------------+
#| for.coffee
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

# "For" iterates over an array or collection.
# Several useful variables are available to you within the loop.
#
# == Basic usage:
#    {% for item in collection %}
#      {{ forloop.index }}: {{ item.name }}
#    {% endfor %}
#
# == Advanced usage:
#    {% for item in collection %}
#      <div {% if forloop.first %}class="first"{% endif %}>
#        Item {{ forloop.index }}: {{ item.name }}
#      </div>
#    {% endfor %}
#
# You can also define a limit and offset much like SQL.  Remember
# that offset starts at 0 for the first item.
#
#    {% for item in collection limit:5 offset:10 %}
#      {{ item.name }}
#    {% end %}
#
#  To reverse the for loop simply use {% for item in collection reversed %}
#
# == Available variables:
#
# forloop.name:: 'item-collection'
# forloop.length:: Length of the loop
# forloop.index:: The current item's position in the collection;
#                 forloop.index starts at 1.
#                 This is helpful for non-programmers who start believe
#                 the first item in an array is 1, not 0.
# forloop.index0:: The current item's position in the collection
#                  where the first item is 0
# forloop.rindex:: Number of items remaining in the loop
#                  (length - index) where 1 is the last item.
# forloop.rindex0:: Number of items remaining in the loop
#                   where 0 is the last item.
# forloop.first:: Returns true if the item is the first item.
# forloop.last:: Returns true if the item is the last item.
#
class Liquid.Tags.For extends Liquid.Block

  Syntax = ///(\w+)\s+in\s+(#{Liquid.StrictQuotedFragment.source})\s*(reversed)?///


  constructor: (tag, markup, tokens) ->
    if $ = markup.match(Syntax)
      @variableName = $[1]
      @collectionName = $[2]
      @name = "#{$[1]}-#{$[2]}"
      @reversed = $[3]
      @attributes = {}
      markup.replace Liquid.TagAttributes, ($0, key, value) =>
        @attributes[key] = value
    else
      throw new Liquid.SyntaxError("Syntax Error in 'for loop' - Valid syntax: for [item] in [collection]")
    super tag, markup, tokens

  render: (context) ->
    context.registers.for = {} unless context.registers.for?

    collection = context.get(@collectionName)

    #return '' unless Array.isArray(collection)
    unless Array.isArray(collection)
        collection = ({key:k,value:v} for k,v of collection)

    from = if @attributes['offset'] is 'continue'
     context.registers.for[@name]
    else
      context.get(@attributes['offset'])

    limit = context.get(@attributes['limit'])
    to    = if limit then (limit + from) else collection.length

    segment = collection.slice(from, to)

    return '' if segment.length is 0

    segment.reverse() if @reversed

    result = ''

    length = segment.length

    # Store our progress through the collection for the continue flag
    context.registers.for[@name] = from + segment.length
    context.stack =>
      #segment.forEach (item, index) =>
      for item, index in segment
        context.set @variableName, item
        context.set 'forloop',
            name    : @name
            length  : length
            index   : index + 1
            index0  : index
            rindex  : length - index
            rindex0 : length - index - 1
            first   : (index is 0)
            last    : (index is length - 1)

        result += @renderAll(@nodelist, context)
        # Handle any interrupts if they exist.
        if context.hasInterrupt()
            interrupt = context.popInterrupt()
            break if interrupt instanceof Liquid.BreakInterrupt
            continue if interrupt instanceof Liquid.ContinueInterrupt
            #segment.length = 0 if interrupt instanceof Liquid.BreakInterrupt
            #return if interrupt instanceof Liquid.ContinueInterrupt


    result



Liquid.Template.registerTag "for", Liquid.Tags.For
