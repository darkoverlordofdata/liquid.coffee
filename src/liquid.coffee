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
module.exports = Liquid =
  VERSION:  require('../package.json').version
  Utils:    require('./liquid/utils')
  Tags:     {}


require './liquid/drop'
require './liquid/interrupt'
require './liquid/strainer'
require './liquid/context'
require './liquid/tag'
require './liquid/block'
require './liquid/document'
require './liquid/variable'
require './liquid/blankfilesystem'
require './liquid/localfilesystem'
require './liquid/template'
require './liquid/standardfilters'
require './liquid/condition'
require './liquid/elsecondition'

require './liquid/tags/assign'
require './liquid/tags/block'
require './liquid/tags/break'
require './liquid/tags/capture'
require './liquid/tags/case'
require './liquid/tags/comment'
require './liquid/tags/continue'
require './liquid/tags/cycle'
require './liquid/tags/decrement'
require './liquid/tags/extend'
require './liquid/tags/for'
require './liquid/tags/if'
require './liquid/tags/ifchanged'
require './liquid/tags/include'
require './liquid/tags/increment'
require './liquid/tags/raw'
require './liquid/tags/unless'


