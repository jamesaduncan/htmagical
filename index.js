import Flatter from "@jamesaduncan/flatter";
import * as path from "jsr:@std/path";
import { Browser, Window } from 'npm:happy-dom';

import { contentType, parseMediaType } from "@std/media-types";

class Player extends Flatter {
    username = "";
    fullname = "";
    _password = "";

    /* this all needs to be bcrypt really */
    set password( aValue ) {
        this._password = aValue;
    }

    get password() {
        return this._password;
    }

    authenticate( aPassword ) {
        return this._password == aPassword;
    }

    static {
        this.init();
    }
}

class Skill extends Flatter {
    name = "";
    rating = "";
    aspect = "";

    static {
        this.init();
    }
}

class Character extends Flatter {
    name   = "";
    player = new Player();

    station = "";
    
    pursuits = [];
    current_persuit = "";
    characteristics = [];

    aspects = {
        might: 0,
        grace: 0,
        speed: 0,
        resilience: 0,
        intellect: 0,
        charm: 0,
        cunning: 0,
        tenacity: 0
    };

    skills = [];
    talents = [];

    equipment = [];

    destiny = [];
    
    static {
        this.init();
    }
}

Character.Destiny = {
    Endeavour: 0,
    Mind: 1,
    Root : 2,
    Body : 3,
    Station: 4
};

class Router extends Function{
    routes = [];

    constructor() {
        super();
        const handler = {
            apply(target, thisArg, argumentsList) {
                return target.run( argumentsList[0], argumentsList[1] );
            }
        };
        return new Proxy(this, handler)
    }

    static Method = {
        GET: 1, PUT: 2, POST: 4, DELETE: 8, PATCH: 16
    }

    run( request, context ) {
        const meth = request.method;
        const url  = new URL(request.url);

        const validMethods = this.routes.filter( e => {
            return e.method & Router.Method[ request.method ]
        });
        const validPatterns = validMethods.filter( e=> {
            return e.pattern.exec( url );
        })
        return validPatterns.map( e => {
            context.route = e.pattern.exec(url);
            return e.fn( request, context );
        });//.filter( r => r instanceof Response );
    }

    ANY( aMethod, aPattern, anFn ) {
        this.routes.push({ method: aMethod, pattern: new URLPattern( { pathname: aPattern } ), fn: anFn })
    }

    get( pattern, fn ) {
        this.ANY( Router.Method.GET, pattern, fn );
    }

    put( pattern, fn ) {
        this.ANY( Router.Method.PUT, pattern, fn )
    }

    patch( pattern, fn ) {
        this.ANY( Router.Method.PATCH, pattern, fn )
    }


    post( pattern, fn ) {
        this.ANY( Router.Method.POST, pattern, fn );
    }

    delete( pattern, fn ) {
        this.ANY( Router.Method.DELETE, pattern. fn );
    }
}

const runtime = new Array();

const bodyParsers = {
    'text/html': async function( request, context ) {
        context.body = await request.text();
    }
}

async function bodyParser( request, context ) {
    if (request.headers.get('content-length') > 0) await bodyParsers[ request.headers.get('content-type') ]( request, context );
}

const router = new Router();

router.patch('/:filename', async ( request, context ) => {
    const filename = context.route.pathname.groups.filename;
    const range    = request.headers.get('Range');
    console.log(`Patching ${range} in ${filename} with ${context.body.length} characters`)
    return new Response("foobarbaz");
});

const FragmentReader = {
    'text/html': function( fragment, data ) {
        const browser = new Browser();
        const page    = browser.newPage();
        page.content  = data;
        return page.mainFrame.document.querySelector( fragment ).innerHTML;
    }
}

async function getfile( request, aFilename, opts = {} ) {
    try {
        const info = await Deno.stat( aFilename );    
        if (info.isDirectory) {
            return getfile( request, path.join( aFilename, "index.html" ), opts);
        } else {
            let bytes = await Deno.readFile( aFilename );
            const [mimetype, characterSet] = parseMediaType( contentType( path.extname( aFilename ) ) );
            const fragment = request.headers.get('x-fragment');
            
            const decoder = new TextDecoder( 'utf-8');
            const encoder = new TextEncoder();
            if ( fragment ) {                
                bytes = encoder.encode( FragmentReader[ mimetype ]( fragment, decoder.decode( bytes )) );
            }
            return new Response( bytes, {
                status: 200,
                headers: {
                    'content-type': mimetype
                }
            })
        }
    } catch(e) {
        console.log(`${aFilename}: ${e}`);
        return;
    }
}
runtime.push( bodyParser );
runtime.push( router );
runtime.push( function( request, context ) {
    if ( request.method != 'GET') return;

    const url = new URL(request.url);
    const aFilename = path.join( 'static', url.pathname );
    return getfile( request, aFilename, { root: 'static' });
})

Deno.serve(async (req) => {
    const context = {};
    const results = new Array();
    for ( const mw of runtime ) {
        const result = await mw( req, context );            
        if ( result ) {
            if (result[Symbol.iterator])
                results.push(...result);
            else 
                results.push(result);
        }
    }

    await Promise.all( results ).then( (results) => {
        context.response = results.find( (result) => result instanceof Response );
    }).catch( (error) => {
        context.response = new Response(`Internal Server Error (Runtime): ${error}`, {
            status: 500
        });
        console.error(error);
    }).finally( () => {
        if ( ! context.response ) {
            const url = new URL(req.url)
            context.response = new Response(`Not Found: ${url.pathname}`, {
                status: 404
            })
        }
    });

    console.log(`${context.response.status} ${req.method} ${req.url}`)
    return context.response;
});