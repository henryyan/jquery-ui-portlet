(function($) {
    $.widget("kft.portlet", {
        options: {
            columns: {},
            sortable: true,
            beforeRefresh: null,
            afterRefresh: null,
            removeItem: null
        },

        /**
         * create portlet widget
         */
        _create: function() {
            this.element.addClass("ui-portlet");
            var _this = this;
            var _ele = _this.element;
            var o = _this.options;

            $.each(o.columns, function(ci, c) {

                var $column = $('<div/>', {
                    'class': 'ui-portlet-column',
                    width: c.width
                }).appendTo(_ele);

                $.each(c.portlets, function(pi, p) {

                    var item = $('<div/>', {
                        'class': 'ui-portlet-item ui-widget ui-widget-content ui-helper-clearfix ui-corner-all',
                    }).data('option', p).appendTo($column);
                    if (p.attrs) {
                        item.attr(p.attrs);
                    }

                    // title
                    var title = $('<div/>', {
                        'class': 'ui-portlet-header ui-widget-header ui-corner-all',
                        html: p.title
                    }).appendTo(item);

                    // event element
                    title.prepend("<a href='#' class='ui-corner-all'><span class='ui-icon ui-icon-refresh ui-portlet-refresh'></span></a>");
                    title.prepend("<a href='#' class='ui-corner-all'><span class='ui-icon ui-icon-minusthick ui-portlet-toggle'></span></a>");
                    title.prepend("<a href='#' class='ui-corner-all'><span class='ui-icon ui-icon-closethick ui-portlet-close'></span></a>");

                    // content
                    var ct = $('<div/>', {
                        'class': 'ui-portlet-content'
                    }).appendTo(item);
                    ct.html(_this._content(ct, p, function() {
                        if(p.js) {
                            $.each(p.js, function() {
                                var head = $('head').remove('#loadScript');
                                $("<script>" + "</script>").attr({
                                    src: this,
                                    type: 'text/javascript',
                                    id: 'loadScript'
                                }).appendTo(head);
                            });
                        }
                    }));
                });
            });

            // init events
            _this._initEvents();

            _this._sortable(o.sortable);
        },

        _setOption: function(key, value) {
            // static options
            if(this.options[key]) {
                this.options[key] = value;
            }

            alert(this);

            // need handle speical
            switch(key) {
            case "sortable":
                this._sortable(value);
                break;
            }
        },

        /**
         * enable/disable sortable
         * @param  {[type]} value [true|false]
         */
        _sortable: function(value) {
            var st = $(".ui-portlet-column").sortable({
                connectWith: ".ui-portlet-column"
            }).disableSelection();
            if(value === true) {
                st.sortable('enable');
            } else {
                st.sortable('disable');
            }
        },

        /**
         * events and handlers
         * @return {[type]} [description]
         */
        _initEvents: function() {
            var _this = this;

            // toggle contents
            var toggle = $(".ui-portlet-toggle", this.element).click(function() {
                $(this).toggleClass("ui-icon-minusthick").toggleClass("ui-icon-plusthick");
                $(this).parents(".ui-portlet-item:first").find(".ui-portlet-content").toggle();
            });

            var refresh = $(".ui-portlet-refresh", this.element).click(function(event) {
                _this.refresh.call(_this, event);
            });

            var close = $(".ui-portlet-close", this.element).click(function(event) {
                _this._destoryItem.call(_this, event);
            });

            this._hoverable(toggle.parent());
            this._hoverable(refresh.parent());
        },

        _hoverable: function(element) {
            $(element).hover(function() {
                $(this).addClass('ui-state-hover');
            }, function() {
                $(this).removeClass('ui-state-hover');
            });
        },

        /**
         * destory single portlet
         */
        _destoryItem: function(event) {
            var o = this.options;
            var item = $(event.target).parents('.ui-portlet-item');
            item.remove();
            if($.isFunction(o.removeItem)) {
                o.removeItem();
            }
        },

        /**
         * refresh contents
         */
        refresh: function(event) {
            var o = this.options;
            var item = $(event.target).parents('.ui-portlet-item');
            var option = item.data('option');
            var p = item.data('option');
            var ct = item.find('.ui-portlet-content');
            var pt = item.parents('.ui-portlet');

            // callback
            if($.isFunction(o.beforeRefresh)) {
                o.beforeRefresh.call(pt, option);
            }

            ct.html(this._content.call(pt, ct, p, function(data) {
                // callback
                if($.isFunction(o.afterRefresh)) {
                    o.afterRefresh.call(pt, data, option);
                }
            }))
        },

        /**
         * get content from multi styles
         * @param  {[type]} ct [.ui-portlet-content]
         * @param  {[type]} p  [portlet configs]
         * @param  {[type]} cl [callback after load]
         */
        _content: function(ct, p, cl) {
            var that = this;
            var type = p.content.type;
            if(type == 'text') {
                var content = p.content.text;
                if($.isFunction(cl)) {
                    cl.call(that, content);
                }
                return content;
            } else if(type == 'ajax') {
                var dataType = p.content.dataType || 'html';
                $.ajax({
                    url: p.content.url,
                    dataType: dataType,
                    success: function(data, textStatus, jqXHR) {
                        if(dataType == 'html') {
                            $(ct).html(data);
                        } else if(dataType == 'json') {
                            $(ct).html(p.content.formatter(data));
                        }
                        if($.isFunction(cl)) {
                            cl.call(that, data);
                        }
                    }
                });

            }
        },

        /**
         * destory portlet
         */
        _destroy: function() {
            this.element.removeClass("ui-portlet").text("");

            // call the base destroy function
            $.Widget.prototype.destroy.call(this);
            return this;
        }
    });

})(jQuery);