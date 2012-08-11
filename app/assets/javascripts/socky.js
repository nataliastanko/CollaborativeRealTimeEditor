// initialize variables
var socky, channel;
var editor = null;
var dmp = new diff_match_patch();

function saveChanges(lineId, text) {
    $.ajax({
      type: "post",
      url: $('#editor').data('update'),
      data: {id:lineId, text: text},
      dataType: "json",
      success: function(data) {console.log("OK")},
      error: function(data) {}
    });
}

function initializeEditor() {
  // initialize Socky client to communicate over WebSockets
  initializeSocky();
}

function deactivateEditor() {
  // check for update before blur and disabling observer
  invokeEditorUpdate();
  if(editor != null){
    window.clearInterval(editor.updater);
    editor = null;
  }
}

// this function refresh editor state after executing operations
function updateState(){
  initialBuffer = new Buffer([new Segment(editor.userId, editor.currentContent)]);
  editor.state = new State(initialBuffer, new Vector())
}

function activateEditor(div) {
  var initialBuffer = new Buffer([new Segment(uuid, div.text())]);
  
  editor = {
    area: div,
    lineId: div.attr('id').replace('line-',''),
    currentContent: div.text(),
    previousContent: div.text(),
    state: new State(initialBuffer),
    userId: uuid,
    updater: null,
    type: "local"
  }

  // initialize 
  editor.previousContent = div.text();
  // bind jquery events
  editor.updater = window.setInterval(invokeEditorUpdate, 500); //0,5 seconds
}

function getEditor(div) {

  var initialBuffer = new Buffer([new Segment(uuid, div.text())]);
  
  var remoteEditor = {
    area: div,
    lineId: div.attr('id').replace('line-',''),
    currentContent: div.text(),
    previousContent: div.text(),
    state: new State(initialBuffer, new Vector()),
    userId: uuid,
    type: "remote"
  }
  
  if (editor != null && remoteEditor.lineId == editor.lineId){
    return editor;
  } else{
    return remoteEditor;
  }
  
}

// initialize Socky client to communicate over WebSockets
function initializeSocky() {

    socky = new Socky.Client('ws://localhost:3001/websocket/editor');
    channel = socky.subscribe("presence-editor-channel", { read: true, write: true, data: { login: 'test' } });

    socky.bind("socky:subscribe:success", function() {
      channel.bind("editorCommand", sockyReceiveCommand);
    });
}

function sockySendCommand(data) {
  console.log("Sending data...")
  console.log(data);
  channel.trigger("editorCommand", data); 
} 

function sockyReceiveCommand(data) {
  console.log("Received data...");
  console.log(data)

  processReceivedCommand(data);
}

// this function is called for browser that send changes (or not)
function invokeEditorUpdate() {

    // fix to prevent accidental focus drop, when switching window
    if(editor == null || typeof(editor) == undefined) return;
    
    // grab current content from editor
    editor.currentContent = editor.area.text();

    // Call Diff-Match-Patch to obtain a list of differences.
    var diffs = dmp.diff_main(editor.previousContent, editor.currentContent);   
    //return if no changes
    //[[0, ""]]
    if (diffs.length == 1 && diffs[0][0] == 0) {
      console.log("no changes");
      return;
    }
     
    // każda roznca wykryta jest tablicą w diff, pierwszy elem okresla czy to insert 1 , del -1 czy bez zmian 0
     
    // beginning of the text
    var offset = 0; 
    
    var buffer, operation, request;

    // process diffs to create operational transformations

    // for each diff
    for (var diffIndex in diffs) {
  		var diffData = diffs[diffIndex];
	  	var diffType = diffData[0];
	  	var diffText = diffData[1];

	  	if (diffType == 1) {// Text has been inserted. Create an insert request out of the change.
        // Creates a new Segment instance given a user ID and a string.
        // text
  			buffer = new Buffer([new Segment(editor.userId, diffText)]);

        // Create new Insert Operation instance for given segment at initial offset
  			operation = new Operations.Insert(offset, buffer); // offset - place from
  
        // Create new operation request with current user, vector and given operation
  			request = new DoRequest(editor.userId, editor.state.vector, operation);

	  		// Post the request to the socky server
        sockySendCommand({command: "insert", params: [editor.userId, ""/*request.vector.toString()*/, offset, diffText], lineId: editor.lineId});

	  		// Execute the request locally to update the internal state.        
	  		editor.state.execute(request);
        
        // increase offset
	  		offset += diffText.length;

	  	} else if (diffType == -1) {// Text has been removed.
        
        // Creates a new Segment instance given a user ID and a string.
	  		buffer = editor.state.buffer.slice(offset, offset + diffText.length);
	  		operation = new Operations.Delete(offset, buffer);
	  		request = new DoRequest(editor.userId, editor.state.vector, operation);

	  		sockySendCommand({command: "delete", params: [editor.userId, ""/*request.vector.toString()*/, offset, diffText.length], lineId: editor.lineId});

	  		// Execute the request locally to update the internal state.        
	  		editor.state.execute(request);

	  	} else {
	  		offset += diffText.length;
	  	}
	  }
	  
	  console.log("My editor state:");
	  console.dir(editor.state);

    // update previous content state with cuttent content
    editor.previousContent = editor.currentContent;
	  
	  // save changes
    saveChanges(editor.lineId, editor.currentContent);
}

