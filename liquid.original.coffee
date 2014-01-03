#+--------------------------------------------------------------------+
#| liquid.coffee
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
# Liquid
#
strftime = require('strftime')


#
# flatten a nested list
#
# @param  [Array] list  nested list
# @return [Array] the flattened list
#
_flatten = ($list) ->

  return [] unless $list?

  $a = []
  for $item in $list
    if Array.isArray($item)
      $a = $a.concat _flatten($item)
    else
      $a.push $item
  return $a

class BlankFileSystem
  readTemplateFile: (path) ->
    throw ("This liquid context does not allow includes.")


class Tag

  constructor: (tagName, markup, tokens) ->
    @tagName = tagName
    @markup = markup
    @nodelist = @nodelist or []
    @parse tokens

  parse: (tokens) ->

  render: (context) ->
    ""


class Block extends Tag

  IsTag             = /^\{\%/
  IsVariable        = /^\{\{/
  FullToken         = /^\{\%\s*(\w+)\s*(.*)?\%\}$/
  ContentOfVariable = /^\{\{(.*)\}\}$/

  constructor: (tagName, markup, tokens) ->
    @blockName = tagName
    @blockDelimiter = "end" + @blockName
    super tagName, markup, tokens

  parse: (tokens) ->

    # NOTE Don't just blindly re-initialize nodelist; inherited classes may
    # share this through pointers; specifically If points _nodelist at the
    # blocks attachment, so we need to leave that pointer to pickup stuff.
    @nodelist or= []
    @nodelist.length = 0
    token = tokens.shift()
    tokens.push "" # To ensure we don't lose the last token passed in...
    while tokens.length

      if IsTag.test token
        if (tagParts = token.match(FullToken))?

          # if we found the proper block delimitor just end parsing here and let the outer block proceed
          if @blockDelimiter is tagParts[1]
            @endTag()
            return
          if tagParts[1] of Template.tags
            @nodelist.push new Template.tags[tagParts[1]](tagParts[1], tagParts[2], tokens)
          else
            @unknownTag tagParts[1], tagParts[2], tokens
        else
          throw ("Tag '" + token + "' was not properly terminated with: %}")

      else if IsVariable.test token
        @nodelist.push @createVariable(token)

      else #if(token != '') {
        @nodelist.push token
      # Ignores tokens that are empty
      token = tokens.shift() # Assign the next token to loop again...

    # Effectively this method will throw and exception unless the current block is of type Document
    @assertMissingDelimitation()

  endTag: ->

  unknownTag: (tag, params, tokens) ->
    switch tag
      when "else"
        throw (@blockName + " tag does not expect else tag")
      when "end"
        throw ("'end' is not a valid delimiter for " + @blockName + " tags. use " + @blockDelimiter)
      else
        throw ("Unknown tag: " + tag)

  createVariable: (token) ->
    if (match = token.match(ContentOfVariable))?
      new Variable(match[1])
    else
      throw ("Variable '" + token + "' was not properly terminated with: }}")

  render: (context) ->
    @renderAll @nodelist, context

  renderAll: (list, context) ->
    (list or []).map (token, i) ->
      output = ""
      try # hmmm... feels a little heavy
        output = (if (token["render"]) then token.render(context) else token)
      catch e
        output = context.handleError(e)
      output


  assertMissingDelimitation: ->
    throw (@blockName + " tag was never closed")



class Document extends Block

  constructor: (tokens) ->
    @blockDelimiter = [] # [], really?
    @parse tokens

  assertMissingDelimitation: ->

# Documents don't need to assert this...


class Strainer

  @filters = {}
  @globalFilter = (filters) ->
    for f of filters
      Strainer.filters[f] = filters[f]


  # Array of methods to keep...
  @requiredMethods = ["respondTo", "context"]
  @create = (context) ->
    strainer = new Strainer(context)
    for f of Strainer.filters

      #console.log('f', f);
      #console.log('Strainer.filters[f]', Strainer.filters[f]);
      strainer[f] = Strainer.filters[f]
    strainer

  constructor: (context) ->
    @context = context

  respondTo: (methodName) ->
    methodName = methodName.toString()
    return false  if methodName.match(/^__/)
    return false  if methodName in Strainer.requiredMethods

    if @[methodName]? then true else false


class Context

  constructor: (assigns, registers, rethrowErrors) ->
    @scopes = [(if assigns then assigns else {})]
    @registers = (if registers then registers else {})
    @errors = []
    @rethrowErrors = rethrowErrors
    @strainer = Strainer.create(this)

  get: (varname) ->
    @resolve varname

  set: (varname, value) ->
    @scopes[0][varname] = value

  hasKey: (key) ->
    (if (@resolve(key)) then true else false)

  push: ->
    scpObj = {}
    @scopes.unshift scpObj
    scpObj # Is this right?

  merge: (newScope) ->

    for key, val of newScope
      @scopes[0][key] = val

  pop: ->
    throw "Context stack error"  if @scopes.length is 1
    @scopes.shift()

  stack: (lambda, bind) ->
    result = null
    @push()
    try
      result = lambda.apply((if bind then bind else @strainer))
    finally
      @pop()
    result

  invoke: (method, args) ->
    if @strainer.respondTo(method)

      # console.log('found method '+ method);
      # console.log("INVOKE: "+ method);
      # console.log('args', args);
      result = @strainer[method].apply(@strainer, args)

      # console.log("result: "+ result);
      result
    else
      (if (args.length is 0) then null else args[0]) # was: $pick

  resolve: (key) ->
    switch key
      when null, "nil", "null", ""
        null
      when "true"
        true
      when "false"
        false

      # Not sure what to do with (what would be) Symbols
      when "blank", "empty"
        ""
      else
        if (/^'(.*)'$/).test(key) # Single quoted strings
          key.replace /^'(.*)'$/, "$1"
        else if (/^"(.*)"$/).test(key) # Double quoted strings
          key.replace /^"(.*)"$/, "$1"
        else if (/^(\d+)$/).test(key) # Integer...
          parseInt key.replace(/^(\d+)$/, "$1")
        else if (/^(\d[\d\.]+)$/).test(key) # Float...
          parseFloat key.replace(/^(\d[\d\.]+)$/, "$1")
        else if (/^\((\S+)\.\.(\S+)\)$/).test(key) # Ranges
          # JavaScript doesn't have native support for those, so I turn 'em
          # into an array of integers...
          range = key.match(/^\((\S+)\.\.(\S+)\)$/)
          left = parseInt(range[1])
          right = parseInt(range[2])
          arr = []

          # Check if left and right are NaN, if so try as characters
          if isNaN(left) or isNaN(right)

            # TODO Add in error checking to make sure ranges are single
            # character, A-Z or a-z, etc.
            left = range[1].charCodeAt(0)
            right = range[2].charCodeAt(0)
            limit = right - left + 1
            i = 0

            while i < limit
              arr.push String.fromCharCode(i + left)
              i++
          else # okay to make array
            limit = right - left + 1
            i = 0

            while i < limit
              arr.push i + left
              i++
          arr
        else
          result = @variable(key)

          # console.log("Finding variable: "+ key)
          # console.log(Object.inspect(result))
          result

  findVariable: (key) ->
    i = 0

    while i < @scopes.length
      scope = @scopes[i]
      if scope and typeof (scope[key]) isnt "undefined"
        variable = scope[key]
        if typeof (variable) is "function"
          variable = variable.apply(this)
          scope[key] = variable
        variable = variable.toLiquid()  if variable and typeof (variable) is "object" and ("toLiquid" of variable)
        variable.setContext self  if variable and typeof (variable) is "object" and ("setContext" of variable)
        return variable
      i++

    #    console.log('findVariable("'+ key +'") is returning NULL')
    null

  variable: (markup) ->

    #return this.scopes[0][key] || ''

    #  console.log('markup('+ Object.inspect(markup) +') was unexpected, returning NULL')
    return null  unless typeof markup is "string"
    parts = markup.match(/\[[^\]]+\]|(?:[\w\-]\??)+/g)
    firstPart = parts.shift()
    squareMatch = firstPart.match(/^\[(.*)\]$/)
    firstPart = @resolve(squareMatch[1])  if squareMatch
    object = @findVariable(firstPart)
    self = this

    # Does 'pos' need to be scoped up here?
    if object
      parts.forEach (part) ->

        # If object is a hash we look for the presence of the key and if its available we return it
        squareMatch = part.match(/^\[(.*)\]$/)
        if squareMatch
          part = self.resolve(squareMatch[1])

          # Where the hell does 'pos' come from?
          object[part] = object[part].apply(this)  if typeof (object[part]) is "function" # Array?
          object = object[part]
          object = object.toLiquid()  if typeof (object) is "object" and ("toLiquid" of object)
        else

          # Hash
          if (typeof (object) is "object" or typeof (object) is "hash") and (part of object)

            # if its a proc we will replace the entry in the hash table with the proc
            res = object[part]
            res = object[part] = res.apply(self)  if typeof (res) is "function"
            if typeof (res) is "object" and ("toLiquid" of res)
              object = res.toLiquid()
            else
              object = res

          # Array
          else if (/^\d+$/).test(part)
            pos = parseInt(part)
            object[pos] = object[pos].apply(self)  if typeof (object[pos]) is "function"
            if typeof (object[pos]) is "object" and typeof (object[pos]) is "object" and ("toLiquid" of object[pos])
              object = object[pos].toLiquid()
            else
              object = object[pos]

          # Some special cases. If no key with the same name was found we interpret following calls
          # as commands and call them on the current object if it exists
          else if object and typeof (object[part]) is "function" and part in ["length", "size", "first", "last"]

            object = object[part].apply(part)
            object = object.toLiquid()  if "toLiquid" of object

          # No key was present with the desired value and it wasn't one of the directly supported
          # keywords either. The only thing we got left is to return nil
          else
            return object = null
          object.setContext self  if typeof (object) is "object" and ("setContext" of object)

    object

  addFilters: (filters) ->
    filters = _flatten(filters)
    filters.forEach (f) ->
      throw ("Expected object but got: " + typeof (f))  unless typeof (f) is "object"
      @strainer.addMethods f


  handleError: (err) ->
    @errors.push err
    throw err  if @rethrowErrors
    "Liquid error: " + ((if err.message then err.message else ((if err.description then err.description else err))))



class Template

  @fileSystem = new BlankFileSystem()
  @tags = {}
  @registerTag = (name, klass) ->
    Template.tags[name] = klass

  @registerFilter = (filters) ->
    Strainer.globalFilter filters

  @tokenize = (src) ->
    tokens = src.split(/(\{\%.*?\%\}|\{\{.*?\}\}?)/)

    # removes the rogue empty element at the beginning of the array
    tokens.shift()  if tokens[0] is ""

    #  console.log("Source tokens:", tokens)
    tokens

  @parse = (src) ->
    (new Template).parse src


  constructor: ->
    @root = null
    @registers = {}
    @assigns = {}
    @errors = []
    @rethrowErrors = false

  parse: (src) ->
    @root = new Document(Template.tokenize(src))
    this

  render: ->
    return ""  unless @root
    args =
      ctx: arguments[0]
      filters: arguments[1]
      registers: arguments[2]

    context = null
    if args.ctx instanceof Context
      context = args.ctx
      @assigns = context.assigns
      @registers = context.registers

    else
      for key, val of args.ctx
        @assigns[key] = val
      for key, val of args.registers
        @registers[key] = val

      context = new Context(@assigns, @registers, @rethrowErrors)

    context.addFilters arg.filters  if args.filters
    try
      return @root.render(context).join("")
    finally
      @errors = context.errors

  renderWithErrors: ->
    savedRethrowErrors = @rethrowErrors
    @rethrowErrors = true
    res = @render.apply(this, arguments)
    @rethrowErrors = savedRethrowErrors
    res



class Variable

  constructor: (markup) ->
    @markup = markup
    @name = null
    @filters = []
    self = this
    match = markup.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)/)
    if match
      @name = match[1]
      filterMatches = markup.match(/\|\s*(.*)/)
      if filterMatches
        filters = filterMatches[1].split(/\|/)
        filters.forEach (f) ->
          matches = f.match(/\s*(\w+)/)
          if matches
            filterName = matches[1]
            filterArgs = []
            _flatten(f.match(/(?:[:|,]\s*)("[^"]+"|'[^']+'|[^\s,|]+)/g) or []).forEach (arg) ->
              cleanupMatch = arg.match(/^[\s|:|,]*(.*?)[\s]*$/)
              filterArgs.push cleanupMatch[1]  if cleanupMatch

            self.filters.push [filterName, filterArgs]


  render: (context) ->
    return ""  unless @name?
    output = context.get(@name)
    @filters.forEach (filter) ->
      filterName = filter[0]
      filterArgs = (filter[1] or []).map((arg) ->
        context.get arg
      )
      filterArgs.unshift output # Push in input value into the first argument spot...
      output = context.invoke(filterName, filterArgs)

    output



class Condition

  @operators =
    "==": (l, r) ->
      l is r

    "=": (l, r) ->
      l is r

    "!=": (l, r) ->
      l isnt r

    "<>": (l, r) ->
      l isnt r

    "<": (l, r) ->
      l < r

    ">": (l, r) ->
      l > r

    "<=": (l, r) ->
      l <= r

    ">=": (l, r) ->
      l >= r

    contains: (l, r) ->
      l.match r


    hasKey: (l, r) ->
      l[r]?


  #'hasValue': function(l,r) { return l.hasValue(r); }
    hasValue: (l, r) ->
      for p of l
        return true  if l[p] is r
      false


  constructor: (left, operator, right) ->
    @left = left
    @operator = operator
    @right = right
    @childRelation = null
    @childCondition = null
    @attachment = null

  evaluate: (context) ->
    context = context or new Context()
    result = @interpretCondition(@left, @right, @operator, context)
    switch @childRelation
      when "or"
        result or @childCondition.evaluate(context)
      when "and"
        result and @childCondition.evaluate(context)
      else
        result

  or: (condition) ->
    @childRelation = "or"
    @childCondition = condition

  and: (condition) ->
    @childRelation = "and"
    @childCondition = condition

  attach: (attachment) ->
    @attachment = attachment
    @attachment

  isElse: false
  interpretCondition: (left, right, op, context) ->

    # If the operator is empty this means that the decision statement is just
    # a single variable. We can just pull this variable from the context and
    # return this as the result.
    return context.get(left)  unless op
    left = context.get(left)
    right = context.get(right)
    op = Condition.operators[op]
    throw ("Unknown operator " + op)  unless op
    results = op(left, right)
    results

  toString: ->
    "<Condition " + @left + " " + @operator + " " + @right + ">"


class ElseCondition extends Condition
  isElse: true
  evaluate: (context) ->
    true

  toString: ->
    "<ElseCondition>"

class Drop

  setContext: (context) ->
    @context = context

  beforeMethod: (method) ->

  invokeDrop: (method) ->
    results = @beforeMethod()
    results = this[method].apply(this)  if not results and (method of this)
    results

  hasKey: (name) ->
    true



Template.registerFilter
  size: (iterable) ->
    (if (iterable["length"]) then iterable.length else 0)

  downcase: (input) ->
    input.toString().toLowerCase()

  upcase: (input) ->
    input.toString().toUpperCase()

  capitalize: (input) ->
    str = input.toString()
    str.charAt(0).toUpperCase() + str.substring(1).toLowerCase()

  escape: (input) ->

    # FIXME: properly HTML escape input...
    input = input.toString()
    input = input.replace(/&/g, "&amp;")
    input = input.replace(/</g, "&lt;")
    input = input.replace(/>/g, "&gt;")
    input = input.replace(/"/g, "&quot;")
    input

  h: (input) ->

    # FIXME: properly HTML escape input...
    input = input.toString()
    input = input.replace(/&/g, "&amp;")
    input = input.replace(/</g, "&lt;")
    input = input.replace(/>/g, "&gt;")
    input = input.replace(/"/g, "&quot;")
    input

  truncate: (input, length, string) ->
    return ""  if not input or input is ""
    length = length or 50
    string = string or "..."
    seg = input.slice(0, length)
    (if input.length > length then input.slice(0, length) + string else input)

  truncatewords: (input, words, string) ->
    return ""  if not input or input is ""
    words = parseInt(words or 15)
    string = string or "..."
    wordlist = input.toString().split(" ")
    l = Math.max((words), 0)
    (if (wordlist.length > l) then wordlist.slice(0, l).join(" ") + string else input)

  truncate_words: (input, words, string) ->
    return ""  if not input or input is ""
    words = parseInt(words or 15)
    string = string or "..."
    wordlist = input.toString().split(" ")
    l = Math.max((words), 0)
    (if (wordlist.length > l) then wordlist.slice(0, l).join(" ") + string else input)

  strip_html: (input) ->
    input.toString().replace /<.*?>/g, ""

  strip_newlines: (input) ->
    input.toString().replace /\n/g, ""

  join: (input, separator) ->
    separator = separator or " "
    input.join separator

  split: (input, separator) ->
    separator = separator or " "
    input.split separator

  sort: (input) ->
    input.sort()

  reverse: (input) ->
    input.reverse()

  replace: (input, string, replacement) ->
    replacement = replacement or ""
    input.toString().replace new RegExp(string, "g"), replacement

  replace_first: (input, string, replacement) ->
    replacement = replacement or ""
    input.toString().replace new RegExp(string, ""), replacement

  newline_to_br: (input) ->
    input.toString().replace /\n/g, "<br/>\n"

  date: (input, format) ->
    date = undefined
    date = input  if input instanceof Date
    date = new Date()  if (date not instanceof Date) and input is "now"
    date = new Date(input)  unless date instanceof Date
    date = new Date(Date.parse(input))  unless date instanceof Date
    return input  unless date instanceof Date # Punt
    strftime(format, date)

  first: (input) ->
    input[0]

  last: (input) ->
    input = input
    input[input.length - 1]



class Assign extends Tag

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
    context.scopes[context.scopes.length-1][@to.toString()] = context.get(@from)
    ""


class Capture extends Block

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
    context.set @to, _flatten([output]).join("")
    ""



class Case extends Block

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
          output = _flatten([output, @renderAll(block.attachment, context)]) if execElseBlock is true
          return output
        else if block.evaluate(context)
          execElseBlock = false
          output = _flatten([output, @renderAll(block.attachment, context)])
        i++

    output

  recordWhenCondition: (markup) ->
    while markup
      parts = markup.match(@tagWhenSyntax)
      throw ("Syntax error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %} ")  unless parts
      markup = parts[2]
      block = new Condition(@left, "==", parts[1])
      @blocks.push block
      @nodelist = block.attach([])

  recordElseCondition: (markup) ->
    throw ("Syntax error in tag 'case' - Valid else condition: {% else %} (no parameters) ")  unless (markup or "").trim() is ""
    block = new ElseCondition()
    @blocks.push block
    @nodelist = block.attach([])



class Comment extends Block
  render: (context) ->
    ""


class Cycle extends Tag

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


class For extends Block

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
        attMatchs.forEach ((pair) ->
          pair = pair.split(":")
          @attributes[pair[0].trim()] = pair[1].trim()
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
      segment.forEach (item, index) =>
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


    _flatten([output]).join ""


class If extends Block
  tagSyntax: /("[^"]+"|'[^']+'|[^\s,|]+)\s*([=!<>a-z_]+)?\s*("[^"]+"|'[^']+'|[^\s,|]+)?/
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
    output = ""
    context.stack =>
      i = 0

      while i < @blocks.length
        block = @blocks[i]
        if block.evaluate(context)
          output = @renderAll(block.attachment, context)
          return
        i++

    _flatten([output]).join ""

  pushBlock: (tag, markup) ->
    block = undefined
    if tag is "else"
      block = new ElseCondition()
    else
      expressions = markup.split(/\b(and|or)\b/).reverse()
      expMatches = expressions.shift().match(@tagSyntax)
      throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
      condition = new Condition(expMatches[1], expMatches[2], expMatches[3])
      while expressions.length > 0
        operator = expressions.shift()
        expMatches = expressions.shift().match(@tagSyntax)
        throw ("Syntax Error in tag '" + tag + "' - Valid syntax: " + tag + " [expression]")  unless expMatches
        newCondition = new Condition(expMatches[1], expMatches[2], expMatches[3])
        newCondition[operator] condition
        condition = newCondition
      block = condition
    block.attach []
    @blocks.push block
    @nodelist = block.attachment


class Unless extends If
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

    _flatten([output]).join ""



class IfChanged extends Block

  render: (context) ->
    output = ""
    context.stack =>
      results = @renderAll(@nodelist, context).join("")
      unless results is context.registers["ifchanged"]
        output = results
        context.registers["ifchanged"] = output

    output



class Include extends Tag

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
        attMatchs.forEach ((pair) ->
          pair = pair.split(":")
          @attributes[pair[0].trim()] = pair[1].trim()
        ), this
    else
      throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]")
    super tag, markup, tokens

  render: (context) ->
    source = Template.fileSystem.readTemplateFile(context.get(@templateName))
    partial = Template.parse(source)
    variable = context.get((@variableName or @templateNameVar))
    output = ""
    context.stack =>

      @attributes.forEach = (fun) -> #, thisp
        throw "Object.forEach requires first argument to be a function"  unless typeof fun is "function"
        i = 0
        thisp = arguments[1]
        for key, value of @
          pair = [key, value]
          pair.key = key
          pair.value = value
          fun.call thisp, pair, i, @
          i++
        null

      @attributes.forEach (pair) ->
        context.set pair.key, context.get(pair.value)

      if variable instanceof Array
        output = variable.map((variable) ->
          context.set @templateNameVar, variable
          partial.render context
        )
      else
        context.set @templateNameVar, variable
        output = partial.render(context)

    output = _flatten([output]).join("")


Template.registerTag "assign", Assign
Template.registerTag "capture", Capture
Template.registerTag "case", Case
Template.registerTag "comment", Comment
Template.registerTag "cycle", Cycle
Template.registerTag "for", For
Template.registerTag "if", If
Template.registerTag "ifchanged", IfChanged
Template.registerTag "include", Include
Template.registerTag "unless", Unless

module.exports = Liquid =


  BlankFileSystem: BlankFileSystem
  Block: Block
  Condition: Condition
  Context: Context
  Document: Document
  Drop: Drop
  Strainer: Strainer
  Tag: Tag
  Template: Template
  Variable: Variable

