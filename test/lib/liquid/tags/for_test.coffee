describe 'Liquid for tag ', ->

  it "{% for item in collection %}{% endfor %}", ->
    render("{% for item in (1..3) %}{{ item }}{% endfor %}").should.equal "123"
    render("{% for item in (1..3) limit: 2 %}{{ item }}{% endfor %}").should.equal "12"
    render("{% for item in (1..3) %} {{ forloop.index }} {% endfor %}").should.equal " 1  2  3 "
#    render("{% for item in (1..3) reversed %} {{ forloop.index }} {% endfor %}").should.equal " 3  2  1 "
    render("{% for item in (1..3) %} {{ forloop.index0 }} {% endfor %}").should.equal " 0  1  2 "
    render("{% for item in (1..3) %} {{ forloop.first }} {% endfor %}").should.equal " true  false  false "
    render("{% for item in (1..3) %} {{ forloop.last }} {% endfor %}").should.equal " false  false  true "


  it "should treat hash as an array", ->

    tmpl = Liquid.Template.parse("{% for item in data %}{{ item.key }} is {{ item.value }} {% endfor %}")
    tmpl.render(data: {name:"fred", job:"developer"}).should.equal "name is fred job is developer "


  it "should nest for loops", ->
    # 
    
    src = "{% for outer in (1..4) %}{% for inner in (1..2) %}({{ forloop.index }}/{{ forloop.length }}),{% endfor %}{% endfor %}"
    
    render(src).should.eq "(1/2),(2/2),(1/2),(2/2),(1/2),(2/2),(1/2),(2/2),"
  