function processReceivedCommand(data) {
  
  var op,request,executedRequest,buffer, currentEditor;

  // if received command is newLine
  
  if(data.command == "newLine"){
    if (data.uuid != uuid) {
      l = $("#line-" + data.current_line.id)
      l.after('<div id="line-'+ data.new_line.id +'" tabindex="-1" class="contentEditor" contenteditable="">' + data.new_line.text + '</div>');
    }
    return;
  }
  
  if(data.command == "deleteLine"){
    if (data.uuid != uuid) {
      l = $("#line-" + data.deleted_line.id)
      l.remove();
    }
    return;
  }

  editorNode = $('#line-' + data.lineId)
  var currentEditor = getEditor(editorNode);

  // if received back my changes from socky, then skip
  if (data.params[0] == currentEditor.userId) return;

  console.log("Editor:");
  console.log(currentEditor);

  
  // prepare operation based on command type (insert or deletion)
  if(data.command == "insert") {
		buffer = new Buffer([new Segment(data.params[0], data.params[3])]);
		operation = new Operations.Insert(data.params[2], buffer);
	} else{
	  operation = new Operations.Delete(data.params[2], data.params[3]);
	}
	
	console.log("Execute: " + data.command);
	request = new DoRequest(data.params[0], new Vector(data.params[1]), operation);
  executedRequest = currentEditor.state.execute(request); // state.execute - OT
				
	
	if(executedRequest){
  	console.log("Results: ")
	  console.dir(executedRequest);
    updateControl(executedRequest, currentEditor);
  } else{
    console.log("Did not execute any request!!! why???");
  }

}

function processDeleteOperation(operation) {
	if (operation instanceof Operations.Split) {
		// Delete operations might have been split; we therefore need to process
		// them recursively.
		return processDeleteOperation(operation.first) + processDeleteOperation(operation.second);
	} else {
		var textLength = operation.getLength();

		if (operation.position < selectionStart) {
			// Text was removed before our selection.
			selectionStart -= textLength;
			selectionEnd -= textLength;
		} else if (operation.position >= selectionStart && operation.position < selectionEnd) {
			// Text was removed inside our selection.
			selectionEnd -= textLength;
		}
	}
}

