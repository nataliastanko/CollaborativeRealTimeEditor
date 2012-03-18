//= require jquery
//= require jquery_ujs
//= require twitter/bootstrap
//= require socky/socky.min.js
//= require_self

var socky, channel;

jQuery(document).ready(function($){

  if ($('#editor').length>0) {
    socky = new Socky.Client('ws://localhost:3001/websocket/editor');
    channel = socky.subscribe("presence-editor-channel", { read: true, write: true, data: { login: 'test' } });

    socky.bind("socky:subscribe:success", function(){
      channel.bind("textSent", function(data) {
        $('.contentEditor').html(data.editorText)
      });
    });
  }

  $('#submit').click(function(){
    channel.trigger("textSent", {
      editorText: $('.contentEditor').html() 
    });
  })

  //socky.unsubscribe("channel1");

})
