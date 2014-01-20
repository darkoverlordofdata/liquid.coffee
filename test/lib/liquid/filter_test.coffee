describe "Liquid filters ", ->

  it "{{ string | krap }}", ->
    render("{{user | krap}}", {user:'Bob'}).should.equal 'Bob'

  it "{{ string | size }}", ->
    render("{{user | size}}", {user:'Bob'}).should.equal '3'
    render("{{user|size}}", {user:'Bob'}).should.equal '3'
    render("{{ user | size }}", {user:'Bob'}).should.equal '3'

  
  it "{{ collection | size }}", ->
    render("{{user|size}}", {user:['','','']}).should.equal '3'
    render("{{ user | size }}", {user:['','','']}).should.equal '3'

  
  it "{{ string | upcase }}", ->
    render("{{user|upcase}}", {user:'Bob'}).should.equal 'BOB'
    render("{{ user | upcase }}", {user:'Bob'}).should.equal 'BOB'

  
  it "{{ string | downcase }}", ->
    render("{{user|downcase}}", {user:'Bob'}).should.equal 'bob'
    render("{{ user | downcase }}", {user:'Bob'}).should.equal 'bob'

  
  it "{{ string | capitalize }}", ->
    render("{{user|capitalize}}", {user:'bob'}).should.equal 'Bob'
    render("{{ user | capitalize }}", {user:'bob'}).should.equal 'Bob'

  
  it "{{ string | escape }}", ->
    render("{{'<br/>'|escape}}", {user:'bob'}).should.equal '&lt;br/&gt;'
    render("{{ '<br/>' | escape }}", {user:'bob'}).should.equal '&lt;br/&gt;'
    render("{{ 'this & \"that\"' | escape }}", {user:'bob'}).should.equal 'this &amp; &quot;that&quot;'

  
  it "{{ string | truncate }}", ->

    render("{{'I am the very model of a modern major general, really.'|truncate}}")
    .should.equal 'I am the very model of a modern major general, rea...'

    render("{{'I am the very model of a modern major general, really.' | truncate}}")
    .should.equal 'I am the very model of a modern major general, rea...'

  
  it "{{ string | truncate:2 }}", ->
    render("{{user|truncate:2}}", {user:'Bob'}).should.equal 'Bo...'
    render("{{ user | truncate:2 }}", {user:'Bob'}).should.equal 'Bo...'
    render("{{ user | truncate: 2 }}", {user:'Bob'}).should.equal 'Bo...'

  
  it "{{ string | truncate:1,'-' }}", ->
    render("{{user|truncate:1,'-'}}", {user:'Bob'}).should.equal 'B-'
    render("{{ user | truncate:1,'-' }}", {user:'Bob'}).should.equal 'B-'
    render("{{ user | truncate: 1,'-' }}", {user:'Bob'}).should.equal 'B-'
    render("{{ user | truncate: 1, '-' }}", {user:'Bob'}).should.equal 'B-'

  
  it "{{ string | truncatewords }}", ->
    render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords}}")
    .should.equal 'a b c d e f g h i j k l m n o...'
    render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords }}")
    .should.equal 'a b c d e f g h i j k l m n o...'

  
  it "{{ string | truncatewords:5 }}", ->
    render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords:5}}")
    .should.equal 'a b c d e...'
    render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords:5 }}")
    .should.equal 'a b c d e...'

  
  it "{{ string | truncatewords:5,'-' }}", ->
    render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords:5,'-'}}")
    .should.equal 'a b c d e-'
    render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords:5,'-' }}")
    .should.equal 'a b c d e-'

  
  it "{{ string | strip_html }}", ->
    render("{{'hello <b>bob</b>'|strip_html}}")
    .should.equal 'hello bob'
    render("{{ 'hello <b>bob</b>' | strip_html }}")
    .should.equal 'hello bob'

  
  it "{{ string | strip_newlines }}", ->

    src = "\nhello \nbob \n\nold\n friend\n"

    render("{{src|strip_newlines}}", {src:src})
    .should.equal 'hello bob old friend'
    render("{{ src | strip_newlines }}", {src:src})
    .should.equal 'hello bob old friend'

  
  it "{{ collection | join }}", ->
    render("{{(1..3)|join}}").should.equal "1 2 3"
    render("{{ (1..3) | join }}").should.equal "1 2 3"

  
  it "{{ collection | join:',' }}", ->
    render("{{(1..3)|join:','}}").should.equal "1,2,3"
    render("{{ (1..3) | join:',' }}").should.equal "1,2,3"


  it "{{ collection | sort }}", ->
    render("{{c|sort}}", {c:[2,1,3]}).should.equal "1,2,3"
    render("{{ c | sort }}", {c:[2,1,3]}).should.equal "1,2,3"
    render("{{(1..3)|sort}}").should.equal "1,2,3"
    render("{{ (1..3) | sort }}").should.equal "1,2,3"

  it "{{ collection | reverse }}", ->
    render("{{(1..3)|reverse}}").should.equal "3,2,1"
    render("{{ (1..3) | reverse }}").should.equal "3,2,1"
    render("{{c|reverse}}", {c:[1,2,3]}).should.equal "3,2,1"
    render("{{ c | reverse }}", {c:[1,2,3]}).should.equal "3,2,1"

  it "{{ string | relace:string }}", ->
    render("{{'bananas'|replace:'a'}}").should.equal "bnns"
    render("{{ 'bananas' | replace:'a' }}").should.equal "bnns"

  it "{{ string | relace_first:string }}", ->
    render("{{'bananas'|replace_first:'a'}}").should.equal "bnanas"
    render("{{ 'bananas' | replace_first:'a' }}").should.equal "bnanas"

  it "{{ string | newline_to_br }}", ->
    src = "Hello,\nHow are you?\nI'm glad to here it."
    exp = "Hello,<br/>\nHow are you?<br/>\nI'm glad to here it."
    render("{{src|newline_to_br}}", {src:src}).should.equal exp
    render("{{ src | newline_to_br }}", {src:src}).should.equal exp

  it "{{ 'now' | date:'format' }}", -> # Duplicates issue #1 from github
    exp = String((new Date()).getFullYear())
    render("{{'now' | date: '%Y'}}", {}).should.equal exp

  it "{{ date | date:'format' }}", ->
    src = new Date('8/30/2008')
    exp = "08.30.2008"
    fmt = "%m.%d.%Y"
    render("{{src|date:'%m.%d.%Y'}}", {src:src, fmt:fmt}).should.equal exp
    render("{{ src | date:'%m.%d.%Y' }}", {src:src, fmt:fmt}).should.equal exp
    render("{{src|date:fmt}}", {src:src, fmt:fmt}).should.equal exp
    render("{{ src | date:fmt }}", {src:src, fmt:fmt}).should.equal exp


  it "{{ collection | first }}", ->
    render("{{(1..3)|first}}").should.equal "1"
    render("{{ (1..3) | first }}").should.equal "1"
    render("{{c|first}}", {c:[1,2,3]}).should.equal "1"
    render("{{ c | first }}", {c:[1,2,3]}).should.equal "1"

  it "{{ collection | last }}", ->
    render("{{(1..3)|last}}").should.equal "3"
    render("{{ (1..3) | last }}").should.equal "3"
    render("{{c|last}}", {c:[1,2,3]}).should.equal "3"
    render("{{ c | last }}", {c:[1,2,3]}).should.equal "3"

