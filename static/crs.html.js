
export default {
    PATCH: {
        "#attacks tbody": ( selector, selected, element, content ) => {                        
            const button = element.querySelector('button');
            button.setAttribute('method', 'delete');
            button.setAttribute('selector', ':parent(-2)');
            button.innerHTML = "Delete";

            selected.appendChild( element )
        }
    },

    DELETE: {
        '*': ( selector, selected, content ) => {
            selected.parentNode.removeChild( selected )
        }
    }

};