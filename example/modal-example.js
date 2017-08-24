(function (AccessModal, document) {
    'use strict';

    var modalService = new AccessModal({
        id: 'example1',
        title: 'Example Modal',
        description: 'Beginning of dialog window.',
        template: 'example1-template',
        modalBody: 'example1-body'
    });

    document.getElementById('button1').addEventListener('click', function () {
        modalService.open();
    });

}(AccessModal, document)); //jshint ignore:line
