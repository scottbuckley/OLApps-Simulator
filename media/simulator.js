// manually import ace's 'Range' class as aceRange, to overload the one many browsers have.
var aceRange = require('ace/range').Range;

var MAX_INT =       2147483647;
var MIN_INT =      -2147483648;
var INT_2POWER32 =  4294967296;

/* global variables */
var aceEditor;
var myMachine;

/* functions */
var StartMachine = function(editor) {
	aceEditor = editor;
	myMachine = new Machine();
};

/*  "Parse" button */
var PressButtonParse = function() {
	hideAllAlerts();
	myMachine.parse();
};

/* "Execute" button */
var PressButtonExecute = function() {
	myMachine.execute();
	myMachine.updateTable();
};

/* This is called when an alert area with a line number is mouseEnter'd */
var currentHoverHighlightMarker;
var editor_HoverHighlightOn = function(lineNumber) {
	currentHoverHighlightMarker = aceEditor.getSession().addMarker(new aceRange(lineNumber-1, 0, lineNumber-1, 1), "ace_hoverhighlight", "line", true);
};

/* This is called when an alert area with a line number is mouseLeave'd */
var editor_HoverHighlightOff = function() {
	aceEditor.getSession().removeMarker(currentHoverHighlightMarker);
};

/* this should be called when an error is found. */
var reportError = function(errMsg, lineNum) {
	if (lineNum) {
		showAlert("<b>Line {0}:&nbsp;</b>{1}".format(lineNum, errMsg), lineNum);
	} else {
		showAlert(errMsg);
	}
};

/* shows a jquery/bootstrap error alert. */
var alert_idnumber = 1;
var showAlert = function(message, lineHighlight) {
	/* stuff to build alert */
	var type = "error";
	var newID = "altNm" + alert_idnumber; alert_idnumber += 1;
	var closeButton = "<button type='button' class='close' data-dismiss='alert'>&#215;</button>"; // &#215; defines a mutliplication symbol.
	
	/* build alert */
	$("#alert-area").append($("<div id='" + newID + "' " + " class='alert alert-" + type + " hide fade in' data-dismiss='alert'>" + closeButton + message + "</div>"));
	
	/* maybe give the alert some 'hover' functionality */
	if (!(typeof lineHighlight === 'undefined')) {
		$("#" + newID).hover(
			function(){ // this happens on MouseEnter
				editor_HoverHighlightOn(lineHighlight);
			},
			function(){ // this happens on MouseLeave
				editor_HoverHighlightOff();
			}
		);
	}
	
	/* make the alert 'slide open' */
	$("#" + newID).slideDown();
};

var hideAllAlerts = function() {
	editor_HoverHighlightOff();
	$("#alert-area").html("");
};


var LockEditor = function() {
	aceEditor.setReadOnly(true);
	$("#editor_wrapper").addClass("editor_disabled");
};

var UnlockEditor = function() {
	aceEditor.setReadOnly(false);
	$("#editor_wrapper").removeClass("editor_disabled");
};

/* adding 'format' to string's prototype, for easier string formatting (thanks to fearphage from stackoverflow) */
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
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

/* list getters */
var getInstructionList      = function() { return InstructionList;      };
var getSimpleSyntheticList  = function() { return SimpleSyntheticList;  };
var getComplexSyntheticList = function() { return ComplexSyntheticList; };


/* classes */

