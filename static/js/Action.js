export default async (document, params ) => {
    const moduleCode = document.getElementById("HTMagical").textContent;    
    const blob = new Blob([moduleCode], { type: 'text/javascript' })
    const blobURL = URL.createObjectURL(blob);
    const library = await import(blobURL);
    const methodActions = library.default[ params.headers.get('content-type') ][ params.method ];
    if ( methodActions ) {
        const fn   = methodActions[ params.selector ] || methodActions['*'];
        if ( fn ) {
            fn( document, params.selected, params.root, {
                selector: params.selector,
                document: document
            });
        }
    }
}
