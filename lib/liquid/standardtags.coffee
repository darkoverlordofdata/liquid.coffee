#+--------------------------------------------------------------------+
#| standardfilters.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2012
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# Liquid.StandardFilters
#
# Standard Filters
module.exports = (Liquid) ->

  hackObjectEach = (fun) -> #, thisp
    throw "Object.each requires first argument to be a function"  unless typeof fun is "function"
    i = 0
    thisp = arguments[1]
    for p of this
      value = this[p]
      pair = [p, value]
      pair.key = p
      pair.value = value
      fun.call thisp, pair, i, this
      i++
    null


  # Default Tags...
  Liquid.Template.registerTag "assign", class Assign extends Liquid.Tag
    tagSyntax: /((?:\(?[\w\-\.\[\]]\)?)+)\s*=\s*((?:"[^"]+"|'[^']+'|[^\s,|]+)+)/
    constructor: (tagName, markup, tokens) ->
      parts = markup.match(@tagSyntax)
      if parts
        @to = parts[1]
        @from = parts[2]
      else
        throw ("Syntax error in 'assign' - Valid syntax: assign [var] = [source]")
      super tagName, markup, tokens

    render: (context) ->
      context.scopes.last()[@to.toString()] = context.get(@from)
      ""


  # Cache is just like capture, but it inserts into the root scope...
  Liquid.Template.registerTag "cache", class Cache extends Liquid.Block
    tagSyntax: /(\w+)/
    constructor: (tagName, markup, tokens) ->
      parts = markup.match(@tagSyntax)
      if parts
        @to = parts[1]
      else
        throw ("Syntax error in 'cache' - Valid syntax: cache [var]")
      super tagName, markup, tokens

    render: (context) ->
      output = super(context)
      context.scopes.last()[@to] = [output].flatten().join("")
      ""

  Liquid.Template.registerTag "capture", class Capture extends Liquid.Block
    tagSyntax: /(\w+)/
    constructor: (tagName, markup, tokens) ->
      parts = markup.match(@tagSyntax)
      if parts
        @to = parts[1]
      else
        throw ("Syntax error in 'capture' - Valid syntax: capture [var]")
      super tagName, markup, tokens

    render: (context) ->
      output = super(context)
      context.set @to, [output].flatten().join("")
      ""

  Liquid.Template.registerTag "case", class Case extends Liquid.Block
    tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)/
    tagWhenSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)(?:(?:\s+or\s+|\s*\,\s*)("[^"]+"|'[^']+'|[^\s,|]+.*))?/
    constructor: (tagName, markup, tokens) ->
      @blocks = []
      @nodelist = []
      parts = markup.match(@tagSyntax)
      if parts
        @left = parts[1]
      else
        throw ("Syntax error in 'case' - Valid syntax: case [condition]")
      super tagName, markup, tokens

    unknownTag: (tag, markup, tokens) ->
      switch tag
        when "when"
          @recordWhenCondition markup
        when "else"
          @recordElseCondition markup
        else
          super tag, markup, tokens

    render: (context) ->
      output = []
      execElseBlock = true
      context.stack =>
        i = 0

        while i < @blocks.length
          block = @blocks[i]
          if block.isElse
            output = [output, @renderAll(block.attachment, context)].flatten()  if execElseBlock is true
            return output
          else if block.evaluate(context)
            execElseBlock = false
            output = [output, @renderAll(block.attachment, context)].flatten()
          i++

      output

    recordWhenCondition: (markup) ->
      while markup
        parts = markup.match(@tagWhenSyntax)
        throw ("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ")  unless parts
        markup = parts[2]
        block = new Liquid.Condition(@left, "==", parts[1])
        @blocks.push block
        @nodelist = block.attach([])

    recordElseCondition: (markup) ->
      throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")  unless (markup or "").strip() is ""
      block = new Liquid.ElseCondition()
      @blocks.push block
      @nodelist = block.attach([])

  Liquid.Template.registerTag "comment", class Comment extends Liquid.Block
    render: (context) ->
      ""

  Liquid.Template.registerTag "cycle", class Cycle extends Liquid.Tag
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


  Liquid.Template.registerTag "for", class For extends Liquid.Block
    tagSyntax: /(\w+)\s+in\s+((?:\(?[\w\-\.\[\]]\)?)+)/
    constructor: (tag, markup, tokens) ->
      matches = markup.match(@tagSyntax)
      if matches
        @variableName = matches[1]
        @collectionName = matches[2]
        @name = @variableName + "-" + @collectionName
        @attributes = {}
        attrmarkup = markup.replace(@tagSyntax, "")
        attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g)
        if attMatchs
          attMatchs.each ((pair) ->
            pair = pair.split(":")
            @attributes[pair[0].strip()] = pair[1].strip()
          ), this
      else
        throw ("Syntax error in 'for loop' - Valid syntax: for [item] in [collection]")
      super tag, markup, tokens

    render: (context) ->
      output = []
      collection = (context.get(@collectionName) or [])
      range = [0, collection.length]
      context.registers["for"] = {}  unless context.registers["for"]
      if @attributes["limit"] or @attributes["offset"]
        offset = 0
        limit = 0
        rangeEnd = 0
        segment = null
        if @attributes["offset"] is "continue"
          offset = context.registers["for"][@name]
        else
          offset = context.get(@attributes["offset"]) or 0
        limit = context.get(@attributes["limit"])
        rangeEnd = (if (limit) then offset + limit + 1 else collection.length)
        range = [offset, rangeEnd - 1]

        # Save the range end in the registers so that future calls to
        # offset:continue have something to pick up
        context.registers["for"][@name] = rangeEnd

      # Assumes the collection is an array like object...
      segment = collection.slice(range[0], range[1])
      return ""  if not segment or segment.length is 0
      context.stack =>
        length = segment.length
        segment.each (item, index) ->
          context.set @variableName, item
          context.set "forloop",
            name: @name
            length: length
            index: (index + 1)
            index0: index
            rindex: (length - index)
            rindex0: (length - index - 1)
            first: (index is 0)
            last: (index is (length - 1))

          output.push (@renderAll(@nodelist, context) or []).join("")


      [output].flatten().join ""

  Liquid.Template.registerTag "if", class If extends Liquid.Block
    tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/
    constructor: (tag, markup, tokens) ->
      @nodelist = []
      @blocks = []
      @pushBlock "if", markup
      super tag, markup, tokens

    unknownTag: (tag, markup, tokens) ->
      if ["elsif", "else"].include(tag)
        @pushBlock tag, markup
      else
        super tag, markup, tokens

    render: (context) ->
      output = ""
      context.stack =>
        i = 0

        while i < @blocks.length
          block = @blocks[i]
          if block.evaluate(context)
            output = @renderAll(block.attachment, context)
            return
          i++

      [output].flatten().join ""

    pushBlock: (tag, markup) ->
      block = undefined
      if tag is "else"
        block = new Liquid.ElseCondition()
      else
        expressions = markup.split(/\b(and|or)\b/).reverse()
        expMatches = expressions.shift().match(@tagSyntax)
        throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
        condition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3])
        while expressions.length > 0
          operator = expressions.shift()
          expMatches = expressions.shift().match(@tagSyntax)
          throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
          newCondition = new Liquid.Condition(expMatches[1], expMatches[2], expMatches[3])
          newCondition[operator] condition
          condition = newCondition
        block = condition
      block.attach []
      @blocks.push block
      @nodelist = block.attachment

  Liquid.Template.registerTag "ifchanged", class IfChanged extends Liquid.Block
    render: (context) ->
      output = ""
      context.stack =>
        results = @renderAll(@nodelist, context).join("")
        unless results is context.registers["ifchanged"]
          output = results
          context.registers["ifchanged"] = output

      output

  Liquid.Template.registerTag "include", class Include extends Liquid.Tag

    tagSyntax: /((?:"[^"]+"|'[^']+'|[^\s,|]+)+)(\s+(?:with|for)\s+((?:"[^"]+"|'[^']+'|[^\s,|]+)+))?/
    constructor: (tag, markup, tokens) ->
      matches = (markup or "").match(@tagSyntax)
      if matches
        @templateName = matches[1]
        @templateNameVar = @templateName.substring(1, @templateName.length - 1)
        @variableName = matches[3]
        @attributes = {}
        attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g)
        if attMatchs
          attMatchs.each ((pair) ->
            pair = pair.split(":")
            @attributes[pair[0].strip()] = pair[1].strip()
          ), this
      else
        throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]")
      super tag, markup, tokens

    render: (context) ->
      source = Liquid.readTemplateFile(context.get(@templateName))
      partial = Liquid.parse(source)
      variable = context.get((@variableName or @templateNameVar))
      output = ""
      context.stack =>

        # HACK Until we get Object.each working right
        @attributes.each = hackObjectEach
        @attributes.each (pair) ->
          context.set pair.key, context.get(pair.value)

        if variable instanceof Array
          output = variable.map((variable) ->
            context.set @templateNameVar, variable
            partial.render context
          )
        else
          context.set @templateNameVar, variable
          output = partial.render(context)

      output = [output].flatten().join("")
      output

  Liquid.Template.registerTag "unless", class Unless extends If
    render: (context) ->
      output = ""
      context.stack =>

        # The first block is called if it evaluates to false...
        block = @blocks[0]
        unless block.evaluate(context)
          output = @renderAll(block.attachment, context)
          return

        # the rest are the same..
        i = 1

        while i < @blocks.length
          block = @blocks[i]
          if block.evaluate(context)
            output = @renderAll(block.attachment, context)
            return
          i++

      [output].flatten().join ""
