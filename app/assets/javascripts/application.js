//= require jquery
//= require jquery_ujs
//= require_self

jQuery(document).ready(function($){

  $('.addQuestion').on('click', addQuestionField);

  $(document).on('click', '.removeQuestion', removeField); /* live */
  $(document).on('click', '.removeExistingQuestion', removeExistingField);
  
})

function removeField(event){
  event.preventDefault();
  $(this).parents('.fieldQuestion').fadeOut('fast',function(){$(this).remove()})
}

function removeExistingField(event){
  event.preventDefault();
  row = $(this).parents('.fieldQuestion');
  row.next().remove();
  row.fadeOut('fast',function(){$(this).remove()})
}

function addQuestionField(event){
  event.preventDefault();
  
  var fields,i,template,reg;
  
  // get number of field (either as rel attribute or as count of fields)
  fields = $('fieldset.questions li.fieldQuestion');
  i = parseInt($('fieldset.questions').attr('rel') || fields.length)
  
  // prepare template
  template = '<li class="fieldQuestion clearfix" id="question-row-'+i+'">' + $('fieldset.questions .question-template').html() + '</li>';
  
  
  // replace ____ with ''
  reg = new RegExp("____", "g")
  template = template.replace(reg, '');

  // replace #NUM# with propper i value
  reg = new RegExp("NUM", "g");  
  template = template.replace(reg, i);
  
  
  $('fieldset.questions ol').append(template);
  var last_field = $('fieldset.questions li.fieldQuestion').last();
  last_field.hide().slideDown()
  last_field.find('input').val('')
  
  $('fieldset.questions').attr({'rel':i+1})
}

