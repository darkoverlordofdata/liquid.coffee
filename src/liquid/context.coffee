#+--------------------------------------------------------------------+
#| context.coffee
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

# Context keeps the variable stack and resolves variables, as well as keywords
#
#   context.set 'variable', 'testing'
#   context.get('variable') #=> 'testing'
#   context.get('true')     #=> true
#   context.get('10.2232')  #=> 10.2232
#
#   context.stack =>
#      context.set 'bob', 'bobsen'
#   
#
#   context.get('bob')  #=> nil  class Context
class Liquid.Context

  LITERALS =
    'nil': null
    'null': null
    '': null
    'true': true
    'false': false

  {compact, flatten} = require('./util')

  constructor: (environments, outerScope, registers, rethrowErrors) ->
    @environments   = flatten([environments])
    @scopes         = [(outerScope or {})]
    @registers      = registers
    @errors         = []
    @rethrowErrors  = rethrowErrors
    @strainer       = Liquid.Strainer.create(@)
    @interrupts     = []

  # Adds filters to this context.
  #
  # Note that this does not register the filters with the main Template object. see <tt>Template.register_filter</tt>
  # for that
  addFilters: (filters) ->
    filters = compact(flatten([filters]))

#    filters.forEach (f) ->
    for f in filters
      throw Liquid.ArgumentError("Expected module but got: " + typeof (f))  unless typeof (f) is "function"
      @strainer.extend f

  # are there any not handled interrupts?
  hasInterrupt: ->
    @interrupts.length>0

  # push an interrupt to the stack. this interrupt is considered not handled.
  pushInterrupt: (e) ->
    @interrupts.push e

  # pop an interrupt from the stack
  popInterrupt: ->
    @interrupts.pop()

  handleError: (e) ->
    @errors.push e
    if @rethrowErrors
      if e instanceof Liquid.SyntaxError
        throw "Liquid syntax error: #{e.message}"
      else
        throw "Liquid error: #{e.message}"


  invoke: (method, args...) ->
    if @strainer.respondTo(method)
      @strainer[method](args...)
    else
      args[0]

  # Push new local scope on the stack. use <tt>Context#stack</tt> instead
  push: (newScope = {}) ->
    #@scopes.unshift newScope
    @scopes.push newScope
    throw new Liquid.StackLevelError("Nesting too deep") if @scopes.length > 100

  # Merge a hash of variables in the current local scope
  merge: (newScope) ->
    for key, val of newScope
      @scopes[0][key] = val

  # Pop from the stack. use <tt>Context#stack</tt> instead
  pop: ->
    throw new Liquid.ContextError() if @scopes.length is 1
    #@scopes.shift()
    @scopes.pop()

  # Pushes a new local scope on the stack, pops it at the end of the block
  #
  # Example:
  #   context.stack =>
  #      context.get('var') = 'hi'
  #   
  #
  #   context.get('var)  #=> nil
  stack: ($yield, newScope = {}) ->
    @push newScope
    try
      $yield()
    finally
      @pop()

  clearInstanceAssigns: ->
    @scopes[0] = {}

  # def [](key)
  get: (varname) ->
    @resolve varname

  # def []=(key, value)
  set: (varname, value) ->
    @scopes[0][varname] = value

  hasKey: (key) ->
    @resolve(key)?

  # Look up variable, either resolve directly after considering the name. We can directly handle
  # Strings, digits, floats and booleans (true,false).
  # If no match is made we lookup the variable in the current scope and
  # later move up to the parent blocks to see if we can resolve the variable somewhere up the tree.
  # Some special keywords return symbols. Those symbols are to be called on the rhs object in expressions
  #
  # Example:
  #   products is null #=> not products?
  resolve: (key) ->
    if LITERALS[key]?
      LITERALS[key]
    else
      if $ = /^'(.*)'$/.exec(key) # Single quoted strings
        $[1]
      else if $ = /^"(.*)"$/.exec(key) # Double quoted strings
        $[1]
      else if $ = /^(\d+)$/.exec(key) # Integer...
        parseInt($[1], 10)
      else if $ = /^(\d[\d\.]+)$/.exec(key) # Float...
        parseFloat($[1])
      else if $ = /^\((\S+)\.\.(\S+)\)$/.exec(key) # Ranges
        if isNaN($[1])
          (String.fromCharCode(ch) for ch in [$[1].charCodeAt(0)..$[2].charCodeAt(0)])
        else
          [parseInt($[1])..parseInt($[2])]
      else
        @variable(key)

  # Fetches an object starting at the local scope and then moving up the hierachy
  findVariable: (key) ->

    #scope = @scopes.find (s) -> s[key]?
    for s in @scopes
      scope = s if s[key]?

    unless scope?
      for e in @environments
        if variable = @lookupAndEvaluate(e, key)
          scope = e
          break

    scope     or= @environments[@environments.length-1] || @scopes[@scopes.length-1]
    variable  or= @lookupAndEvaluate(scope, key)

    variable?.setContext? @
    variable

  # Resolves namespaced queries gracefully.
  #
  # Example
  #  @context['hash'] = {name: 'tobi'}
  #  assert_equal 'tobi', @context.get('hash.name')
  #  assert_equal 'tobi', @context.get('hash["name"]')
  variable: (markup) ->
    return null  unless typeof markup is "string"

    parts = markup.match(/\[[^\]]+\]|(?:[\w\-]\??)+/g)

    squareBracketed = /^\[(.*)\]$/

    firstPart = parts.shift()

    if ($ = squareBracketed.exec(firstPart))
      firstPart = @resolve($[1])

    if object = @findVariable(firstPart)

      #parts.forEach (part) =>
      for part in parts

        if ($ = squareBracketed.exec(part))
          part = @resolve($[1])
          object = object[part]

        else
          # If object is a hash- or array-like object we look for the
          # presence of the key and if its available we return it
          if typeof object is 'object' and part of object
            object = @lookupAndEvaluate(object, part)

          else if /^\d+$/.test(part)
            object = object[parseInt(part, 10)]

          else
            return null

        object?.setContext? @
    object

  lookupAndEvaluate: (obj, key) ->
    if typeof(value = obj[key]) is 'function'
      obj[key] = value(@)
    else
      value

