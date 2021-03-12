var _ = require("underscore");
var clonedeep = require('lodash.clonedeep');

module.exports.messages = {
    YOUGO : "you go",
    ITSVERYDARKHERE : "it is very dark here",
    YOUCANTGOTHATWAY : '<amazon:emotion name="disappointed" intensity="medium">you cannot go that way</amazon:emotion>',
    YOUCANTDOTHAT : '<amazon:emotion name="disappointed" intensity="medium">you cannot do that</amazon:emotion>',
    IDONTUNDERSTAND : "I do not understand",
    WHATDOYOUWANTTODO : "what do you want to do?",
    YOUARENOTCARRYINGTHAT : "you are not carrying that",
    YOUCANNOTSEETHATHERE : "you cannot see that here"
};

function describeObjects( gamestate, predicate, headerstr, emptystr) {
    
    var objectdescs = [];
	
	_.each( gamestate.objects, function( objectrecord, objectname) {
				if ( predicate( gamestate, objectname ) ) {		
					objectdescs.push( objects[ objectname ].name );
				}
			});
			
	if( objectdescs.length > 0 ) {
        var basedesc = headerstr ;
		for( var i =0; i < objectdescs.length; i++ ) {
		    basedesc += objectdescs[i] ;
			if ( i === (objectdescs.length - 2) ) {
			    basedesc += " and ";
			} else {
				basedesc += ", ";
			}
		}
				
		return basedesc;
	}
				
	return emptystr;
}

function describe( gamestate, description  ) {
	if ( gamestate.dark[ gamestate.location ] ) {
		return module.exports.messages.ITSVERYDARKHERE;
	} else {
         gamestate.visited[ gamestate.location  ] = true;
	     return description + describeObjects( gamestate, isPresent,  ". You can also see: ", "");
	}
}

function describeLocation( gamestate, locationname ) {
	if ( gamestate.visited[ locationname ] ){
		return describe(  gamestate, locations[ gamestate.location ].name ) ;
	} else {
	    return describe( gamestate, locations[ locationname ].look(gamestate) );
	}
}

function changeLocation( gamestate, toLocation ) {
	gamestate.location = toLocation;
	return describeLocation( gamestate, toLocation );
}

function tryMove( gamestate, direction ) {
	if ( locations[ gamestate.location ][ direction ] ) {
	    gamestate.previous = gamestate.location;
		return locations[ gamestate.location ][ direction ]( gamestate );
	} else {
		return module.exports.messages.YOUCANTGOTHATWAY;
	}
}

function understands( objectName, verb ) {
    return objects[ objectName ] && objects[ objectName ][ verb ];    
}

function tryAction( gamestate, verb, objectName ) {
    if ( understands( objectName, verb ) ) {
		return objects[ objectName ][ verb ](gamestate);
	} else {
		return module.exports.messages.YOUCANTDOTHAT;
	}
}

function isWorn( gamestate, objectname ) {
	return gamestate.objects[ objectname ].location === "worn"	;
}

function isCarried( gamestate, objectname ) {
	return gamestate.objects[ objectname ].location === "carried" || isWorn( gamestate, objectname );
}

function isPresent( gamestate, objectname ) {
	return gamestate.objects[ objectname ].location === gamestate.location; 
}

function isPresentOrCarried( gamestate, objectname ) {
	return isCarried( gamestate, objectname ) || isPresent( gamestate, objectname );
}

function dropObject( gamestate, objectname ) {
	if ( isCarried( gamestate, objectname ) ) {
		gamestate.objects[ objectname ].location = gamestate.location;
		return "dropped";
	}
	
	return module.exports.messages.YOUARENOTCARRYINGTHAT;
}

function takeObject( gamestate, objectname ) {
	if ( isPresent( gamestate, objectname ) ) {
		gamestate.objects[ objectname ].location = "carried";
		return "taken";
	}
	
	return module.exports.messages.YOUCANNOTSEETHATHERE;
}

function blunder(gamestate)
{
	if ( gamestate.dark[ "bar" ] ) {
		gamestate.darkmoves++;
		return "Blundering around in the dark isn't a good idea" ;
	} else {
		return module.exports.messages.YOUCANTGOTHATWAY;
	}		
}

