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
# Load the Liquid Template Framework
#
module.exports = class Liquid

  @FilterSeparator            = ///\|///
  @ArgumentSeparator          = ','
  @FilterArgumentSeparator    = ':'
  @VariableAttributeSeparator = '.'
  @TagStart                   = ///\{\%///
  @TagEnd                     = ///\%\}///
  @VariableSignature          = ///\(?[\w\-\.\[\]]\)?///
  @VariableSegment            = ///[\w\-]///
  @VariableStart              = ///\{\{///
  @VariableEnd                = ///\}\}///
  @VariableIncompleteEnd      = ///\}\}?///
  @QuotedString               = ///"[^"]*"|'[^']*'///
  @QuotedFragment             = ///#{@QuotedString.source}|(?:[^\s,\|'"]|#{@QuotedString.source})+///
  @StrictQuotedFragment       = ///"[^"]+"|'[^']+'|[^\s|:,]+///
  @FirstFilterArgument        = ///#{@FilterArgumentSeparator}(?:#{@StrictQuotedFragment.source})///
  @OtherFilterArgument        = ///#{@ArgumentSeparator}(?:#{@StrictQuotedFragment.source})///
  @SpacelessFilter            = ///^(?:'[^']+'|"[^"]+"|[^'"])*#{@FilterSeparator.source}(?:#{@StrictQuotedFragment.source})(?:#{@FirstFilterArgument.source}(?:#{@OtherFilterArgument.source})*)?///
  @Expression                 = ///(?:#{@QuotedFragment.source}(?:#{@SpacelessFilter.source})*)///
  @TagAttributes              = ///(\w+)\s*\:\s*(#{@QuotedFragment.source})///
  @AnyStartingTag             = ///\{\{|\{\%///
  @PartialTemplateParser      = ///#{@TagStart.source}.*?#{@TagEnd.source}|#{@VariableStart.source}.*?#{@VariableIncompleteEnd.source}///
  @TemplateParser             = ///(#{@PartialTemplateParser.source}|#{@AnyStartingTag.source})///
  @VariableParser             = ///\[[^\]]+\]|#{@VariableSegment.source}+\??///
  @LiteralShorthand           = ///^(?:\{\{\{\s?)(.*?)(?:\s*\}\}\})$///

require './liquid/version'
require './liquid/drop'
require './liquid/errors'
require './liquid/interrupt'
require './liquid/strainer'
require './liquid/context'
require './liquid/tag'
require './liquid/block'
require './liquid/document'
require './liquid/variable'
require './liquid/filesystem'
require './liquid/template'
require './liquid/standardfilters'
require './liquid/condition'

class Liquid.Tags

require './liquid/tags/assign'
require './liquid/tags/block'
require './liquid/tags/break'
require './liquid/tags/capture'
require './liquid/tags/case'
require './liquid/tags/comment'
require './liquid/tags/continue'
require './liquid/tags/cycle'
require './liquid/tags/decrement'
#require './liquid/tags/extends'
require './liquid/tags/for'
require './liquid/tags/if'
require './liquid/tags/ifchanged'
require './liquid/tags/include'
require './liquid/tags/increment'
require './liquid/tags/raw'
require './liquid/tags/unless'



