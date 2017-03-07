###

Copyright (c) 2013 - 2014 Bruce Davidson darkoverlordofdata@gmail.com
Copyright (c) 2005, 2006 Tobias Luetke

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
###

module.exports = class Liquid

  @Liquid = Liquid # dereference for AMD 

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

  #
  # Setting a path enables a simple disk based file system
  #
  @setPath = (path) ->
    #
    # Templates load their own extends and includes
    #
    Liquid.Template.fileSystem = new Liquid.LocalFileSystem(path)
    return Liquid

  #
  # Hapi wants a compile function
  #
  @compile = (template, options) ->
    t = Liquid.Template.parse(template)
    (context, options) ->
      t.render(context)





require './liquid/version'
require './liquid/drop'
require './liquid/errors'
require './liquid/interrupts'
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
require './liquid/tags/extends'
require './liquid/tags/for'
require './liquid/tags/if'
require './liquid/tags/ifchanged'
require './liquid/tags/include'
require './liquid/tags/increment'
require './liquid/tags/raw'
require './liquid/tags/unless'

require './extras/liquidView'