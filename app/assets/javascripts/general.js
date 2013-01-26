//= require jquery
//= require jquery_ujs
//= require twitter/bootstrap
//= require_self

$('form.edit_document').on('ajax:success',function(event, data, status, xhr) {
   $('header').after('<div class="alert alert-info"><a class="close" data-dismiss="alert" href="#">&times;</a>Zapisano zmiany</div>');
});


