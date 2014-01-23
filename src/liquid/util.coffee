

compact = ($this) -> ($that for $that in $this when $that)

#
# flatten a nested list
#
# @param  [Array] list  nested list
# @return [Array] the flattened list
#
flatten = ($list) ->

  return [] unless $list?

  $a = []
  for $item in $list
    if Array.isArray($item)
      $a = $a.concat flatten($item)
    else
      $a.push $item
  return $a

module.exports =
  compact: compact
  flatten: flatten