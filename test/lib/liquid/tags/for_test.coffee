describe 'Liquid for tag ', ->

  it "{% for item in collection %}{% endfor %}", ->
    render("{% for item in (1..3) %}{{ item }}{% endfor %}").should.equal "123"
    render("{% for item in (1..3) %} {{ forloop.index }} {% endfor %}").should.equal " 1  2  3 "
    render("{% for item in (1..3) %} {{ forloop.index0 }} {% endfor %}").should.equal " 0  1  2 "
    render("{% for item in (1..3) %} {{ forloop.first }} {% endfor %}").should.equal " true  false  false "
    render("{% for item in (1..3) %} {{ forloop.last }} {% endfor %}").should.equal " false  false  true "

