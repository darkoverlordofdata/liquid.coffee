describe 'Liquid raw tag ', ->

  it "{% raw %}TRUE{% endraw %}", ->
    render("{% raw %}{{ TRUE }}{% endraw %}").should.equal "{{ TRUE }}"
