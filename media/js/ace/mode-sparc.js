define('ace/mode/sparc', function(require, exports, module) {

var oop = require("ace/lib/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var SparcHighlightRules = require("ace/mode/sparc_highlight_rules").SparcHighlightRules;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new SparcHighlightRules().getRules());
};
oop.inherits(Mode, TextMode);

(function() {
    // Extra logic goes here. (see below)
}).call(Mode.prototype);

exports.Mode = Mode;
});

define('ace/mode/sparc_highlight_rules', function(require, exports, module) {

var oop = require("ace/lib/oop");
var lang = require("../lib/lang");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;
var SparcHighlightRules = function() {

	/* define some maps to store a list of keywords, etc. */
	var keywords = lang.arrayToMap(
        ("add|addx|and|andn|or|orn|udiv|umul|sdiv|smul|sub|subx|taddcc|tsubcc|xor|xnor|" +
        "addcc|addxcc|andcc|andncc|mulscc|orcc|orncc|udivcc|umulcc|sdivcc|smulcc|subcc|" + 
		"subxcc|taddcctv|tsubcctv|xorcc|xnorcc").split("|") );

    var builtinConstants = lang.arrayToMap(
        ("\\.align|\\.ascii|\\.asciz|\\.byte|\\.data|\\.global|\\.half|\\.include|\\.skip|" + 
		"\\.text|\\.word").split("|") );

    var builtinFunctions = lang.arrayToMap(
        ("%lo|%hi").split("|") );
	
	/* define the rules for SPARC */
	this.$rules =  {
		"start" : [ 
		{
            token : "comment",
            regex : "\\!.*$"
        }, {
            token : "keyword.operator",
            regex : "\\+|\\-"
        }, {
			// here we check a bunch of maps for item presence, and return appropriate tokens
            token : function(value) {
                if (keywords.hasOwnProperty(value))
                    return "keyword";
                else if (builtinConstants.hasOwnProperty(value))
                    return "constant.language";
                else if (builtinFunctions.hasOwnProperty(value))
                    return "support.function";
                else
                    return "identifier";
           }, regex : "[a-zA-Z_$%][a-zA-Z0-9_$]*\\b"
		}, {
			token: "markup.italic",
			regex: "[a-zA-Z_\\.][a-zA-Z0-9_\\.]\\:\\b"
		}
	] }
    
}

oop.inherits(SparcHighlightRules, TextHighlightRules);

exports.SparcHighlightRules = SparcHighlightRules;

});