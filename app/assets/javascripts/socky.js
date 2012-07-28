// initialize variables
var socky, channel, editor = null;
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
  window.clearInterval(editor.updater);
  editor = null;
}

function activateEditor(p) {
  var initialBuffer = new Buffer([new Segment(uid, p.text())]);
  
  editor = {
    area: p,
    lineId: p.attr('id').replace('line-',''),
    currentContent: p.text(),
    previousContent: p.text(),
    state: new State(initialBuffer, new Vector()),
    userId: uid,
    updater: null
  }

  // initialize 
  editor.previousContent = p.text();
  // bind jquery events
  editor.updater = window.setInterval(invokeEditorUpdate, 5000);// 5 seconds
}

function getEditor(p) {

  var initialBuffer = new Buffer([new Segment(uid, p.text())]);
  
  var remoteEditor = {
    area: p,
    lineId: p.attr('id').replace('line-',''),
    currentContent: p.text(),
    previousContent: p.text(),
    state: new State(initialBuffer, new Vector()),
    userId: uid
  }

  // initialize 
  remoteEditor.previousContent = p.text();
  
  if (editor!= null && remoteEditor.lineId == editor.lineId){
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

    //event.preventDefault();
    
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
    console.log(diffs);
    
    // każda roznca wykryta jest tablicą w diff, pierwszy elem okresla czy to insert 1 , del -1 czy bez zmian 0
     
    // beginning of the text
    var offset = 0; 

    // process diffs to create operational transformations

    // for each diff
    for (var diffIndex in diffs) {
  		var diffData = diffs[diffIndex];
	  	var diffType = diffData[0];
	  	var diffText = diffData[1];

	  	if (diffType == 1) {// Text has been inserted. Create an insert request out of the change.
        // Creates a new Segment instance given a user ID and a string.
        // text
  			var buffer = new Buffer([new Segment(editor.userId, diffText)]);

        // Create new Insert Operation instance for given segment at initial offset
  			var operation = new Operations.Insert(offset, buffer); // offset - place from
  
        // Create new operation request with current user, vector an given operation
  			var request = new DoRequest(editor.userId, editor.state.vector, operation);

	  		// Post the request to the socky server
        sockySendCommand({command: "insert", params: [editor.userId, request.vector.toString(), offset, diffText], lineId: editor.lineId});

	  		// Execute the request locally to update the internal buffer.        
	  		editor.state.execute(request);
        
        // increase offset
	  		offset += diffText.length;

	  	} else if (diffType == -1) {// Text has been removed.
        
        // Creates a new Segment instance given a user ID and a string.
	  		var buffer = editor.state.buffer.slice(offset, offset + diffText.length);
	  		var operation = new Operations.Delete(offset, buffer);
	  		var request = new DoRequest(editor.userId, editor.state.vector, operation);

	  		sockySendCommand({command: "delete", params: [editor.userId, request.vector.toString(), offset, diffText.length], lineId: editor.lineId});
	  		editor.state.execute(request);
	  	} else {
	  		offset += diffText.length;
	  	}
	  }

  	editor.previousContent = editor.currentContent = editor.area.text();
	  //$("#buffer").html(editor.state.buffer.toHTML());
	  
	  lineId = editor.lineId;
    saveChanges(lineId, editor.currentContent);
}

function processReceivedCommand(data) {
  var currentEditor = getEditor($('#line-' + data.lineId));
  console.log("Editor: ");
  console.log(currentEditor)
  if(data.command == "insert") {
			//if (data.params[0] != currentEditor.userId) {
				// We have received an insert request from another user.

				var buffer = new Buffer([new Segment(data.params[0], data.params[3])]);
				var operation = new Operations.Insert(data.params[2], buffer);
				var request = new DoRequest(data.params[0], new Vector(data.params[1]), operation);
        
				var executedRequest = currentEditor.state.execute(request); // state.execute - OT
				updateControl(executedRequest, currentEditor);
			//}
	} else if (data.command == "delete") {
			//if (data.params[0] != currentEditor.userId) {
				// We have received a delete request from another user.

				var operation = new Operations.Delete(data.params[2], data.params[3]);
				var request = new DoRequest(data.params[0], new Vector(data.params[1]), operation);

				var executedRequest = currentEditor.state.execute(request);
				updateControl(executedRequest, currentEditor);
			//}
	}
}

// set sursor on end
function updateControl(executedRequest, editor){
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

			processDeleteOperation(executedRequest.operation);

			// Restore cursor position
			editor.area.selectionStart = selectionStart;
			editor.area.selectionEnd = selectionEnd;
		}  
}

function updateFromBuffer(editor) {
  editor.previousContent = editor.currentContent = editor.state.buffer.toString();
	//$("#buffer").html(editor.state.buffer.toHTML());
  // set the current value to editor
  editor.area.text(editor.currentContent);
}

function onKeyPress(event) {
  if (event.keyCode == 13) {
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
        success: function(line) {
          '<p id="line-'+ line.id +'" class="contentEditor" contenteditable=""></p>';
        },
        error: function(data) {}
    });
  }
}

// start application
jQuery(document).ready(function($) {
  initializeEditor();
  //jquery 1.7
  $(document).on('blur', '.contentEditor', function() {deactivateEditor()});
  $(document).on('focus', '.contentEditor', function() {activateEditor($(this))});
  $(document).on('keypress', '.contentEditor', onKeyPress);
  // blur sie konczy
  
});

