
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

// instructions
var InstructionList = ['stb', 'stba', 'sth', 'stha', 'st', 'sta', 'std', 'stda'     , 
                       'ldsb', 'ldsba', 'ldsh', 'ldsha', 'ldub', 'lduba', 'lduh'    , 
					   'lduha', 'ld', 'lda', 'ldd', 'ldda', 'ldstub', 'ldstuba'     , 
					   'swap', 'swapa', 'sethi', 'add', 'addcc', 'addx', 'addxcc'   , 
					   'and', 'andcc', 'andn', 'andncc', 'mulscc', 'or', 'orcc'     , 
					   'orn', 'orncc', 'udiv', 'udivcc', 'umul', 'umulcc', 'sdiv'   , 
					   'sdivcc', 'smul', 'smulcc', 'sub', 'subcc', 'subx', 'subxcc' , 
					   'taddcc', 'taddcctv', 'tsubcc', 'tsubcctv', 'xor', 'xorcc'   , 
					   'xnor', 'xnorcc', 'sll', 'sra', 'srl', 'bn', 'ba', 'be', 'bz', 
					   'bne', 'bnz', 'ble', 'bg', 'bl', 'bge', 'bleu', 'bgu', 'bcs' , 
					   'blu', 'bcc', 'bgeu', 'bneg', 'bpos', 'bvs', 'bvc', 'jmpl'   , 
					   'rett', 'call', 'restore', 'save', 'tn', 'ta', 'te', 'tz'    , 
					   'tne', 'tnz', 'tle', 'tg', 'tl', 'tge', 'tleu', 'tgu', 'tcs' , 
					   'tlu', 'tcc', 'tgeu', 'tneg', 'tpos', 'tvs', 'tvc', 'nop'    , 
					   'unimp', 'stbar', 'rd', 'wr', 'flush' ];

// simple synthetics (single line -> single line)
var SimpleSyntheticList = ['bclr', 'bset', 'btst', 'btog', 'call', 'clr', 'clrb', 
                           'clrh', 'cmp', 'dec', 'deccc', 'inc', 'inccc', 'jmp' , 
                           'mov', 'neg', 'not', 'restore', 'save', 'ret', 'retl', 
                           'tst' ];

// complex synthetics (single line -> multiple lines)
var ComplexSyntheticList = ['set'];

var getInstructionList      = function() { return InstructionList;      };
var getSimpleSyntheticList  = function() { return SimpleSyntheticList;  };
var getComplexSyntheticList = function() { return ComplexSyntheticList; };


/* classes */

// this class, whose constructor is given the raw text of a line of
// code, parses said line into all the relevant 'words' within the line.
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
	var labelDefinitions = new Object();
	var simpleSyntheticList  = getSimpleSyntheticList();
	var complexSyntheticList = getComplexSyntheticList();
	var instructionList      = getInstructionList();
	
	this.parse = function() {
	
		//get text (lines) from aceEditor object.
		var rawCodeLines = aceEditSession.getLines(0, aceEditSession.getLength())
		
		// convert raw code lines into CodeLine objects
		var parsedLines = parseRawLines(rawCodeLines);
		
		// convert CodeLine objects into SimpleCodeLine objects, omitting blank lines and
		// creating a map of labels to line numbers.
		var simpleLines = processCodeLines(parsedLines);
		
		
		
		
		
		
		
		/** START DEBUG SECTION **/
		
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
		
		/**  END DEBUG SECTION  **/
		
		
		
	};
	
	// converts raw code lines into CodeLine objects
	var parseRawLines = function(rawCodeLines) {
		parsedLines = new Array();
		for (rawLineIndex in rawCodeLines) {
			var thisLine = new CodeLine(rawCodeLines[rawLineIndex], (parseInt(rawLineIndex) + 1));
			parsedLines.push(thisLine);
		}
		return parsedLines;
	};
	
	// converts a list of CodeLine objects into a list of SimpleCodeLine objects,
	// also fills the private class attribute labelDefinitions object with label
	// to line maps.
	var processCodeLines = function(parsedLines) {
		simpleLines = new Array();
		var hasWaitingLabel = false;
		var waitingLabels = new Array();
		
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
						
						if (thisLine.hasLabel === true) {
							// add this line's label to the list.
							labelDefinitions[thisLine.label] = thisLine.lineNumber;
						}
						
						if (hasWaitingLabel === true) {
							// add any previously defined labels to the list for this line number.
							for (waitingLabelIndex in waitingLabels) {
								labelDefinitions[waitingLabels[waitingLabelIndex]] = thisLine.lineNumber;
							}
							waitingLabels = new Array();
							hasWaitingLabel = false;
						}
					}
			}
		}
		
		return simpleLines;
	}
	
	
	var createInstructionObjects = function(simpleLines) {
		var instructionObjects = new Array();
		
		for (simpleLineIndex in simpleLine) {
			thisLine = simpleLines[simpleLineIndex];
			
			/** Instructions **/ 
			var whatever = "debug";
			instructionObjects.push(whatever);
			
			/** Simple Synthetics **/
			instructionObjects.push(whatever);
			
			/** Complex Synthetics **/
			var whatevers = whatever;
			for (whatevers in whatever) {
				instructionObjects.push(whatevers);
			}
			
		}
		
	};
	
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


















