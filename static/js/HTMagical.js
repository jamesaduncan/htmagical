/* htmagical buttons */
document._selectorReg = {};

document.addEventListener("DOMContentLoaded", async () => {
    HTMLElement.prototype.registerSelector  = function( selector, callback ) {
        const registry = this._selectorReg;
        if ( registry[ selector ] ) {
            registry[ selector ].push( callback );
        } else {
            registry[ selector ] = [ callback ];
        }
    };
    document.registerSelector = HTMLElement.prototype.registerSelector;

    class HTMagical {
        static for ( aThing ) {
            const selector = aThing.getAttribute('for');
            const part = document.querySelector( selector );
            return part;
        }

        static generateSelector( el ) {
            let path = [], parent;
            while (parent = el.parentNode) {
            path.unshift(`${el.tagName}:nth-child(${[].indexOf.call(parent.children, el)+1})`);
            el = parent;
            }
            return `${path.join(' > ')}`.toLowerCase();        
        }

        static action( aThing ) {
            if ( aThing.hasAttribute('action') ) {
                const selector = aThing.getAttribute('action');

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
            return aThing.getAttribute("method").toUpperCase() || 'GET';
        }

        static enctype( aThing ) {
            return aThing.getAttribute('enctype') || 'text/html';
        }

        static headers( aThing ) {
            const headers = {
                'Content-Type': HTMagical.enctype( aThing )
            };
            const method = this.method( aThing );
            if ( method == "PATCH" || method == "DELETE" ) {
                headers['Range'] = `selector=${HTMagical.action( aThing )}`; 
            }
            return new Headers( headers );
        }
    }

    /* make sure we always update the value element when input values change */
    document.querySelectorAll('input').forEach( (input) => {
        input.addEventListener('change', (event) => {
            event.target.setAttribute('value', event.target.value)
        });
    })

    const actionHandler = await import("/!/HTMagicalAction.js");

    document.registerSelector( 'button[method]', (button) => {
        button.addEventListener('click', async (event) => {
            const part    = HTMagical.for( button );
            const url     = HTMagical.url( button );
            const method  = HTMagical.method( button );
            const headers = HTMagical.headers( button );
            const response = await fetch(url, {
                method: method,
                body: part.outerHTML,
                headers: headers
            });
            if ( response.ok ) {
                const selector = HTMagical.action( button );
                const clone    = part.cloneNode( true );            
                await actionHandler.default( document, {
                    selected: document.querySelector( selector ),
                    root: clone,
                    method : method.toUpperCase(),
                    headers: headers, 
                    selector: selector
                });
            }
        });
    });

    /* this sets up the mutation observer to watch the document, and
        execute on any callbacks whenever we see registered selectors appear */
        const registry = document._selectorReg;    
        const selectors = Object.keys( document._selectorReg );
        for ( const selector of selectors ) {
            const nodes = document.querySelectorAll( selector );
            for ( const node of nodes ) {
                for ( const cb of registry[ selector ] ) {
                    cb( node, selector );
                }      
            }    
        }
        
        const observer = new MutationObserver( function( mutationList, observer ) {
            for ( const mutation of mutationList ) {
                if ( mutation.addedNodes.length > 0 ) {
                    mutation.addedNodes.forEach( (node) => {
                        for ( const selector of selectors ) {
                            if ( !node.querySelectorAll ) break;
                            const nodes = node.querySelectorAll( selector );                        
                            for ( const cbnode of nodes ) {
                                for ( const cb of registry[ selector ] ) {
                                    cb( cbnode, selector );
                                }      
                            }	     
                        }
                    });
                }
            }
        });
        
        observer.observe( document.querySelector('body'), { childList: true, subtree: true });
}, false);
