#+--------------------------------------------------------------------+
#| context.coffee
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
Strainer = require('./strainer')
Utils = require('./utils')

module.exports = class Context


  constructor: (assigns, registers, rethrowErrors) ->
    @scopes = [(if assigns then assigns else {})]
    @registers = (if registers then registers else {})
    @errors = []
    @rethrowErrors = rethrowErrors
    @strainer = Strainer.create(@)

  get: (varname) ->
    @resolve varname

  set: (varname, value) ->
    @scopes[0][varname] = value

  hasKey: (key) ->
    (if (@resolve(key)) then true else false)

  push: ->
    scpObj = {}
    @scopes.unshift scpObj
    scpObj # Is @ right?

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
          variable = variable.apply(@)
          scope[key] = variable
        variable = variable.toLiquid()  if variable and typeof (variable) is "object" and ("toLiquid" of variable)
        variable.setContext self  if variable and typeof (variable) is "object" and ("setContext" of variable)
        return variable
      i++

    #    console.log('findVariable("'+ key +'") is returning NULL')
    null

  variable: (markup) ->

    #return @.scopes[0][key] || ''

    #  console.log('markup('+ Object.inspect(markup) +') was unexpected, returning NULL')
    return null  unless typeof markup is "string"
    parts = markup.match(/\[[^\]]+\]|(?:[\w\-]\??)+/g)
    firstPart = parts.shift()
    squareMatch = firstPart.match(/^\[(.*)\]$/)
    firstPart = @resolve(squareMatch[1])  if squareMatch
    object = @findVariable(firstPart)
    self = @

    # Does 'pos' need to be scoped up here?
    if object
      parts.forEach (part) ->

        # If object is a hash we look for the presence of the key and if its available we return it
        squareMatch = part.match(/^\[(.*)\]$/)
        if squareMatch
          part = self.resolve(squareMatch[1])

          # Where the hell does 'pos' come from?
          object[part] = object[part].apply(@)  if typeof (object[part]) is "function" # Array?
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
    filters = Utils.flatten(filters)
    filters.forEach (f) ->
      throw ("Expected object but got: " + typeof (f))  unless typeof (f) is "object"
      @strainer.addMethods f


  handleError: (err) ->
    @errors.push err
    throw err  if @rethrowErrors
    "Liquid error: " + ((if err.message then err.message else ((if err.description then err.description else err))))

