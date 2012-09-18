
/* variables */
var aceEditor;
var SynAn;

/* functions */
var RSimInitialise = function(editor) {
	aceEditor = editor;
	SynAn = new RSim_SyntaxAnalysis();
};

var RSimParse = function() {
	SynAn.parse();
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
	var aceEditSession = aceEditor.getSession();
	var codeLines = new Array();
	
	this.parse = function() {
		codeLines = aceEditSession.getLines(0, aceEditSession.getLength())
		
		// display the separated lines from the code
		$("#debugbox").text("");
		for (line in codeLines) {
			//$("#debugbox").append('' + line + ' [ ' + codeLines[line] + ']');
			$("#debugbox").append('' + parseLine(codeLines[line], line+1) + '');
			$("#debugbox").append('<br />');
		}
	};
	
	var parseLine = function(lineString, lineNumber) {
	
		var lineNumber =      lineNumber;
		var line_Original =   lineString;
		var line_NoComments = $.trim(line_Original.split("!", 1)[0]);
		
		var lineBreakdownPatt = /(([\S]+:)?\s*(\S+))?(\s+([^,]*)\s*(,\s*([^,]*))?\s*(,\s*([^,]*))?\s*(,\s*([^,]*))?)?/i;
		var reResults = line_NoComments.match(lineBreakdownPatt);
		
		var line_Label =     reResults[2];
		var line_Directive = reResults[3];
		var line_Param1 =    reResults[5];
		var line_Param2 =    reResults[7];
		var line_Param3 =    reResults[9];
		var line_Param4 =    reResults[11];
		
		/* Manual parsing of commands. Replaced with RegExp parsing
		var line_Label;
		var line_NoLabel;
		var line_LabelSplit = line_NoComments.split(":");
		
		// if line_NoComments contains a ":"
		if (line_NoComments.indexOf(":") !== -1) {
			line_Label =   $.trim(line_NoComments.split(":", 1)[0]);
			line_NoLabel = $.trim(line_NoComments.substring(line_Label.length+1));
		} else {
			line_Label =   "";
			line_NoLabel = line_NoComments;
		}
		
		var line_Directive =     line_NoLabel.split(/\W/, 1)[0];
		var line_Parameters =    $.trim(line_NoLabel.substring(firstItem.length));
		var line_ParameterList = line_Parameters.split(",");
		*/
		
		
		return '{' + line_Label + '}-{' + line_Directive + '}-{' + line_Param1 + '}-{' + line_Param2 + '}-{' + line_Param3 + '}-{' + line_Param4 + '}';
	};
	
}


function SpDir() { }

function SpDir_BlankLine() {
	this.prototype = new SpDir();
}

function SpDir_ADD() {
	this.prototype = new SpDir();
	
}


















