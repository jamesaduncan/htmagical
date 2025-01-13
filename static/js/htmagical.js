/* htmagical buttons */

class HTMagical {
    static documentPart ( aThing ) {
        const selector = aThing.getAttribute('submit');
        const serializer = new XMLSerializer();
        return serializer.serializeToString( document.querySelector( selector ));
    }

    static generateSelector( el ) {
        let path = [], parent;
        while (parent = el.parentNode) {
          path.unshift(`${el.tagName}:nth-child(${[].indexOf.call(parent.children, el)+1})`);
          el = parent;
        }
        return `${path.join(' > ')}`.toLowerCase();        
    }

    static target( aThing ) {
        if ( aThing.hasAttribute('action') ) return aThing.getAttribute('action');
        return HTMagical.generateSelector( el );
    }

    static url( aThing ) {
        return window.location;
    }

    static method( aThing ) {
        return aThing.getAttribute("method");
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
        const part   = HTMagical.documentPart( button );
        const url    = HTMagical.url( button );
        const response = await fetch(url, {
            method: HTMagical.method( button ),
            body: part,
            headers: {
                "X-Fragment": HTMagical.target( button ),
                'Content-Type': "text/html"
            }
        });
    });
});