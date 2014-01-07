describe 'Liquid ifchanged tag ', ->

  it "{% ifchanged %}{% endifchanged %}", ->
    render("{% for item in col %}{% ifchanged %}{{ item }}{% endifchanged %}{% endfor %}", {col:[1,1,1,2,2,2]})
    .should.equal "12"