function Machine() {
	/* private attributes */
	var myParser    = new Parser();
	var myMemory    = new Memory();
	var myRegisters = new Registers();
	
	var myInstructions = new Array();
	var currentInstructionIndex = 0;
	var doBranch = false;
	var curBranchLine = -1;
	
	this.init = function() {
		this.updateTable();
	};
	
	/* public methods */
	
	// tell the Parser object to parse the user text
	this.parse = function() {
		myInstructions = myParser.parse(myRegisters.isValidReg);
		currentInstructionIndex = 0;
		prepForExec();
	};
	
	//prepare for next execution (move arrow)
	var prepForExec = function() {
		var currentInstruction = myInstructions[currentInstructionIndex];
		var lineNumber = currentInstruction.lineNumber;
		aceEditor.getSession().setAnnotations([{row: (lineNumber-1), column: 0, text: "Next Instruction", type: "info"}]);
	};
	
	this.execute = function() {
		
		/* Display an error if we aren't ready */
		if (myInstructions.length === 0) { reportError("No instructions available to execute (parse first)."); return false; };
		
		var currentInstruction = myInstructions[currentInstructionIndex];
		var execResult = !!currentInstruction.execute(myRegisters, myMemory);
		
		if (doBranch) {
			currentInstructionIndex = (curBranchLine-1);
			doBranch = false; curBranchLine = -1;
		} else {
			currentInstructionIndex++;
			if (currentInstructionIndex >= myInstructions.length) { currentInstructionIndex = 0; }
		}
		
		if (execResult && currentInstruction.isBranch) {
			doBranch = true;
			curBranchLine = currentInstruction.getBranchLine();
		} else {
			doBranch = false;
		}
		
		prepForExec();
	};
	
	this.updateTable = function() {
		var regCount = myRegisters.getRegCount();
		var jQueryCellPrefix = "#reg";
		
		for (var i=0; i<32; i++) {
			var cellName  = jQueryCellPrefix + pad(i, 2);
			var cellValue = myRegisters.getRegFromIndex(i);
			$(cellName).text(intHex(cellValue));
			//$(cellName).text(intHex(cellValue) + " [{0}]".format(cellValue)); //debug, this shows the register's value in decimal.
		}
		
		$("#regN").text("n: " + myRegisters.getReg("n"));
		$("#regZ").text("z: " + myRegisters.getReg("z"));
		$("#regV").text("v: " + myRegisters.getReg("v"));
		$("#regC").text("c: " + myRegisters.getReg("c"));
	};
	
	/* private methods */
	var intHex = function(num) {
		var n = num;
		var out = "";
		for (i=0; i<8; i++) {
			// prepend lowest 4 bits as hex character, then shift 4 bits to the right
			out = (n & 15).toString(16) + out;
			n = n >> 4;
		}
		return out.toUpperCase();
	};
	
	var pad = function(num, size) {
		var s = num+"";
		while (s.length < size) s = "0" + s;
		return s;
	};
	
	
	
	this.init();

	
}

function MemoryBlock(newBlockIndex, memBlockSize) {
	/* private attributes */
	var MEMBLOCK_SIZE;
	var blockIndex;
	var words;
	var wordCount;
	
	
	{ /** Constructor **/
		blockIndex = newBlockIndex;
		MEMBLOCK_SIZE = memBlockSize;
		wordCount = memBlockSize / 4;
		words = new Array(wordCount);
		initialiseData();
	}
	
	/* public methods */
	this.getWord = function(address) {
		if (isAligned(address)) {
			if (isInRange(address)) {
				var relevantWordIndex = (address-blockIndex)/4;
				return words[relevantWordIndex]
			} else {
				reportError("Internal Error: calling MemoryBlock[{0}] with incorrect Address ({1})".format(blockIndex, address));
				return false;
			}
		} else {
			reportError("Error: Calling getWord() with unaligned word address.");
			return false;
		}
	};
	
	this.setWord = function(address, value) {
		if (isAligned(address)) {
			if (isInRange(address)) {
				var relevantWordIndex = (address-blockIndex)/4;
				words[relevantWordIndex] = value
				return true;
			} else {
				reportError("Internal Error: calling MemoryBlock[{0}] with incorrect Address ({1})".format(blockIndex, address));
				return false;
			}
		} else {
			reportError("Error: Calling setWord() with unaligned word address.");
			return false;
		}
	};
	
	/* private methods */
	var initialiseData = function() {
		for (var i=0; i<25; i++) {
			words[i] = 0;
		}
	};
	
	var isInRange = function(address) {
		if (address < blockIndex) return false;
		if (address >= (blockIndex + MEMBLOCK_SIZE)) return false;
		return true;
	};
	
	var isAligned = function(address) {
		return ((address%4) == 0);
	};
	
}

