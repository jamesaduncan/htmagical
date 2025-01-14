import Router from "./router.js";

function Serve( runtime ) {
    Deno.serve(async (req) => {

        const context = {};
        const results = [];
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
}

export default Serve