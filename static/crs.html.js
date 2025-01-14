function PATCH (selected, content) {
    selected.innerHTML = content;
    const button = selected.querySelector('button');
    button.setAttribute('method', 'delete');
    button.setAttribute('selector', ':parent(-2)');
    button.innerHTML = "Delete";
}

function DELETE (selected) {
    selected.parentNode.removeChild( selected );
}

const resolver = {
    PATCH: {
        "#attacks tbody": ( selector, selected, content ) => {
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

}

export default resolver;