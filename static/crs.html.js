
export default {
    PATCH: {
        "#attacks tbody": ( selector, selected, content ) => {
            console.log( content )
            selected.innerHTML = content;
            const button = selected.querySelector('button');
            button.setAttribute('method', 'delete');
            button.setAttribute('selector', ':parent(-2)');
            button.innerHTML = "Delete";      
        }
    },

    DELETE: {
        '*': ( selector, selected, content ) => {
            selected.parentNode.removeChild( selected )
        }
    }

};