var locations = {
	"foyer" : {
		"name"  : "The foyer",
		"n" 	:  function(gamestate) { return "You've only just arrived, and besides, the weather outside seems to be gettng worse."; },
		"look"	:  function(gamestate) { return 'You are standing in the spacious hall of the <lang xml:lang="fr-FR">Opera Royal</lang>, splendidly decorated in red and gold, with glittering chandeliers overhead. The entrance from the street is to the north, and there are doorways south, east, and west'; },
		"w"     :  function(gamestate) { return changeLocation( gamestate,"cloakroom" ); },
		"s"		:  function(gamestate) { return changeLocation( gamestate, "bar" ); },
		"e" 	:  function(gamestate) { return changeLocation( gamestate, "bathroom"); },
		"out"   :  function(gamestate) { return locations.foyer.n(gamestate); },
		"bar"   :   function(gamestate) { return locations.foyer.s(gamestate); },
		"bathroom"  :   function(gamestate) { return locations.foyer.e(gamestate); },
		"cloakroom"  :   function(gamestate) { return locations.foyer.w(gamestate); }
		
	},
	"cloakroom" : {
		"name" : "The Cloakroom",
		"look" : function(gamestate) {
		    var hookdesc = "";
		    if ( gamestate.objects.cloak.location === "hook") {
		         hookdesc = "This solitary hook holds your cloak. ";
		    }
		    return "The walls of this small room were clearly once lined with hooks, though now only one remains. " + hookdesc + "The exit is a door to the east"; },
		"e" : function(gamestate) { return changeLocation( gamestate, "foyer" ); },
		"foyer" : function(gamestate) { return locations.cloakroom.e( gamestate); }
	},
	"bar" : {
		"name" : "The Bar",
		"look" : function(gamestate) { return "The bar, much rougher than you'd have guessed after the opulence of the foyer to the north, is completely empty. There seems to be some sort of message scrawled in the dust on the floor"; },
		"n" : function(gamestate) { return changeLocation( gamestate, "foyer"); },
		"s" : blunder,
		"e" : blunder,
		"w" : blunder,
		"foyer" : function(gamestate) { return locations.bar.n( gamestate); }
	},
	"bathroom" : {
		name : "The Bathroom",
		"look" : function( gamestate ) { return "This was once a bathroom, although the facilities have been removed. A door to the west takes you back to the foyer"; },
		"w" : function(gamestate) { return changeLocation( gamestate, "foyer" ); },
		"foyer" : function(gamestate) { return locations.bathroom.w( gamestate); }
	},
};

var objects = {
	"cloak" : {
		"name" : "Your velvet cloak",
		"examine" : function(gamestate) { return 'A handsome cloak, of velvet trimmed with satin, and slightly spattered with raindrops. <emphasis level="strong"> Its blackness is so deep that it almost seems to suck light from the room</emphasis>' ;},
		"drop" :  function( gamestate ) { 
		    if ( isCarried( gamestate, "cloak" )) { 
		        return "This isn't the best place to leave a smart cloak lying around"; 
		    } else {
		        return module.exports.messages.YOUARENOTCARRYINGTHAT;
		    } },
		"hang" : function( gamestate ) {
		    if ( isCarried( gamestate, "cloak") ) {
		        if( gamestate.location === "cloakroom") {
		               	gamestate.dark.bar = false;
				        gamestate.objects.cloak.location = "hook";
				        return "You hang your cloak on the hook" ;			
		        } else {
		            return "there's nowhere to hang it";
		        }
		    } else {
		        return module.exports.messages.YOUARENOTCARRYINGTHAT;
		    }},
		  "take" : function( gamestate ){
		      if ( isCarried( gamestate, "cloak") ){
		          return "you are already carrying it";
		      } else if ( gamestate.location === "cloakroom" &&  gamestate.objects.cloak.location === "hook" ){
		          return "your cloak seems quite happy on the hook. You decide to leave it there";
		      } else {
		          return module.exports.messages.YOUCANNOTSEETHATHERE;
			}}
	},
	"ticket" : {
			"name" : "A discarded theatre ticket",
			"examine" : function(gamestate) { return 'An out-of-date ticket to a bawdy romp titled: <lang xml:lang="fr-FR">Dominic and Shelley Pull It Off</lang>.' ; },
			"drop" : function(gamestate) { return dropObject( gamestate, "ticket" ); },
			"take" : function(gamestate) { return takeObject( gamestate, "ticket" ); }
			},
	"mirror" : {
		"name" : "A tarnished mirror",
		"examine" : function( gamestate ) {
			if ( isCarried(gamestate, "cloak" )) {
				return 'You admire your reflection. <amazon:emotion name="excited" intensity="low"> You look quite dashing in your dark cloak </amazon:emotion>';
			} else {
				return "You admire your reflection";
		}},
		"take" : function(gamestate) {
			if ( gamestate.location === "bathroom" ) {
				return '<amazon:emotion name="disappointed" intensity="medium">It is firmly fixed to the wall</amazon:emotion>';
			} else {
				return module.exports.messages.YOUCANNOTSEETHATHERE;
			}
		}}
};

