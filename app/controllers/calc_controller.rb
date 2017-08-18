class CalcController < ApplicationController
  def index
    params = view_context.params
    
    parser = Parser.new
    score = parser.parse(params)
    parser.validate(score, params[:category], params[:segment])
    
    render locals: { score: score }
  end
end
