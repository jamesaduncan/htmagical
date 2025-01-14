import * as path from "jsr:@std/path";
import { Browser, Window } from 'npm:happy-dom';

import { contentType, parseMediaType } from "@std/media-types";

import Router     from "./router.js"
import BodyParser from "./bodyparser.js"
import Static     from "./static.js"
import Serve      from "./candi.js"

const runtime = [];
const router = new Router();

router.ANY(Router.Method.DELETE | Router.Method.PATCH | Router.Method.GET, '/:filename', async ( request, context ) => {
    const browser = new Browser();
    const page    = browser.newPage();

    const decoder = new TextDecoder("utf-8");

    Object.defineProperty(context, 'document', {
        get: async() => {
            const filedata = await context.file.data;        
            page.content  = decoder.decode( filedata );
            const document = page.mainFrame.document;
            return document;
        }
    });
    Object.defineProperty(context, 'page', {
        get: () => {
            return page;
        }
    })
});

router.delete('/:filename', async ( request, context ) => {
    const [,range] = request.headers.get('Range').split('=');
    const document = await context.document;
    const selected = document.querySelector( range );
    selected.parentNode.removeChild( selected );

    const encoder = new TextEncoder();
    Deno.writeFile( context.file.name, encoder.encode( context.page.content ) )

    return new Response( null, { status: 204 });
})

router.patch('/:filename', async ( request, context ) => {
    const [,range] = request.headers.get('Range').split('=');
    if ( context.file.type == 'text/html' ) {
        const document = await context.document;
        const selected = document.querySelector( range );
        if ( selected ) {
            const library = await import("./" + context.file.name + ".js");
            const fn = library.default[ request.method ];
            if ( fn ) {
                fn( selected, context.body );
            }
            const encoder = new TextEncoder();
            Deno.writeFile( context.file.name, encoder.encode( context.page.content ))
            return new Response( null, {
                status: 204
            });
        } else {
            return new Response("Range not Satisfiable",{
                status: 416
            });
        }    
    }
});

router.patch('/crs.html', async( request, context) => {
    const [,range] = request.headers.get('Range').split('=');

});

runtime.push( BodyParser );
runtime.push( router );
runtime.push( Static );

Serve( runtime );