function Memory() {
	/* private constants */
	var MEMBLOCK_SIZE = 100;
	
	/* private attributes */
	var memBlocks = new Object();
	
	/* private methods */
	var getBlockIndex = function(address) {
		return address - (address % MEMBLOCK_SIZE);
	};
	
	var isBlockAvail = function(blockIndex) {
		return memBlocks.hasOwnProperty(blockIndex);
	};
	
	/* public methods */
	this.getWord = function(address) {
		var blockIndex = getBlockIndex(address);
		if (!isAddressAvail(blockIndex)) {
			memBlocks[blockIndex] = new MemoryBlock(blockIndex, MEMBLOCK_SIZE);
		}
		return memBlocks[blockIndex].getWord(address);
	};
	
	this.setWord = function(address, value) {
		var blockIndex = getBlockIndex(address);
		if (!isAddressAvail(blockIndex)) {
			memBlocks[blockIndex] = new MemoryBlock(blockIndex, MEMBLOCK_SIZE);
		}
		return memBlocks[blockIndex].setWord(address, value);
	};
	
	this.getByte = function(address) {
		//FIXME: Implement (get word, shift into byte, return)
	};
}

function Registers() {
	/* private attributes*/
	var regValues;
	var strangeRegisters = [0, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48];
	
	var regCount = 49;
	var regDict = {
		
		/* NUMBERED REGISTERS */
		
		r0 : 0,      r1 :1 ,      r2 :2 ,      r3 :3 ,
		r4 : 4,      r5 :5 ,      r6 :6 ,      r7 :7 ,
		r8 : 8,      r9 :9 ,      r10:10,      r11:11,
		r12:12,      r13:13,      r14:14,      r15:16,
		r16:16,      r17:17,      r18:18,      r19:19,
		r20:20,      r21:21,      r22:22,      r23:23,
		r24:24,      r25:25,      r26:26,      r27:27,
		r28:28,      r29:29,      r30:30,      r31:31,
		
		 i0:24,       o0: 8,       l0:16,       g0: 0,
		 i1:25,       o1: 9,       l1:17,       g1: 1,
		 i2:26,       o2:10,       l2:18,       g2: 2,
		 i3:27,       o3:11,       l3:19,       g3: 3,
		 i4:28,       o4:12,       l4:20,       g4: 4,
		 i5:29,       o5:13,       l5:21,       g5: 5,
		 i6:30,       o6:14,       l6:22,       g6: 6,
		 i7:31,       o7:15,       l7:23,       g7: 7,
		 
		 fp:30,       sp:14,
		 
		/* SPECIAL REGISTERS (apart from %r0) */
		 
		  Y:32,       PC:33,      nPC:34,      WIM:35,
		
		// The next 13 make up the PSR. They are a few bits each.
		impl:36,
		 ver:37,
		   n:38,
		   z:39,
		   v:40,
		   c:41,
		  EC:42,
		  EF:43,
		 PIL:44,
		   S:45,
		  PS:46,
		  ET:47,
		 CWP:48
	};
	
	this.resetAllRegisters = function() {
		regValues = new Array(regCount)
		for (var i=0; i<regCount; i++) {
			regValues[i] = 0;
		}		
	};
	
	{ /** Construction. **/
		this.resetAllRegisters();
	}
	
	
	/* public methods */
	this.getRegFromIndex = function(regIndex) { // Not for general use
		if (strangeRegisters.indexOf(regIndex)!=-1) {
			return getSpecialRegValue(regIndex);
		} else {
			return regValues[regIndex];
		}
	}
	
	this.getReg = function(regStr) {
		var regIndex = regIndexFromString(regStr);
		
		if (strangeRegisters.indexOf(regIndex)!=-1) {
			return getSpecialRegValue(regIndex);
		} else {
			return regValues[regIndex];
		}
	};
	
	this.setReg = function(regStr, newValue) {
		var regIndex = regIndexFromString(regStr);
		
		if (strangeRegisters.indexOf(regIndex)!=-1) {
			setSpecialRegValue(regIndex, newValue);
		} else {
			regValues[regIndex] = newValue;
		}
	};
	
	this.getRegCount = function() {
		return regCount;
	};
	
	this.isValidReg = function(regStr) {
		return regDict.hasOwnProperty(regStr);
	};
	
	this.isInRange = function(intValue) {
		if (intValue > MAX_INT)
			return false;
		if (intValue < MIN_INT)
			return false;
		return true;
	};
	
	this.putInRange = function(intValue) {
		while (intValue > MAX_INT) {
			intValue -= INT_2POWER32;
		}
		while (intValue < MIN_INT) {
			intValue += INT_2POWER32;
		}
		return intValue;
	};
	
	/* private methods */
	var regIndexFromString = function(regStr) {
		if (regDict.hasOwnProperty(regStr)) {
			return regDict[regStr];
		} else {
			// the given regStr is not a valid register identifier
			reportError("Error: '{0}' is not a valid register name".format(regStr));
			return false;
		}
	};
	
	var setSpecialRegValue = function(regIndex, newValue) {
		switch (regIndex) {
			case 0:
				return true;
			case 38: case 39: case 40: case 41: case 42: case 43: case 45: case 46: case 47:
				if (newValue != 0 && newValue != 1){
					reportError("Error assigning {0} to 1-bit special register.".format(newValue));
				} else {
					regValues[regIndex] = newValue;
				}
				return true;
			default:
				reportError("Error: Register index {0} is not a special register.".format(regIndex));
				return false;
		}
	};
	
	var getSpecialRegValue = function(regIndex) {
		switch (regIndex) {
			case 0:
				return 0;
			case 38: case 39: case 40: case 41: case 42: case 43: case 45: case 46: case 47:
				return regValues[regIndex];
			default:
				reportError("Error: Register index {0} is not a special register.".format(regIndex));
				return false;
		}
	};
}


