describe 'Liquid increment tag ', ->

  # updated to match the docs - https://shopify.github.io/liquid/tags/variable/
  it "{% increment %}", ->
    render("{% increment counter %}{% increment counter %}{% increment counter %}").should.equal "012"

