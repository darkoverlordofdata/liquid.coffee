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
# Liquid.Template
#
module.exports = (Liquid) ->

  class Template

    @tags = {}
    @registerTag = (name, klass) ->
      Template.tags[name] = klass

    @registerFilter = (filters) ->
      Liquid.Strainer.globalFilter filters

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
      @root = new Liquid.Document(Liquid.Template.tokenize(src))
      this

    render: ->
      return ""  unless @root
      args =
        ctx: arguments[0]
        filters: arguments[1]
        registers: arguments[2]

      context = null
      if args.ctx instanceof Liquid.Context
        context = args.ctx
        @assigns = context.assigns
        @registers = context.registers
      else

        # HACK Apply from Liquid.extensions.object; extending Object sad.
        #this.assigns.update(args.ctx);
        Liquid.extensions.object.update.call @assigns, args.ctx  if args.ctx

        # HACK Apply from Liquid.extensions.object; extending Object sad.
        #this.registers.update(args.registers);
        Liquid.extensions.object.update.call @registers, args.registers  if args.registers
        context = new Liquid.Context(@assigns, @registers, @rethrowErrors)
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

