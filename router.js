
class Router extends Function {
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

export default Router;