/* PARSER CLASS deals with code processing */
function Parser() {
	var aceEditSession       = aceEditor.getSession();
	var labelDefinitions     = new Object(); //dict
	var simpleSyntheticList  = getSimpleSyntheticList();
	var complexSyntheticList = getComplexSyntheticList();
	var instructionList      = getInstructionList();
	var InstructionObjects   = undefined;
	var regVerifyFunc;
	
	this.parse = function(myRegVerifyFunc) {
		// store the function for verifying the name of a register
		regVerifyFunc = myRegVerifyFunc;
		
		// get text (lines) from aceEditor object.
		var rawCodeLines = aceEditSession.getLines(0, aceEditSession.getLength())
		
		// convert raw code lines into CodeLine objects
		var parsedLines = parseRawLines(rawCodeLines);
		
		// convert CodeLine objects into SimpleCodeLine objects, omitting blank lines and
		// creating a map of labels to line numbers.
		var simpleLines = processCodeLines(parsedLines);
		
		//convert simpleCodeLine objects into a list of InstructionObjects, which are ready to execute
		InstructionObjects = createInstructionObjects(simpleLines);
		
		
		/** START DEBUG SECTION **/
		/*
			// debug
			$("#debugbox").text(""); //debug
			for (i in simpleLines) {
				thisLine = simpleLines[i];
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
		*/
		/**  END DEBUG SECTION  **/
		
		return InstructionObjects;
		
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
	};
	
	//returns -1 if invalid label
	var getLineFromLabel = function(labelString) {
		if (labelDefinitions.hasOwnProperty(labelString)) {
			return labelDefinitions[labelString];
		} else {
			return -1;
		}
	};
	
	var createInstructionObjects = function(simpleLines) {
		var instructionObjects = new Array();
		
		for (simpleLineIndex in simpleLines) {
			thisLine = simpleLines[simpleLineIndex];
			
			/** Instructions **/ 
			if (instructionList.indexOf(thisLine.instruction)!=-1) {
				var thisInstr = instructionObjectFromSimpleLine(thisLine);
				instructionObjects.push(thisInstr);
			}
			
			
			/** Simple Synthetics **/
			//instructionObjects.push(whatever);
			
			/** Complex Synthetics **/
			//var whatevers = whatever;
			//for (whatevers in whatever) {
			//	instructionObjects.push(whatevers);
			//}
			
		}
		
		return instructionObjects;
	};
	
	var instructionObjectFromSimpleLine = function(sLine) {
		switch (sLine.instruction) {
			//arithmetic/logic
			case "and":      return new Instruction_AND   (sLine, regVerifyFunc, getLineFromLabel);
			case "or":       return new Instruction_OR    (sLine, regVerifyFunc, getLineFromLabel);
			case "add":      return new Instruction_ADD   (sLine, regVerifyFunc, getLineFromLabel);
			case "addcc":    return new Instruction_ADDCC (sLine, regVerifyFunc, getLineFromLabel);
			case "sub":      return new Instruction_SUB   (sLine, regVerifyFunc, getLineFromLabel);
			case "subcc":    return new Instruction_SUBCC (sLine, regVerifyFunc, getLineFromLabel);
			//branch
			case "ba":       return new Instruction_BA    (sLine, regVerifyFunc, getLineFromLabel);
			case "bn":       return new Instruction_BN    (sLine, regVerifyFunc, getLineFromLabel);
			case "bz":       //bz is be
			case "be":       return new Instruction_BE    (sLine, regVerifyFunc, getLineFromLabel);
			case "bnz":      //bnz is bne
			case "bne":      return new Instruction_BNE   (sLine, regVerifyFunc, getLineFromLabel);
			case "bpos":     return new Instruction_BPOS  (sLine, regVerifyFunc, getLineFromLabel);
			case "bneg":     return new Instruction_BNEG  (sLine, regVerifyFunc, getLineFromLabel);
			case "bl":       return new Instruction_BL    (sLine, regVerifyFunc, getLineFromLabel);
			case "ble":      return new Instruction_BLE   (sLine, regVerifyFunc, getLineFromLabel);
			case "bg":       return new Instruction_BG    (sLine, regVerifyFunc, getLineFromLabel);
			case "bge":      return new Instruction_BGE   (sLine, regVerifyFunc, getLineFromLabel);
			//misc
			case "nop":      return new Instruction_NOP   (sLine, regVerifyFunc, getLineFromLabel);
			//error
			default:
				reportError("Error: The '{0}' instruction is not yet defined.".format(sLine.instruction));
				return false;
		}
	};
	
}

