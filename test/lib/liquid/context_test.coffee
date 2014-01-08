describe 'Liquid context ', ->

  it "{{ collection['missing_key'].value }}", ->
    render("{{ collection['missing_key'].value }}").should.equal ""
    render("{{ collection['missing_key'].value }}", {collection: {}}).should.equal ""
