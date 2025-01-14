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
        if ( aThing.hasAttribute('selector') ) return aThing.getAttribute('selector');
        return HTMagical.generateSelector( el );
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
        if ( this.method( aThing ) == 'patch' ) {
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

document.querySelectorAll("button[method]").forEach( (button) => {
    console.log(button);
    
    button.addEventListener('click', async (event) => {
        const part    = HTMagical.documentPart( button );
        const url     = HTMagical.url( button );
        const method  = HTMagical.method( button );
        const headers = HTMagical.headers( button );
        const response = await fetch(url, {
            method: method,
            body: part,
            headers: headers
        });
    });
});