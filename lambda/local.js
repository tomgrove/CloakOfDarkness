// a quick and dirty console app for quick iteration/debugging

const readline = require('readline');
const cloak = require('./cloak.js');

const rl = readline.createInterface( {
		input : process.stdin,
		output : process.stdout 
})

function prompt( gamestate, cont )
{
	rl.question("?", function( command  ){
		let words = command.split( " " );

		if( words[0] !== "stop" ) {
			let response = cloak.doAction( gamestate, words[0], words[1] );
			console.log( response );			
			if ( !gamestate.completed ) {
				prompt(gamestate, cont );
			} else {
				cont();
			}
		}
	});
}	

function main()
{
	console.log( "Welcome to 'Cloak of Darkness'\n");
	let gamestate  = cloak.newGameState();
	console.log( cloak.doAction( gamestate, "look" ) );
	prompt( gamestate, main );
}

main();
