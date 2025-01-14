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

export default {
    PATCH, DELETE
};
