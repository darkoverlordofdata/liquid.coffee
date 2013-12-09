# Array.indexOf
unless Array::indexOf
  Array::indexOf = (obj) ->
    i = 0

    while i < @length
      return i  if this[i] is obj
      i++
    -1

# Array.clear
unless Array::clear
  Array::clear = ->
    
    #while (this.length > 0) this.pop();
    @length = 0

# Array.map
unless Array::map
  Array::map = (fun) -> #, thisp
    len = @length
    throw "Array.map requires first argument to be a function"  unless typeof fun is "function"
    res = new Array(len)
    thisp = arguments[1]
    i = 0

    while i < len
      res[i] = fun.call(thisp, this[i], i, this)  if i of this
      i++
    res

# Array.first
unless Array::first
  Array::first = ->
    this[0]

# Array.last
unless Array::last
  Array::last = ->
    this[@length - 1]

# Array.flatten
unless Array::flatten
  Array::flatten = ->
    len = @length
    arr = []
    i = 0

    while i < len
      
      # TODO This supposedly isn't safe in multiple frames;
      # http://stackoverflow.com/questions/767486/how-do-you-check-if-a-variable-is-an-array-in-javascript
      # http://stackoverflow.com/questions/4775722/javascript-check-if-object-is-array
      if this[i] instanceof Array
        arr = arr.concat(this[i])
      else
        arr.push this[i]
      i++
    arr

# Array.each
unless Array::each
  Array::each = (fun) -> #, thisp
    len = @length
    throw "Array.each requires first argument to be a function"  unless typeof fun is "function"
    thisp = arguments[1]
    i = 0

    while i < len
      fun.call thisp, this[i], i, this  if i of this
      i++
    null

# Array.include
unless Array::include
  Array::include = (arg) ->
    len = @length
    return @indexOf(arg) >= 0
    i = 0

    while i < len
      return true  if arg is this[i]
      i++
    false

# String.capitalize
unless String::capitalize
  String::capitalize = ->
    @charAt(0).toUpperCase() + @substring(1).toLowerCase()

# String.strip
unless String::strip
  String::strip = ->
    @replace(/^\s+/, "").replace /\s+$/, ""

# NOTE Having issues conflicting with jQuery stuff when setting Object
# prototype settings; instead add into Liquid.Object.extensions and use in
# the particular location; can add into Object.prototype later if we want.
module.exports = (Liquid) ->
  Liquid.extensions = {}
  Liquid.extensions.object = {}

  # Object.update
  Liquid.extensions.object.update = (newObj) ->
    for p of newObj
      this[p] = newObj[p]
    this


  #if (!Object.prototype.update) {
  #  Object.prototype.update = Liquid.extensions.object.update
  #}

  # Object.hasKey
  Liquid.extensions.object.hasKey = (arg) ->
    !!this[arg]


  #if (!Object.prototype.hasKey) {
  #  Object.prototype.hasKey = Liquid.extensions.object.hasKey
  #}

  # Object.hasValue
  Liquid.extensions.object.hasValue = (arg) ->
    for p of this
      return true  if this[p] is arg
    false

  #if (!Object.prototype.hasValue) {
  #  Object.prototype.hasValue = Liquid.extensions.object.hasValue
  #}
