describe 'Liquid decrement tag ', ->

  it "{% decrement %}", ->
    render("{% decrement counter %}{% decrement counter %}").should.equal "-1-2"

