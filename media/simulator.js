
/* variables */
var aceEditor;
var SynAn = new RSim_SyntaxAnalysis();

/* functions */
var RSimInitialise = function(editor) {
	aceEditor = editor;
};

var RSimParse = function() {
	SynAn.parse(aceEditor.getValue());
};

var LockEditor = function() {
	aceEditor.setReadOnly(true);
	$("#editor_wrapper").addClass("editor_disabled");
};

var UnlockEditor = function() {
	aceEditor.setReadOnly(false);
	$("#editor_wrapper").removeClass("editor_disabled");
};

/* classes */
function RSim_SyntaxAnalysis() {
	var originalCode = "";
	var codeLines = new Array();
	
	this.parse = function(codeString) {
		originalCode = codeString;
		codeLines = codeString.split('\n');
		
		// display the separated lines from the code
		$("#debugbox").text("");
		for (line in codeLines) {
			$("#debugbox").append('[ ' + codeLines[line] + ' ]<br />');
		}
	};
}
