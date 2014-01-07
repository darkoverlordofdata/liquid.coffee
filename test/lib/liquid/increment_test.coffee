describe 'Liquid increment tag ', ->

  it "{% increment %}", ->
    render("{% increment counter %}{% increment counter %}{% increment counter %}").should.equal "123"