function SimpleCodeLine(instruction, parameters, lineNumber) {
	this.instruction = instruction.toLowerCase();
	this.parameters = parameters;
	this.lineNumber = lineNumber;
}

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


function Instruction(simpleLine, regVerify, labelVerify) {
	this.lineNumber  = simpleLine.lineNumber;
	this.parameters  = simpleLine.parameters;
	this.regVerify   = regVerify;
	this.labelVerify = labelVerify;
	
	/* Helper functions for parsing parameters */
	this.isNumeric = function(param) {
		if (param.search(/^-?[0-9]+$/) == -1)
			return false;
		else
			return true;
	}
	
	this.parseRegParameter = function(regString) {
		if (regString.charAt(0) == "%") {
			var regName = regString.substring(1);
			if (this.regVerify(regName)) {
				return regName;
			} else {
				reportError("'{0}' is not a valid register name.".format(regName), this.lineNumber);
				return false;
			}
		} else {
			reportError("Registers must start with a '%' character.", this.lineNumber);
			return false;
		}
	}
	
	// true when this instruction is a branch/trap/jump
	// (for branch delay slot stuff)
	this.isBranch = false;
	
	// performs the function of this instruction.
	// if this is a branching instruction, this function
	// returns true if branching happens, otherwise false.
	this.execute = function() {
		reportError("This instruction is not yet implemented.", this.lineNumber);
		return false;
	};
	
	// for branching instructions, this method returns
	// the line number to branch to (an integer)
	this.getBranchLine = function() {
		return -1;
	};
}


