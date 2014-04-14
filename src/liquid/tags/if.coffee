#+--------------------------------------------------------------------+
#| if.coffee
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

# If is the conditional block
#
#   {% if user.admin %}
#     Admin user!
#   {% else %}
#     Not admin user
#   {% endif %}
#
#    There are {% if count < 5 %} less {% else %} more {% endif %} items than you need.
#
#
class Liquid.Tags.If extends Liquid.Block

  SyntaxHelp = "Syntax Error in tag 'if' - Valid syntax: if [expression]"
  Syntax = ///(#{Liquid.StrictQuotedFragment.source})\s*([=!<>a-z_]+)?\s*(#{Liquid.StrictQuotedFragment.source})?///
  ExpressionsAndOperators = ///(?:\b(?:\s?and\s?|\s?or\s?)\b|(?:\s*(?!\b(?:\s?and\s?|\s?or\s?)\b)(?:#{Liquid.StrictQuotedFragment.source}|\S+)\s*)+)///g

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
    output = ''
    context.stack =>
      for block in @blocks
        if block.evaluate(context)
          output = @renderAll(block.attachment, context)
          return
      ''
    output


  pushBlock: (tag, markup) ->
    block = if tag is 'else'
      new Liquid.ElseCondition
    else

      expressions = markup.match(ExpressionsAndOperators).reverse()

      throw new Liquid.SyntaxError(SyntaxHelp) unless $ = expressions.shift().match(Syntax)

      condition = new Liquid.Condition($[1], $[2], $[3])

      while expressions.length > 0
        operator = expressions.shift()

        throw new Liquid.SyntaxError(SyntaxHelp) unless expressions.shift().match(Syntax)

        newCondition = new Liquid.Condition($[1], $[2], $[3])
        newCondition[operator] condition
        condition = newCondition

      condition

    @blocks.push(block)
    @nodelist = block.attach([])


Liquid.Template.registerTag "if", Liquid.Tags.If