// set sursor on end
function updateControl(executedRequest, editor){

    // if editor was remote (not focused by user, we'll just update it and dont care about cursor position
    if(editor.type == "remote"){
      updateFromBuffer(editor);
      return;
    }

		if (executedRequest.operation instanceof Operations.Insert) {

			// Backup cursor position
			var selectionStart = editor.area.selectionStart;
			var selectionEnd = editor.area.selectionEnd;

			updateFromBuffer(editor);

			var textLength = executedRequest.operation.text.getLength();

			if (executedRequest.operation.position < selectionStart) {
				// Text was inserted before our selection, so we shift it entirely.
				selectionStart += textLength;
				selectionEnd += textLength;
			} else if (executedRequest.operation.position >= selectionStart && executedRequest.operation.position < selectionEnd) {
				// Text was inserted inside our selection, so we only adjust its end position.
				selectionEnd += textLength;
			}

			// Restore cursor position
			editor.area.selectionStart = selectionStart;
			editor.area.selectionEnd = selectionEnd;
		} else if (executedRequest.operation instanceof Operations.Delete) {
			// Backup cursor position
			var selectionStart = editor.area.selectionStart;
			var selectionEnd = editor.area.selectionEnd;

			updateFromBuffer(editor);

			processDeleteOperation(executedRequest.operation);

			// Restore cursor position
			editor.area.selectionStart = selectionStart;
			editor.area.selectionEnd = selectionEnd;
		}  
}


function updateFromBuffer(editor) {
  editor.previousContent = editor.currentContent = editor.state.buffer.toString();
  editor.area.text(editor.currentContent);
}

function onKeyPress(e){

  if (e.keyCode == 13) {// enter
    
    e.preventDefault();
    
    data = {}
    div = $(this);
    
    range = window.getSelection().getRangeAt(0);
    
    data.id = div.attr('id').replace('line-','');
    data.text = div.text();
    data.lineBreak = range.startOffset;
      
    $.ajax({
      type: "post",
      url: $('#editor').data('new'),
      data: data,
      dataType: "json",
      success: function(data) {
        l = $('#line-'+ data.current_line.id)
        l.text(data.current_line.text);
        l.after('<div id="line-'+ data.new_line.id +'" tabindex="-1" class="contentEditor" contenteditable="">' + data.new_line.text + '</div>');
        l.blur();
        $("#line-"+ data.new_line.id).focus();
        
        // send new line info via socket
        
        sockySendCommand({command: "newLine", current_line: data.current_line, new_line: data.new_line, uuid: uuid});  
      },
    });  
    
  }else  if (e.keyCode == 8) {// backspace

    data = {}
    div = $(this);
    range = window.getSelection().getRangeAt(0);
    console.log(range)
    if(range.startOffset == 0){
      e.preventDefault();
      data.id = div.attr('id').replace('line-','');
      
      $.ajax({
        type: "post",
        url: $('#editor').data('destroy'),
        data: data,
        dataType: "json",
        success: function(data) {
          deleted_line = $('#line-'+ data.deleted_line.id)
          deleted_line.remove();
          
          prev_line = $("#line-"+ data.prev_line.id);          
          prev_line.focus();
          prev_line.text(data.prev_line.text);
          // trick to trigger socky send
          prev_line.blur().focus();
          
          sockySendCommand({command: "deleteLine", deleted_line: data.deleted_line, uuid: uuid});  
        },
      });        

    }
    
  } else{
    console.log(e.keyCode);
  }
}

/*
function onKeyPress(event) {
  if (event.keyCode == 13) { // enter
  event.preventDefault();
  
  // "ala ma\n kota"
  // pocz dokumentu (wstaw linii pierwszej)
  
  // rozdzielenie tekstu linii
  
  //nowa linia
  
  data = {};
  p = $(this);
  if (p.hasClass('contentEditor')) {
   data.prevId = p.attr('id').replace('line-','')
  }
    $.ajax({
        type: "post",
        url: $('#editor').data('new'),
        data: data,
        dataType: "json",
        success: function(data) {
          $('#line-'+ data.prevId).after('<p id="line-'+ data.id +' class="contentEditor" contenteditable=""></p>');
          $('#line-'+ data.id).focus();
        },
        error: function(data) {}
    });
  }
}
*/

// start application
jQuery(document).ready(function($) {
  initializeEditor();
  //jquery 1.7
  $(document).on('focus', '.contentEditor', function() {activateEditor($(this))});
  $(document).on('blur', '.contentEditor', function() {deactivateEditor()});
  $(document).on('keydown', '.contentEditor', onKeyPress);
  // blur sie konczy
  
});

