describe 'Liquid variables ', ->

  it "{{ 'string literal' }}", ->

    render('{{"string literal"}}').should.equal       'string literal'
    render('{{ "string literal" }}').should.equal     'string literal'
    render("{{'string literal'}}").should.equal       'string literal'
    render("{{ 'string literal' }}").should.equal     'string literal'
    render("{{'string \"literal\"'}}").should.equal   'string "literal"'
    render("{{ 'string \"literal\"' }}").should.equal 'string "literal"'


  it "{{ 10 }}", ->
    render('{{10}}').should.equal '10'
    render('{{ 10 }}').should.equal '10'


  it "{{ 5.5 }}", ->
    render('{{5.5}}').should.equal '5.5'
    render('{{ 5.5 }}').should.equal '5.5'


  it "{{ (1..5) }}", ->
    render('{{(1..5)}}').should.equal '1,2,3,4,5'
    render('{{ (1..5) }}').should.equal '1,2,3,4,5'



  it "{{ (a..e) }}", ->
    render('{{(a..e)}}').should.equal 'a,b,c,d,e'


  it "{{ varname }}", ->
    render("{{ user }}", {user:'Bob'}).should.equal 'Bob'


  it "{{ parent.child }}", ->
    render("{{ user.name }}", {user:{ name:'Bob' }}).should.equal 'Bob'


  it "{{ collection[0] }}", ->
    render("{{ users[0] }}", {users:['Bob']}).should.equal 'Bob'


  it "{{ collection[0].child }}", ->
    render("{{ users[0].name }}", {users:[{name:'Bob'}]}).should.equal 'Bob'


