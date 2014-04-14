#+--------------------------------------------------------------------+
#| include.coffee
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

class Include extends Liquid.Tag

  Syntax = ///(#{Liquid.StrictQuotedFragment.source})(\s+(?:with|for)\s+(#{Liquid.StrictQuotedFragment.source}))?///

  constructor: (tag, markup, tokens) ->
    if $ = markup.match(Syntax)

      @templateName = $[1]
      @variableName = $[3]
      @attributes    = {}

      markup.replace Liquid.TagAttributes, (key, value) =>
        [key, value] = key.split(':')
        @attributes[key] = value

    else
      throw new Liquid.SyntaxError("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]")

    super tag, markup, tokens


  render: (context) ->
    source = Include.readTemplateFromFileSystem(context, @templateName)

    partial = Liquid.Template.parse(source)
    variable = context.get(@variableName or @templateName[1..-2])

    output = ''
    context.stack =>
      for key, value of @attributes
        context.set key, context.get(value)

      if variable instanceof Array
        output = ''
        for v in variable
          context.set @templateName[1..-2], v
          output += partial.render(context)
      else
        context.set @templateName[1..-2], variable
        output = partial.render(context)

    output


  @readTemplateFromFileSystem: (context, templateName) ->

    fileSystem = context.registers.fileSystem or Liquid.Template.fileSystem

    fileSystem.readTemplateFile(context.get(templateName))


Liquid.Template.registerTag "include", Include
