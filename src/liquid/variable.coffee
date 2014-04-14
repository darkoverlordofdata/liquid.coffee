#+--------------------------------------------------------------------+
#| variable.coffee
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

# Holds variables. Variables are only loaded "just in time"
# and are not evaluated as part of the render stage
#
#   {{ monkey }}
#   {{ user.name }}
#
# Variables can be combined with filters:
#
#   {{ user | link }}
#
class Liquid.Variable

  FilterParser = ///(?:#{Liquid.FilterSeparator.source}|(?:\s*(?!(?:#{Liquid.FilterSeparator.source}))(?:#{Liquid.QuotedFragment.source}|\S+)\s*)+)///

  {compact, flatten} = require('./util')

  constructor: (markup) ->
    @markup = markup
    @name = null
    @filters = []

    if match = markup.match(///\s*(#{Liquid.QuotedFragment.source})(.*)///)
      @name = match[1]
      if match[2].match(///#{Liquid.FilterSeparator.source}\s*(.*)///)
        filters = match[2].match(///#{FilterParser.source}///g)
        #filters.forEach (f) =>
        for f in filters
          if matches = f.match(/\s*(\w+)/)
            filtername = matches[1]
            filterargs = f.split(///(?:#{Liquid.FilterArgumentSeparator}|#{Liquid.ArgumentSeparator})\s*(#{Liquid.QuotedFragment.source})///)
            filterargs.shift()
            filterargs.pop()
            @filters.push [filtername, compact(flatten(filterargs))]


  render: (context) ->
    return '' unless @name?
    output = context.get(@name)
    for filter in @filters
      filterargs = []
      for a in filter[1]
        filterargs.push context.get(a)

      try
        output = context.invoke(filter[0], output, filterargs...)
      catch e
        throw new Liquid.FilterNotFound("Error - filter '#{filter[0]}' in '#{@markup.trim()}' could not be found.")

    output
