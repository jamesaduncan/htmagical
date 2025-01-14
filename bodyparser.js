
import { contentType, parseMediaType } from "@std/media-types";

const bodyParsers = {
    'text/html': async function( request, context ) {
        context.body = await request.text();
    }
}

async function BodyParser( request, context ) {
    if (request.headers.get('content-length') > 0) await bodyParsers[ request.headers.get('content-type') ]( request, context );
}

export default BodyParser;