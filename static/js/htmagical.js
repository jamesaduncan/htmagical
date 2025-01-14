/* htmagical buttons */

class HTMagical {
    static documentPart ( aThing ) {
        const selector = aThing.getAttribute('submit');
        const serializer = new XMLSerializer();
        const part = document.querySelector( selector );
        if (!part) throw new Error('invalid submission selector')
        return serializer.serializeToString( part );
    }

    static generateSelector( el ) {
        let path = [], parent;
        while (parent = el.parentNode) {
          path.unshift(`${el.tagName}:nth-child(${[].indexOf.call(parent.children, el)+1})`);
          el = parent;
        }
        return `${path.join(' > ')}`.toLowerCase();        
    }

    static selector( aThing ) {
        if ( aThing.hasAttribute('selector') ) {
            const selector = aThing.getAttribute('selector');

            const match = selector.match(/^\:parent\((\-{0,1}\d+)\)/);
            if ( match ) {
                let node = aThing;
                let count = parseInt(match[1]);
                while(count < 0) {
                    node = node.parentNode;
                    count++;                    
                }
                return HTMagical.generateSelector( node )
            } else {
                return selector;
            }

        }
        return HTMagical.generateSelector( aThing );
    }

    static url( aThing ) {
        return window.location;
    }

    static method( aThing ) {
        return aThing.getAttribute("method").toLowerCase() || 'get';
    }

    static enctype( aThing ) {
        return aThing.getAttribute('enctype') || 'text/html';
    }

    static headers( aThing ) {
        const headers = {
            'Content-Type': HTMagical.enctype( aThing )
        };
        const method = this.method( aThing );
        if ( method == "patch" || method == "delete" ) {
            headers['Range'] = `selector=${HTMagical.selector( aThing )}`; 
        }
        return headers;
    }
}

/* make sure we always update the value element when input values change */
document.querySelectorAll('input').forEach( (input) => {
    input.addEventListener('change', (event) => {
        event.target.setAttribute('value', event.target.value)
    });
})

let buttons = document.querySelectorAll("button[method]");
if ( buttons ) {
    const library = await import(window.location + ".js");
    console.log( library );
    buttons.forEach( (button) => {
        button.addEventListener('click', async (event) => {
            console.log('click')
            const part    = HTMagical.documentPart( button );
            const url     = HTMagical.url( button );
            const method  = HTMagical.method( button );
            const headers = HTMagical.headers( button );
            const response = await fetch(url, {
                method: method,
                body: part,
                headers: headers
            });
            if ( response.ok ) {
                const selector = HTMagical.selector( button );
                const meth = library.default[ method.toUpperCase() ];
                console.log(`Looking for library.default[ ${method} ]['${selector}']`)
                const fn   = meth[ selector ];
                if( fn ) {
                    fn( selector, document.querySelector( selector ), part );
                } else {
                    if ( meth['*'] ) {
                        meth['*']( selector, document.querySelector( selector ), part );
                    }
                }
            }
        });
    });
}