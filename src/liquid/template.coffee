#+--------------------------------------------------------------------+
#| template.coffee
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

# Templates are central to liquid.
# Interpretating templates is a two step process. First you compile the
# source code you got. During compile time some extensive error checking is performed.
# your code should expect to get some SyntaxErrors.
#
# After you have a compiled template you can then <tt>render</tt> it.
# You can use a compiled template over and over again and keep it cached.
#
# Example:
#
#   template = Liquid.Template.parse(source)
#   template.render user_name: 'bob'
#
class Liquid.Template

  @fileSystem = new Liquid.BlankFileSystem()
  @tags = {}
  @registerTag = (name, klass) ->
    Liquid.Template.tags[name] = klass

  # Pass a module with filter methods which should be available
  # to all liquid views. Good for registering the standard library
  @registerFilter = (mod) ->
    Liquid.Strainer.globalFilter mod

  # creates a new <tt>Template</tt> object from liquid source code
  @parse = (source) ->
    template = new Liquid.Template
    template.parse(source)
    template

  constructor: ->
    @root = null
    @registers = {}
    @assigns = {}
    @instanceAssigns = {}
    @errors = []
    @rethrowErrors = false

  # Parse source code.
  # Returns self for easy chaining
  parse: (src) ->
    @root = new Liquid.Document(Liquid.Template.tokenize(src))
    @

  # Render takes a hash with local variables.
  #
  # if you use the same filters over and over again consider registering them globally
  # with <tt>Template.register_filter</tt>
  #
  # Following options can be passed:
  #
  #  * <tt>filters</tt> : array with local filters
  #  * <tt>registers</tt> : hash with register variables. Those can be accessed from
  #    filters and tags and might be useful to integrate liquid more with its host application
  #
  render: (args...) ->
    return '' if @root is null

    context = if args[0] instanceof Liquid.Context
      args.shift()
    else if args[0] instanceof Object
      new Liquid.Context([args.shift(), @assigns], @instanceAssigns, @registers, @rethrowErrors)
    else if not args[0]?
      new Liquid.Context(@assigns, @instanceAssigns, @registers, @rethrowErrors)
    else
      throw new Liquid.ArgumentErro( "Expect Hash or Liquid::Context as parameter")

    last = args.length-1
    if args[last] instanceof Object
      options =  args.pop()

      if 'registers' of options
        for key, val of options.registers
          @registers[key] = val

      if 'filters' of options
        context.addFilters options.filters

    else if args[last] instanceof Function
      context.addFilters args.pop()

    else if args[last] instanceof Array
      context.addFilters args.pop()

    try
      # render the nodelist.
      # for performance reasons we get a array back here. join will make a string out of it
      result = @root.render(context)
      if result.join? then result.join('') else result
    catch
      @errors = context.errors


  renderWithErrors: ->
    savedRethrowErrors = @rethrowErrors
    @rethrowErrors = true
    res = @render.apply(this, arguments)
    @rethrowErrors = savedRethrowErrors
    res

  # Uses the <tt>Liquid::TemplateParser</tt> regexp to tokenize the passed source
  @tokenize = (source = '') ->
    source = source.source if source.source?
    return [] if source is ''
    tokens = source.split(Liquid.TemplateParser)

    # removes the rogue empty element at the beginning of the array
    tokens.shift() if tokens[0] is ''

    tokens



