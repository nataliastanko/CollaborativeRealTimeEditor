//= require jquery
//= require jquery_ujs
//= require twitter/bootstrap
//= require socky/socky.min.js
//= require_self


var socky;

jQuery(document).ready(function($){

  if ($('#editor').length>0) {
    socky = new Socky.Client('ws://localhost:3001/websocket/editor');
    channel = socky.subscribe("channel1");
  }

  //socky.unsubscribe("channel1");

})
