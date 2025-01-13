import Flatter from "@jamesaduncan/flatter";
import { denoCacheDir } from "jsr:@denosaurs/plug@1/util";
import * as path from "jsr:@std/path";

import { contentType } from "@std/media-types";

const p = path.basename("./deno/is/awesome/mod.ts");


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
        GET: 1, PUT: 2, POST: 4, DELETE: 8
    }

    run( request, context ) {
        const url = new URL(request.url);        
        return this.routes.filter( e => {
            return e.method & Router.Method[ request.method ];
        }).filter( e => {
            return e.pattern.exec( url );
        }).map( e => {
            return e.fn( request, context );
        });
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

    post( pattern, fn ) {
        this.ANY( Router.Method.POST, pattern, fn );
    }

    delete( pattern, fn ) {
        this.ANY( Router.Method.DELETE, pattern. fn );
    }
}

const runtime = new Array();

const router = new Router();
router.get("/", async (request) => {
    const response = new Response("Hello, world", { status: 200 });
    return response;
});

async function getfile( aFilename ) {
    try {
        const info = await Deno.stat( aFilename );    
        if (info.isDirectory) {
            return getfile( path.join( aFilename, "index.html" ));
        } else {
            const bytes = await Deno.readFile( aFilename );
            return new Response( bytes, {
                status: 200,
                headers: {
                    'content-type': contentType( path.extname( aFilename ) )
                }
            })
        }
    } catch(e) {
        console.log(`${aFilename}: ${e}`);
        return;
    }
}

runtime.push( async function( request, context ) {
    const url = new URL(request.url);
    const filepath = path.join( 'static', url.pathname );
    console.log(`getting ${filepath}`);
    console.log(request);
    return getfile( filepath );
})

Deno.serve(async (req) => {
    const context = {};
    const promises = runtime.flatMap( me => me(req, context ) );
    await Promise.all( promises ).then( (results ) => {
        context.response = results.find( (result) => result instanceof Response );        
    }).catch( (error) => {
        context.response = new Response(`Internal Server Error: ${error}`, {
            status: 500
        });
    }).finally(() => {
        if ( ! context.response ) {
            const url = new URL(req.url)
            context.response = new Response(`Not Found: ${url.pathname}`, {
                status: 404
            })
        }  
    })

    console.log( context.response );
    
    return context.response;
});