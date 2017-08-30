(function (AccessModal, document) {
    'use strict';

    var modalService = new AccessModal({
        id: 'example1',
        title: 'Example Modal',
        description: 'Beginning of dialog window.',
        template: '#example1-template',
        content: '#example1-body',
        afterClose: function (reason) {
            var modalInstance = this;
            console.log('reason for closing is', reason);
        }
    });

    document.getElementById('button1').addEventListener('click', function () {
        modalService.open();
    });

}(AccessModal, document)); //jshint ignore:line