module.exports.newGameState = function() {

    const initial = {
		"completed" : false,
		"visited" : {},
		"dark" : { "bar" : true},
		"location" : "foyer",
		"previous" : "",
		"objects" : { 
			"cloak" : { location :"worn" },
			"ticket" : { location : "foyer" },
			"mirror" : { location : "bathroom" }
			},
		"darkmoves" : 0
    };

    return  clonedeep( initial );
};

const verbs =
{
	"n"             : gamestate => tryMove( gamestate, "n" ),
	"s"             : gamestate => tryMove( gamestate, "s" ),
	"e"             : gamestate => tryMove( gamestate, "e" ),
	"w"             : gamestate => tryMove( gamestate, "w" ),
	"out"           : gamestate => tryMove( gamestate, "out" ),
    "bar"           : gamestate => tryMove( gamestate, "bar" ),
    "bathroom"      : gamestate => tryMove( gamestate, "bathroom"),
	"cloakroom"     : gamestate => tryMove( gamestate, "cloakroom"),
    "foyer"         : gamestate => tryMove( gamestate, "foyer"),
	"back"          : gamestate => tryMove( gamestate, gamestate.previous),
	
	"hang"          : ( gamestate, noun ) => tryAction( gamestate, "hang", noun),
	"take"          : ( gamestate, noun ) => tryAction( gamestate, "take", noun),
	"drop"          : ( gamestate, noun ) => tryAction( gamestate, "drop", noun),
	
	"examine" : function( gamestate, noun ) {
		if ( understands( noun, "examine" ) && isPresentOrCarried( gamestate, noun )){
			return objects[ noun ].examine(gamestate);
		} else {
			return module.exports.messages.YOUCANTDOTHAT;
		}
	},
	
	"read" : function( gamestate, noun ) {
		if ( noun === "message" ) {
			if ( gamestate.location === "bar" && !gamestate.dark.bar ) {
				gamestate.completed = true;
				if (  gamestate.darkmoves < 2 ) {
					return 'The message, neatly marked in the dust, reads...  You have won. <audio src="soundbank://soundlibrary/human/amzn_sfx_crowd_excited_cheer_01"/>' ;
				} else {
					return "The message has been carelessly trampled, making it difficult to read. You can just distinguish the words... You have lost.";
				}				
			} else {
				return module.exports.messages.YOUCANTDOTHAT;
			}
		}
	},
	
	"inventory" : gamestate => describeObjects( gamestate, isCarried, "you are carrying: ", "you are not carrying anything"),
	"wearing"   : gamestate => describeObjects( gamestate, isWorn, "you are wearing: ", "you are not wearing anything special"),
	"look"      : gamestate => describe( gamestate, locations[ gamestate.location ].look(gamestate) ) 
};

const synonyms = 
{ 
	"get"       : "take",
	"north"     : "n",
	"south"     : "s",
	"west"      : "w",
	"east"      : "e",
	"outside"   : "out",
	"inside"    : "in",
	"stub"      : "ticket",
	"dust"      : "message",
	"floor"     : "message"
};

function getSynonym( word ) {
	if  ( synonyms[ word ] ) {
		return synonyms[ word ];
	}
	
	return word;
}

module.exports.doAction = function( gamestate, verb, noun ) {
	let normalizedVerb = getSynonym( verb );
	let normalizedNoun = getSynonym( noun );
	
	if ( verbs[ normalizedVerb ] ) {
		return verbs[ normalizedVerb ]( gamestate, normalizedNoun );
	} else {
		return module.exports.messages.IDONTUNDERSTAND;
	}	
}