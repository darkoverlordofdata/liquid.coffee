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
# Case Tag
#

module.exports = (Liquid) ->

  class Cycle extends Liquid.Tag

    tagSimpleSyntax: /"[^"]+"|'[^']+'|[^\s,|]+/
    tagNamedSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*\:\s*(.*)/
    constructor: (tag, markup, tokens) ->
      matches = undefined
      variables = undefined

      # Named first...
      matches = markup.match(@tagNamedSyntax)
      if matches
        @variables = @variablesFromString(matches[2])
        @name = matches[1]
      else

        # Try simple...
        matches = markup.match(@tagSimpleSyntax)
        if matches
          @variables = @variablesFromString(markup)
          @name = "'" + @variables.toString() + "'"
        else

          # Punt
          throw ("Syntax error in 'cycle' - Valid syntax: cycle [name :] var [, var2, var3 ...]")
      super tag, markup, tokens

    render: (context) ->
      key = context.get(@name)
      output = ""
      context.registers["cycle"] = {}  unless context.registers["cycle"]
      context.registers["cycle"][key] = 0  unless context.registers["cycle"][key]
      context.stack =>
        iter = context.registers["cycle"][key]
        results = context.get(@variables[iter])
        iter += 1
        iter = 0  if iter is @variables.length
        context.registers["cycle"][key] = iter
        output = results

      output

    variablesFromString: (markup) ->
      markup.split(",").map (varname) ->
        match = varname.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)\s*/)
        (if (match[1]) then match[1] else null)

    Liquid.Template.registerTag "cycle", Cycle