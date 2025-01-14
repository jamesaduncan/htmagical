import * as path from "jsr:@std/path";
import { Browser, Window } from 'npm:happy-dom';

import { contentType, parseMediaType } from "@std/media-types";

import Router     from "./router.js"
import BodyParser from "./bodyparser.js"
import Static     from "./static.js"
import Serve      from "./candi.js"

const runtime = [];
const router = new Router();

router.ANY( Router.Method.PATCH | Router.Method.GET, "/*", async( request, context ) => {
    const filename = path.join( "static", context.route.pathname.groups[0] );
    const [mimetype, characterSet] = parseMediaType( contentType( path.extname( filename ) ) );
    context.file = {
        data: Deno.readFile( filename ),
        type: mimetype,
        name: filename
    }
});

router.patch('/:filename', async ( request, context ) => {
    const [,range] = request.headers.get('Range').split('=');

    if ( context.file.type == 'text/html' ) {
        console.log(`Patching ${context.file.type} ${range} in ${context.file.name} with ${context.body.length} characters`);        
        const browser = new Browser();
        const page    = browser.newPage();
        const decoder = new TextDecoder("utf-8");
        const filedata = await context.file.data;        
        page.content  = decoder.decode( filedata );
        const document = page.mainFrame.document;        
        const selected = document.querySelector( range );
        if ( selected ) {
            selected.innerHTML = context.body;
            const encoder = new TextEncoder();
            Deno.writeFile( context.file.name, encoder.encode( page.content ))
            return new Response( document.innerHTML, {
                status: 204
            });
        } else {
            return new Response("Range not Satisfiable",{
                status: 416
            });
        }
    }
    return new Response( data );
});

runtime.push( BodyParser );
runtime.push( router );
runtime.push( Static );

Serve( runtime );