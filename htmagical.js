import * as path from "jsr:@std/path";
import { contentType, parseMediaType } from "jsr:@std/media-types";
import { Browser, Window } from 'npm:happy-dom';

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

export default async( ctx, next) => {
    if ( ctx.request.method == 'PATCH' || ctx.request.method == "DELETE" ) {
        const url = new URL(ctx.request.url);
        
        let filename = path.join( 'static', url.pathname );
        if ( Deno.statSync( filename ).isDirectory ) filename = path.join( filename, "index.html" )
        
        const [mimetype, characterSet] = parseMediaType( contentType( path.extname( filename ) ) );

        const filedata = await Deno.readFile( filename );

        const browser = new Browser();
        const page    = browser.newPage();
    
        const decoder = new TextDecoder("utf-8");
        page.content  = decoder.decode( filedata );
        const document = page.mainFrame.document;

        const [,range] = ctx.request.headers.get('Range').split('=');
        if ( range ) {
            if ( mimetype == 'text/html' ) {
                const root = parseHTMLPreserveRoot( await ctx.request.body.text(), document );
                const selected = document.querySelector( range );
                if ( selected ) {
                    const actionHandler = await import('./static/js/Action.js');
                    await actionHandler.default( document, {
                        selected,
                        root,
                        method : ctx.request.method,
                        headers: ctx.request.headers, 
                        selector: range,
                    });
                    const encoder = new TextEncoder();
                    Deno.writeFile( filename, encoder.encode( page.content ))
                    ctx.response.status = 204;
                    //ctx.response.body;
                    return;//next();
                } else {
                    ctx.response.status = 416;
                    ctx.response.body   = "Range not satisfiable";
                    return;//next();
                }    
            }
        }
    }
    return await next();
};
