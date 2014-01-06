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

  @VERSION                    =  require('../package.json').version
  @Utils                      = require('./liquid/utils')
  @Tags                       {}
