
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


function CodeLine(codeString, codeLine) {
	this.originalCode = codeString;
	this.lineNumber = codeLine;
	this.comment = "";
	this.hasLabel = false;
	this.label = "";
	this.hasInstruction = false;
	this.instruction = "";
	this.parameters = new Array();
	
	{ /** Construction **/
		// comment
		if (codeString.indexOf("!") !== -1) {
			this.comment = $.trim(codeString.substring(codeString.indexOf("!")));
			codeString = codeString.split("!", 1)[0];
		}
		
		// label
		if (codeString.indexOf(":") !== -1) {
			this.hasLabel = true;
			var codeColonSplit = codeString.split(":");
			this.label = $.trim(codeColonSplit[0]);
			codeString = $.trim(codeColonSplit[codeColonSplit.length-1]);
		}
		
		// instruction
		codeString = $.trim(codeString.replace(/\s{2,}/g, " "));
		if (codeString.length > 0) {
			this.hasInstruction = true;
			this.instruction = codeString.split(" ", 1)[0];
			
			// parameters
			var paramCode = codeString.substring(this.instruction.length);
			var paramsUntrimmed = paramCode.split(",");
			for (param in paramsUntrimmed) {
				this.parameters.push($.trim(paramsUntrimmed[param]));
			}
		}
	}
}






function RSim_SyntaxAnalysis() {
	var aceEditSession = aceEditor.getSession();
	var rawCodeLines = new Array();
	var parsedLines = new Array();
	var simpleLines = new Array();
	var labelDefinitions = new Object();
	
	this.parse = function() {

		//get text (lines) from aceEditor object.
		rawCodeLines = aceEditSession.getLines(0, aceEditSession.getLength())
		
		// convert raw code lines into CodeLine objects
		//    rawCodeLines[] -> parsedLines[]
		parsedLines = new Array();
		for (rawLineIndex in rawCodeLines) {
			thisLine = new CodeLine(rawCodeLines[rawLineIndex], (parseInt(rawLineIndex) + 1));
			parsedLines.push(thisLine);
		}
		
		// convert CodeLine objects into SimpleCodeLine objects, omitting blank lines and
		// creating a map of labels to line numbers.
		//    parsedLines[] -> simpleLines[]
		var hasWaitingLabel = false;
		var waitingLabels = new Array();
		simpleLines = new Array();
		for (parsedLineIndex in parsedLines) {
			var thisLine = parsedLines[parsedLineIndex];
			
			if (thisLine.hasInstruction || thisLine.hasLabel) {
					if (thisLine.hasInstruction === false) {
						// this line is simply a label declaration. apply this label to the next instruction line.
						hasWaitingLabel = true;
						waitingLabels.push(thisLine.label);
					} else {
						// this line has an instruction. add it to the list.
						simpleLines.push(new SimpleCodeLine(thisLine.instruction, thisLine.parameters, thisLine.lineNumber));
						
						// add this line's label to the list.
						if (thisLine.hasLabel === true) {
							//labelDefinitions.push(new LabelDefinition(thisLine.label, thisLine.lineNumber));
							labelDefinitions[thisLine.label] = thisLine.lineNumber;
						}
						
						// add any previously defined labels to the list for this line number.
						if (hasWaitingLabel === true) {
							for (waitingLabelIndex in waitingLabels) {
								//labelDefinitions.push(new LabelDefinition(waitingLabels[waitingLabelIndex], thisLine.lineNumber));
								labelDefinitions[waitingLabels[waitingLabelIndex]] = thisLine.lineNumber;
							}
							hasWaitingLabel = false;
							waitingLabels = new Array();
						}
					}
			}
		}
		
		// debug
		$("#debugbox").text(""); //debug
		for (i in simpleLines) {
			thisLine = simpleLines[i];
			//$("#debugbox").append();
			$("#debugbox").append('{' + thisLine.lineNumber + '}{');
			$("#debugbox").append(thisLine.instruction + '}{');
			$("#debugbox").append(thisLine.parameters + '}{');
			$("#debugbox").append('<br /><br/>');
		}
		
		$("#debugbox").append('<br /><br/>');
		
		for (key in labelDefinitions) {
			if (labelDefinitions.hasOwnProperty(key)) {
				$("#debugbox").append('{' + key + ': ' + labelDefinitions[key] + '}');
				$("#debugbox").append('<br />');
			}
		}
		
		
		
		
	};
	
	var 
	
}

function SimpleCodeLine(instruction, parameters, lineNumber) {
	this.instruction = instruction;
	this.parameters = parameters;
	this.lineNumber = lineNumber;
}

function LabelDefinition(labelString, lineNumber) {
	this.labelString = labelString;
	this.lineNumber = lineNumber;
}

function Instruction() { }

function Instruction_BlankLine() {
	this.prototype = new SpDir();
}

function Instruction_ADD() {
	this.prototype = new SpDir();
	
}


















