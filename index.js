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

function parseHTMLPreserveRoot(htmlString, document) {
    // Mapping of elements to their required parent context
    const contextMap = {
        'tr': 'table',
        'td': 'table',
        'th': 'table',
        'tbody': 'table',
        'thead': 'table',
        'tfoot': 'table',
        'li': 'ul',
        'option': 'select',
        'optgroup': 'select',
    };

    // Extract the tag name of the root element
    const tagNameMatch = htmlString.trim().match(/^<([a-z]+)[\s>]/i);
    if (!tagNameMatch) {
        throw new Error('Invalid HTML string.');
    }
    const rootTag = tagNameMatch[1].toLowerCase();

    // Determine if a contextual wrapper is needed
    const wrapperTag = contextMap[rootTag] || null;

    if (wrapperTag) {
        // Wrap the HTML string in the required parent
        const wrapper = document.createElement(wrapperTag);
        wrapper.innerHTML = htmlString.trim();

        // Return the root element
        return wrapper.querySelector(rootTag);
    } else {
        // If no wrapper is needed, parse directly
        const template = document.createElement('template');
        template.innerHTML = htmlString.trim();
        return template.content.firstChild;
    }
}

router.ANY(Router.Method.PATCH | Router.Method.DELETE, '/:filename', async ( request, context ) => {
    const [,range] = request.headers.get('Range').split('=');
    if ( context.file.type == 'text/html' ) {
        const document = await context.document;
        const root = parseHTMLPreserveRoot( context.body, document );
        const selected = document.querySelector( range );
        if ( selected ) {
            let actionHandler = await import('./static/js/Action.js');
            await actionHandler.default( document, {
                selected,
                root,
                method : request.method,
                headers: request.headers, 
                selector: range,
            });
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