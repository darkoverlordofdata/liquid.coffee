#+--------------------------------------------------------------------+
#| liquid.coffee
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
# Liquid
#
fs = require('fs')

module.exports = class Liquid

  @FilterSeparator             = /\|/
  @ArgumentSeparator           = /,/
  @FilterArgumentSeparator     = /\:/
  @VariableAttributeSeparator  = /\./
  @TagStart                    = /\{\%/
  @TagEnd                      = /\%\}/
  @VariableSignature           = /\(?[\w\-\.\[\]]\)?/
  @VariableSegment             = /[\w\-]/
  @VariableStart               = /\{\{/
  @VariableEnd                 = /\}\}/
  @VariableIncompleteEnd       = /\}\}?/
  @QuotedString                = /"[^"]*"|'[^']*'/
  @QuotedFragment              = ///#{@QuotedString.source}|(?:[^\s,\|'"]|#{@QuotedString.source})+///
  @StrictQuotedFragment        = /"[^"]+"|'[^']+'|[^\s|:,]+/
  @FirstFilterArgument         = ///#{@FilterArgumentSeparator.source}(?:#{@StrictQuotedFragment.source})///
  @OtherFilterArgument         = ///#{@ArgumentSeparator.source}(?:#{@StrictQuotedFragment.source})///
  @SpacelessFilter             = ///^(?:'[^']+'|"[^"]+"|[^'"])*#{@FilterSeparator.source}(?:#{@StrictQuotedFragment.source})(?:#{@FirstFilterArgument.source}(?:#{@OtherFilterArgument.source})*)?///
  @Expression                  = ///(?:#{@QuotedFragment.source}(?:#{@SpacelessFilter.source})*)///
  @TagAttributes               = ///(\w+)\s*\:\s*(#{@QuotedFragment.source})///
  @AnyStartingTag              = /\{\{|\{\%/
  @PartialTemplateParser       = ///#{@TagStart.source}.*?#{@TagEnd.source}|#{@VariableStart.source}.*?#{@VariableIncompleteEnd.source}///
  @TemplateParser              = ///(#{@PartialTemplateParser.source}|#{@AnyStartingTag.source})///
  @VariableParser              = ///\[[^\]]+\]|#{@VariableSegment.source}+\??///

  console.log @QuotedFragment

  @readTemplateFile = (path) ->
    throw ("This liquid context does not allow includes.")

  @registerFilters = (filters) ->
    Liquid.Template.registerFilter filters

  @parse = (src) ->
    Liquid.Template.parse src

  @Drop             = (require("#{__dirname}/liquid/drop.coffee"))(@)
  @Extensions       = (require("#{__dirname}/liquid/extensions.coffee"))(@)
  @Strainer         = (require("#{__dirname}/liquid/strainer.coffee"))(@)
  @Context          = (require("#{__dirname}/liquid/context.coffee"))(@)
  @Tag              = (require("#{__dirname}/liquid/tag.coffee"))(@)
  @Block            = (require("#{__dirname}/liquid/block.coffee"))(@)
  @Document         = (require("#{__dirname}/liquid/document.coffee"))(@)
  @Variable         = (require("#{__dirname}/liquid/variable.coffee"))(@)
  @Template         = (require("#{__dirname}/liquid/template.coffee"))(@)
  @StandardFilters  = (require("#{__dirname}/liquid/standardfilters.coffee"))(@)
  @Condition        = (require("#{__dirname}/liquid/condition.coffee"))(@)

  for $f in fs.readdirSync("#{__dirname}/liquid/tags")
    (require("#{__dirname}/liquid/tags/#{$f}"))(@)