// BRANCH INSTRUCTION GROUP
function Instruction_Group_Branch(x,y,z) {
	Instruction.call(this,x,y,z);
	// parameter variables (public)
	
	this.labelString = "";
	this.isBranch = true;
	
	{ /** Construction **/
		
		if (this.parameters.length == 1) {
			//parameter 1 (label)
			this.labelString = this.parameters[0];
			if (this.labelVerify(this.labelString) == -1) {
				reportError("Invalid label '{0}'.".format(this.labelString), this.lineNumber);
			}
			
		} else {
			reportError("Incorrect number of parameters. Got {0}, expected 1.".format(this.parameters.length), this.lineNumber);
		}
	}
	
	this.getBranchLine = function() {
		return this.labelVerify(this.labelString);
	};
}

// BA Instruction
function Instruction_BA(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	this.execute = function(reg, mem) {
		//always branch
		return true;
	};
}

// BN Instruction
function Instruction_BN(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//never branch
		return false;
	};
}

// BE (or BZ) Instruction
function Instruction_BE(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if special register z is 1
		var z = (reg.getReg("z") === 1);
		return ( z );
	};
}

// BNE (or BNZ) Instruction
function Instruction_BNE(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if special register z is 0
		var z = (reg.getReg("z") === 1);
		return ( !z );
	};
}

// BPOS Instruction
function Instruction_BPOS(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if special register n is 0
		var n = (reg.getReg("n") === 1);
		return ( !n );
	};
}

// BNEG Instruction
function Instruction_BNEG(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if special register n is 1
		var n = (reg.getReg("n") === 1);
		return ( n );
	};
}

// BL Instruction
function Instruction_BL(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if special register n is 1
		var n = (reg.getReg("n") === 1);
		return ( n );
	};
}

// BG Instruction
function Instruction_BG(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if special register n is 0
		var n = (reg.getReg("n") === 1);
		return ( !n );
	};
}

// BLE Instruction
function Instruction_BLE(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if n or z
		var n = (reg.getReg("n") === 1);
		var z = (reg.getReg("z") === 1);
		return ( n || z );
	};
}

// BGE Instruction
function Instruction_BGE(x,y,z) {
	Instruction_Group_Branch.call(this,x,y,z);
	//   labelString (this.* inherited)
	
	this.execute = function(reg, mem) {
		//branch if !n
		var n = (reg.getReg("n") === 1);
		return ( !n );
	};
}


// ARITHMETIC INSTRUCTION GROUP
function Instruction_Group_Arithmetic(x,y,z) {
	Instruction.call(this,x,y,z);
	
	// parameter variables (public)
	this.regs1; this.regs2; this.regd;     // register source 1, register source 2, register destination.
	this.imm; this.is_imm;                 // immediate parameter value, has immediate instead of register source 2.
	
	{ /** Construction **/
		
		this.is_imm = false; //default
		
		if (this.parameters.length == 3) {
			//parameter 1
			this.regs1 = this.parseRegParameter(this.parameters[0]);
			
			//parameter 2
			this.is_imm = this.isNumeric(this.parameters[1]);
			if (this.is_imm) { this.imm = parseInt(this.parameters[1]); }
			else             { this.regs2 = this.parseRegParameter(this.parameters[1]); }
			
			//parameter 3
			this.regd = this.parseRegParameter(this.parameters[2]);
			
		} else {
			reportError("Incorrect number of parameters.", this.lineNumber);
		}
		
		this.clearICC = function(reg) {
			reg.setReg("n", 0);
			reg.setReg("z", 0);
			reg.setReg("v", 0);
			reg.setReg("c", 0);
		};
	}
}

