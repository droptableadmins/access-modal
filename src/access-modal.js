(function (window, document, _) {
    'use strict';

    function AccessModal (options) {
        var self = this;
        self.options = options;

        var parser = new DOMParser();

        //build the modal from a template, uses lodash’s template function
        self.modalChrome = (parser).parseFromString(_.template(document.getElementById(self.options.template).text)(self.options), 'text/html').body.firstChild;
        self.modalBodyHTML = (parser).parseFromString(_.template(document.getElementById(self.options.modalBody).text)(self.options), 'text/html').body.firstChild;

        //named parts of the modal
        //content is the visible portion of the modal
        //title is the text that appears in the visual header bar of the modal (next to the close button)
        //closeButton is the X button in the header
        //closeDescription is the invisible text that further describes what the X does
        self.modalContent = self.modalChrome.querySelector('.access-modal-content');
        self.modalTitle = self.modalChrome.querySelector('.access-modal-title');
        self.modalDescription = self.modalChrome.querySelector('.access-modal-description');
        self.modalBody = self.modalChrome.querySelector('.access-modal-body');
        self.modalCloseButton = self.modalChrome.querySelector('.access-modal-close');
        self.modalCloseButtonDescription = self.modalChrome.querySelector('.access-modal-close-description');
        self.closeTriggerSelector = 'header .access-modal-close';
        self.zIndexStep = self.options.zIndexStep || 5;
        //self.focusableElements = self.options.focusableElements || [
        //    'a[href]:not([tabindex="-1"])',
        //    'area[href]:not([tabindex="-1"])',
        //    'input:not([disabled]):not([tabindex="-1"])',
        //    'select:not([disabled]):not([tabindex="-1"])',
        //    'textarea:not([disabled]):not([tabindex="-1"])',
        //    'button:not([disabled]):not([tabindex="-1"])',
        //    'iframe:not([tabindex="-1"])',
        //    '[tabindex]:not([tabindex="-1"])',
        //    '[contentEditable=true]:not([tabindex="-1"])'
        //];

        //dynamic ids set by the instantiation, only 1 `id` per page with HTML rules
        self.titleId = self.options.id + '-title';
        self.closeButtonDescriptionId = self.options.id + '-close-button-description';
        self.descriptionId = self.options.id + '-description';

        //required: hide everything in the DOM from screen readers by making an new aria-hidden element and moving all elements beneath
        self.notModalWrap = document.createElement('div');
        self.notModalWrap.setAttribute('aria-hidden', true);
        self.addClass(self.notModalWrap, 'access-modal-remainder');

        //required: assign a role, either to “dialog” or “alertdialog” depending on the nature of the interaction
        //`dialog` is default
        //if not equal to dialog or alertdialog, throw error
        if (self.options.role === undefined) {
            self.options.role = 'dialog';
        }
        else if (self.options.role === 'dialog' || self.options.role === 'alertdialog') {
            self.modalChrome.setAttribute('role', self.options.role);
        }
        else {
            throw new Error('you must set role=`dialog` or role=`alertdialog` in the modal options');
        }

        //required: set aria-labelledby to point to the header title and aria-describedby to point to the text description
        self.modalTitle.setAttribute('id', self.titleId);
        self.modalDescription.setAttribute('id', self.descriptionId);
        self.modalChrome.setAttribute('aria-labelledby', self.titleId);
        self.modalChrome.setAttribute('aria-describedby', self.descriptionId);

        //required: ensure the tabindex === -1 on the modal chrome
        self.modalChrome.setAttribute('tabindex', -1);

        //required: the X button has aria-describedby pointing to the invisible text
        self.modalCloseButtonDescription.setAttribute('id', self.closeButtonDescriptionId);
        self.modalCloseButton.setAttribute('aria-describedby', self.closeButtonDescriptionId);

        //window.addEventListener('unload', function destroyWaypointsModal () {
        //});

        return self;
    }

    AccessModal.prototype.isVisible = function isVisible (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    };

    //jQuery like class nicety
    AccessModal.prototype.hasClass = function hasClass (element, classname) {
        return (' ' + element.className + ' ').indexOf(' ' + classname + ' ') > -1;
    };

    //jQuery like class nicety
    AccessModal.prototype.addClass = function addClass (element, classname) {
        var cn = element.className;
        if (cn.indexOf( classname ) !== -1) {
            return;
        }
        if (cn !== '') {
            classname = ' ' + classname;
        }
        element.className = cn + classname;
    };

    //jQuery like class nicety
    AccessModal.prototype.removeClass = function removeClass (element, classname) {
        var cn = element.className;
        var rxp = new RegExp('\\s?\\b' + classname + '\\b', 'g');
        cn = cn.replace(rxp, '');
        element.className = cn;
    };

    //jQuery like nicety
    AccessModal.prototype.outerHeight = function outerHeight (el, marginsToo) {
        var self = this;
        var calc;
        calc = el.clientHeight;
        if (!marginsToo) {
            return calc;
        }
        return calc + self.computedStyle(el, 'margin-top') + self.computedStyle(el, 'margin-bottom');
    };

    AccessModal.prototype.getZIndex = function getZIndex (el) {
        var self = this;
        var z = self.computedStyle(el, 'z-index');

        if (isNaN(z)) {
            return self.getZIndex(el.parentNode);
        }

        return z;
    };

    AccessModal.prototype.onKeyEvent = function onKeyEvent (e) {
        var self = this;
        var code = e.charCode || e.keyCode; //normalize char codes cross browser
        if (e.type === 'keydown' && code === 27) { //escape key
            if (self.modalChrome.parentNode === document.body) { //topmost modal only
                self.close();
            }
        }
    };

    //use closure to remember the parent modal chrome
    AccessModal.prototype.onModalClickEvent = function onModalClickEvent (e) {
        var self = this;
        if ((e.type === 'click' || e.type === 'touch')) {
            e.stopPropagation(); //in case the event in on the icon <span> within the <button>, we don’t want to fire twice, so stop
            self.close(); //pass the modal chrome element and the focus function to unbind
        }
    };

    AccessModal.prototype.computedStyle = function (el, prop) {
        return parseInt(window.getComputedStyle(el).getPropertyValue(prop).replace('px', ''), 10);
    };

    AccessModal.prototype.open = function () {
        var self = this;
        self.callCustom('beforeOpen');

        //required: remember what had focus before opening modal
        self.modalChrome.lastFocusedElement = document.activeElement;

        //append modalBodyHTML to insertion point within the modal chrome
        self.modalBody.appendChild(self.modalBodyHTML);


        //required: hide everything in the DOM from screen readers by making an new aria-hidden element and moving all elements beneath
        while (document.body.childNodes.length) {
            self.notModalWrap.appendChild(document.body.firstChild);
        }
        document.body.appendChild(self.notModalWrap);

        //show the modal chrome - make it the first position in the DOM
        document.body.insertBefore(self.modalChrome, document.body.firstChild);


        //our styles require this to display the modal - just make sure it’s visible
        self.addClass(self.modalChrome, 'access-modal-opened');

        //freeze the body scroll - our desired interaction for sighted users
        self.addClass(document.body, 'access-modal-body-hidden');

        //maintain the modal count to know when to unfreeze the body scroll
        if (document.body.getAttribute('data-modals-opened') === null) {
            document.body.setAttribute('data-modals-opened', 1);
        }
        else {
            var count = parseInt(document.body.getAttribute('data-modals-opened'), 10);
            document.body.setAttribute('data-modals-opened', ++count);

            //get the z-index of the modal I spawned from and increment that to appear above it
            var potentialLowerModal = self.notModalWrap.firstChild;
            if (self.isVisible(potentialLowerModal) && self.hasClass(potentialLowerModal, 'access-modal')) {
                var newZ = self.getZIndex(potentialLowerModal) + 10;
                self.modalChrome.style.zIndex = newZ;
            }
        }

        //keep track of these functions as to remove the listeners later
        self.myFocusFn = self.focusEventRestrictHandler.bind(self);
        self.documentKeyFn = self.onKeyEvent.bind(self);
        self.clickFn = self.onModalClickEvent.bind(self);

        //required: listen for escape on entire document
        document.addEventListener('keydown', self.documentKeyFn);

        //required: listen for click/touch on the close button
        [].forEach.call(self.modalChrome.querySelectorAll(self.closeTriggerSelector), function (closeTrigger) {
            closeTrigger.addEventListener('click', self.clickFn);
            closeTrigger.addEventListener('touch', self.clickFn);
        });

        //required: ensure the tabindex === 0 on the modal content
        self.modalContent.setAttribute('tabindex', 0);

        //focus the modal window itself
        self.modalContent.focus();

        //required: restrict focus
        //var focusableElementsStr = self.focusableElements.join(',');
        //[].forEach.call(document.querySelectorAll(focusableElementsStr), function (anyElement) {
        [].forEach.call(document.querySelectorAll('*'), function (anyElement) {
            anyElement.addEventListener('focus', self.myFocusFn);
        });

        self.callCustom('afterOpen');
    };

    AccessModal.prototype.callCustom = function (userFn) {
        var self = this;
        if (self.options[userFn] !== undefined && typeof self.options[userFn] === 'function') {
            self.options[userFn].call(self);
        }
    };

    //stop focus from anything outside the modal chrome
    AccessModal.prototype.focusEventRestrictHandler = function redirectFocusToModal (e) {
        var self = this;
        if (!self.modalContent.contains(e.target)) {
            e.stopPropagation();
            self.modalContent.focus();
        }
    };

    AccessModal.prototype.close = function close () {
        var self = this;
        self.callCustom('beforeClose');

        //required: move everything out of the aria-hidden wrapper back to the original positions in the body
        while (self.notModalWrap.childNodes.length) {
            document.body.appendChild(self.notModalWrap.firstChild);
        }
        self.modalChrome.parentNode.removeChild(self.notModalWrap);

        //required: unfreeze the body scroll when last modal is removed
        if (document.body.getAttribute('data-modals-opened') !== null) {
           if (parseInt(document.body.getAttribute('data-modals-opened'), 10) === 1) {
                self.removeClass(document.body, 'access-modal-body-hidden');
                document.body.removeAttribute('data-modals-opened');
           }
           else {
               var count = parseInt(document.body.getAttribute('data-modals-opened'), 10);
               document.body.setAttribute('data-modals-opened', --count);
           }
        }

        //required: stop listening on keydown
        if (self.documentKeyFn !== null) {
            document.removeEventListener('keydown', self.documentKeyFn);
            self.documentKeyFn = null; //done with this listener, destroy it
        }

        //required: restore focusability on everything else
        if (self.myFocusFn !== null) {
            //var focusableElementsStr = self.focusableElements.join(',');
            //[].forEach.call(document.querySelectorAll(focusableElementsStr), function (anyElement) {
            [].forEach.call(document.querySelectorAll('*'), function (anyElement) {
                anyElement.removeEventListener('focus', self.myFocusFn);
            });
            self.myFocusFn = null; //done with this listener, destroy it
        }

        //required: stop listening on X
        if (self.clickFn !== null) {
            [].forEach.call(self.modalChrome.querySelectorAll(self.closeTriggerSelector), function (closeTrigger) {
                closeTrigger.removeEventListener('click', self.clickFn);
                closeTrigger.removeEventListener('touch', self.clickFn);
            });
            self.clickFn = null; //done with this listener, destroy it
        }

        //required: restore focus to previous page element after modal has closed
        self.modalChrome.lastFocusedElement.focus();

        //required: destroy the modal chrome (remove from DOM)
        self.modalChrome.parentNode.removeChild(self.modalChrome);

        self.callCustom('afterClose');
    };

    if (typeof define === 'function' && define.amd) { //jshint ignore:line
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define([], function() { //jshint ignore:line
            return { AccessModal: AccessModal };
        });
    }
    else if (typeof exports !== 'undefined') {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        exports.AccessModal = AccessModal; //jshint ignore:line
    }
    else if (typeof window !== 'undefined') {
        // If we're running a web page and don't have either of the above, add our one global
        window.AccessModal = AccessModal;
    }
    else if (typeof global !== 'undefined') {
        // If we don't even have window, try global.
        global.AccessModal = AccessModal; //jshint ignore:line
    }

}(window, document, _));
