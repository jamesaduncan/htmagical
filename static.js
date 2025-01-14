import * as path from "jsr:@std/path";
import { contentType, parseMediaType } from "@std/media-types";

async function getfile( request, aFilename, opts = {} ) {
    try {
        const info = await Deno.stat( aFilename );    
        if (info.isDirectory) {
            return getfile( request, path.join( aFilename, "index.html" ), opts);
        } else {
            let bytes = await Deno.readFile( aFilename );
            const [mimetype, characterSet] = parseMediaType( contentType( path.extname( aFilename ) ) );
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


function Static ( request, context ) {
    if ( request.method != 'GET') return;

    const url = new URL(request.url);
    const aFilename = path.join( 'static', url.pathname );
    return getfile( request, aFilename, { root: 'static' });
}

export default Static;

