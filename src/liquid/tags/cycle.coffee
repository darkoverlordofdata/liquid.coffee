#+--------------------------------------------------------------------+
#| cycle.coffee
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

# Cycle is usually used within a loop to alternate between values, like colors or DOM classes.
#
#   {% for item in items %}
#     <div class="{% cycle 'red', 'green', 'blue' %}"> {{ item }} </div>
#   {% end %}
#
#    <div class="red"> Item one </div>
#    <div class="green"> Item two </div>
#    <div class="blue"> Item three </div>
#    <div class="red"> Item four </div>
#    <div class="green"> Item five</div>
#
class Liquid.Tags.Cycle extends Liquid.Tag

  SimpleSyntax = ///^#{Liquid.StrictQuotedFragment.source}///
  NamedSyntax  = ///^(#{Liquid.StrictQuotedFragment.source})\s*\:\s*(.*)///

  constructor: (tag, markup, tokens) ->

    if $ = markup.match(NamedSyntax)
      @variables = @variablesFromString($[2])
      @name = $[1]
    else if $ = markup.match(SimpleSyntax)
      @variables = @variablesFromString(markup)
      @name = "'#{@variables.toString()}'"
    else
      throw new Liquid.SyntaxError("Syntax error in 'cycle' - Valid syntax: cycle [name :] var [, var2, var3 ...]")
    super tag, markup, tokens

  render: (context) ->
    context.registers.cycle or= {}
    output = ''

    context.stack =>
      key = context.get(@name)
      iteration = context.registers.cycle[key] ? 0
      result = context.get(@variables[iteration])
      iteration += 1
      iteration  = 0  if iteration >= @variables.length
      context.registers.cycle[key] = iteration
      output = result

    output

#  variablesFromString: (markup) ->
#    markup.split(',').map (varname) ->
#      $ = varname.match(///\s*(#{Liquid.StrictQuotedFragment.source})\s*///)
#      if $[1] then $[1] else null

  variablesFromString: (markup) ->
    for varname in markup.split(',')
      $ = varname.match(///\s*(#{Liquid.StrictQuotedFragment.source})\s*///)
      if $[1] then $[1] else null

Liquid.Template.registerTag "cycle", Liquid.Tags.Cycle

