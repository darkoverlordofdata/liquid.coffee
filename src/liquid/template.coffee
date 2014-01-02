#+--------------------------------------------------------------------+
#| template.coffee
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
Document = require('./document')

module.exports = class Template

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