// ADD Instruction
function Instruction_ADD(x,y,z) {
	Instruction_Group_Arithmetic.call(this,x,y,z);
	//   regs1, regs2, regd, imm, is_imm. (this.* inherited)
	
	this.execute = function(reg, mem) {
		var value = parseInt(reg.getReg(this.regs1));
		
		if (this.is_imm) {
			value += this.imm;
		} else {
			value += parseInt(reg.getReg(this.regs2));
		}
		value = reg.putInRange(value);
		
		reg.setReg(this.regd, value);
	};
}

// ADDCC Instruction
function Instruction_ADDCC(x,y,z) {
	Instruction_Group_Arithmetic.call(this,x,y,z);
	//   regs1, regs2, regd, imm, is_imm. (this.* inherited)
	
	this.execute = function(reg, mem) {
		var value = parseInt(reg.getReg(this.regs1));
		
		if (this.is_imm) {
			value += this.imm;
		} else {
			value += parseInt(reg.getReg(this.regs2));
		}

		this.clearICC(reg);
		
		// c/v (out of range (approximation))
		if (!reg.isInRange(value)) {
			reg.setReg("c", 1);
			reg.setReg("v", 1);
			value = reg.putInRange(value);
		}
		
		// z (zero)
		if (value == 0) {
			reg.setReg("z", 1);
		}
		
		// n (negative)
		if (value < 0) {
			reg.setReg("n", 1);
		}
		
		reg.setReg(this.regd, value);
	};
}

// SUBCC Instruction
function Instruction_SUBCC(x,y,z) {
	Instruction_Group_Arithmetic.call(this,x,y,z);
	//   regs1, regs2, regd, imm, is_imm. (this.* inherited)
	
	this.execute = function(reg, mem) {
		var value = parseInt(reg.getReg(this.regs1));
		
		if (this.is_imm) {
			value -= this.imm;
		} else {
			value -= parseInt(reg.getReg(this.regs2));
		}

		this.clearICC(reg);
		
		// c/v (out of range (approximation))
		if (!reg.isInRange(value)) {
			reg.setReg("c", 1);
			reg.setReg("v", 1);
			value = reg.putInRange(value);
		}
		
		// z (zero)
		if (value == 0) {
			reg.setReg("z", 1);
		}
		
		// n (negative)
		if (value < 0) {
			reg.setReg("n", 1);
		}
		
		reg.setReg(this.regd, value);
	};
}

// SUB Instruction
function Instruction_SUB(x,y,z) {
	Instruction_Group_Arithmetic.call(this,x,y,z);
	//   regs1, regs2, regd, imm, is_imm. (this.* inherited)
	
	this.execute = function(reg, mem) {
		var value = parseInt(reg.getReg(this.regs1));
		
		if (this.is_imm) {
			value -= this.imm;
		} else {
			value -= parseInt(reg.getReg(this.regs2));
		}
		value = reg.putInRange(value);
		
		reg.setReg(this.regd, value);
	};
}

// AND Instruction
function Instruction_AND(x,y,z) {
	Instruction_Group_Arithmetic.call(this,x,y,z);
	//   regs1, regs2, regd, imm, is_imm. (this.* inherited)
	
	this.execute = function(reg, mem) {
		var value = parseInt(reg.getReg(this.regs1));
		
		if (this.is_imm) {
			value = (value & this.imm);
		} else {
			value = (value & parseInt(reg.getReg(this.regs2)));
		}
		
		reg.setReg(this.regd, value);
	};
}

// OR Instruction
function Instruction_OR(x,y,z) {
	Instruction_Group_Arithmetic.call(this,x,y,z);
	//   regs1, regs2, regd, imm, is_imm. (this.* inherited)
	
	this.execute = function(reg, mem) {
		var value = parseInt(reg.getReg(this.regs1));
		
		if (this.is_imm) {
			value = (value | this.imm);
		} else {
			value = (value | parseInt(reg.getReg(this.regs2)));
		}
		
		reg.setReg(this.regd, value);
	};
}

// NOP Instruction
function Instruction_NOP(x,y,z) {
	Instruction.call(this,x,y,z);
	
	this.execute = function(reg, mem) {
		//do nothing
	};
}











