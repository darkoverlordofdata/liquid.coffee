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
Liquid = {}

Liquid.VERSION =         require('../package.json').version
Liquid.Utils =           (require('./liquid/utils'))(Liquid)
Liquid.Drop =            (require('./liquid/drop'))(Liquid)
Liquid.Strainer =        (require('./liquid/strainer'))(Liquid)
Liquid.Context =         (require('./liquid/context'))(Liquid)
Liquid.Tag =             (require('./liquid/tag'))(Liquid)
Liquid.Block =           (require('./liquid/block'))(Liquid)
Liquid.Document =        (require('./liquid/document'))(Liquid)
Liquid.Variable =        (require('./liquid/variable'))(Liquid)
Liquid.BlankFileSystem = (require('./liquid/blankfilesystem'))(Liquid)
Liquid.LocalFileSystem = (require('./liquid/localfilesystem'))(Liquid)
Liquid.Template =        (require('./liquid/template'))(Liquid)
Liquid.StandardFilters = (require('./liquid/standardfilters'))(Liquid)
Liquid.Condition =       (require('./liquid/condition'))(Liquid)
Liquid.ElseCondition =   (require('./liquid/elsecondition'))(Liquid)
Liquid.Assign =          (require('./liquid/tags/assign'))(Liquid)
Liquid.Tags = {}
# Block
# Break
Liquid.Tags.Capture =        (require('./liquid/tags/capture'))(Liquid)
Liquid.Tags.Case =           (require('./liquid/tags/case'))(Liquid)
Liquid.Tags.Comment =        (require('./liquid/tags/comment'))(Liquid)
# Continue
Liquid.Tags.Cycle =          (require('./liquid/tags/cycle'))(Liquid)
Liquid.Tags.Decrement =      (require('./liquid/tags/decrement'))(Liquid)
# Extend
Liquid.Tags.For =            (require('./liquid/tags/for'))(Liquid)
Liquid.Tags.If =             (require('./liquid/tags/if'))(Liquid)
Liquid.Tags.IfChanged =      (require('./liquid/tags/ifchanged'))(Liquid)
Liquid.Tags.Include =        (require('./liquid/tags/include'))(Liquid)
Liquid.Tags.Increment =      (require('./liquid/tags/increment'))(Liquid)
# Raw
Liquid.Tags.Unless =         (require('./liquid/tags/unless'))(Liquid)

module.exports = Liquid
