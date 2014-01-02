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
# Liquid Templates
#
module.exports =

  VERSION:          require('../package.json').version
  Drop:             require('./liquid/drop')
  Strainer:         require('./liquid/strainer')
  Context:          require('./liquid/context')
  Tag:              require('./liquid/tag')
  Block:            require('./liquid/block')
  Document:         require('./liquid/document')
  Variable:         require('./liquid/variable')
  BlankFileSystem:  require('./liquid/blankfilesystem')
  LocalFileSystem:  require('./liquid/localfilesystem')
  Template:         require('./liquid/template')
  StandardFilters:  require('./liquid/standardfilters')
  Condition:        require('./liquid/condition')
  ElseCondition:    require('./liquid/elsecondition')
  Tags:
    Assign:         require('./liquid/tags/assign')
    # Block
    # Break
    Capture:        require('./liquid/tags/capture')
    Case:           require('./liquid/tags/case')
    Comment:        require('./liquid/tags/comment')
    # Continue
    Cycle:          require('./liquid/tags/cycle')
    Decrement:      require('./liquid/tags/decrement')
    # Extend
    For:            require('./liquid/tags/for')
    If:             require('./liquid/tags/if')
    IfChanged:      require('./liquid/tags/ifchanged')
    Include:        require('./liquid/tags/include')
    Increment:      require('./liquid/tags/increment')
    # Raw
    Unless:         require('./liquid/tags/unless')
