
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
			$("#debugbox").append('<br /><br/>');
		}
	};
	
	var parseLine = function(lineString, lineNumber) {
	
		var lineNumber =      lineNumber;
		var line_Original =   lineString;
		var line_NoComments = $.trim(line_Original.split("!", 1)[0]);
		
		var lineBreakdownPatt = /(([\S]+):)?\s*(([\S]+)(\s+([^,\s]*)\s*(,\s*([^,\s]*))?\s*(,\s*([^,\s]*))?\s*(,\s*([^,\s]*))?)?)?/i;
		//                       12            34      5   6           7    8             9    1             1    1  
		//                                                                                     0             1    2  
		var reResults = line_NoComments.match(lineBreakdownPatt);
		
		var line_Label =     reResults[2];
		var line_Directive = reResults[4];
		var line_Param1 =    reResults[6];
		var line_Param2 =    reResults[8];
		var line_Param3 =    reResults[10];
		var line_Param4 =    reResults[12];
		
		
		return '{LABEL: ' + line_Label + '}-{DIR: ' + line_Directive + '}-{PAR1: ' + line_Param1 + '}-{PAR2: ' + line_Param2 + '}-{PAR3: ' + line_Param3 + '}-{PAR4: ' + line_Param4 + '}';
	};
	
}


function SpDir() { }

function SpDir_BlankLine() {
	this.prototype = new SpDir();
}

function SpDir_ADD() {
	this.prototype = new SpDir();
	
}


















