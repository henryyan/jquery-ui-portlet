/*
 * jquery.portlet 1.3.1
 *
 * Copyright (c) 2012~2013
 *   咖啡兔 (http://www.kafeitu.me)
 *
 * Dual licensed under the GPL (http://www.gnu.org/licenses/gpl.html)
 * and MIT (http://www.opensource.org/licenses/mit-license.php) licenses.
 *
 * Demo: http://www.kafeitu.me/demo/jquery-ui-portlet
 * Github: https://github.com/henryyan/jquery-ui-portlet
 */
(function($, undefined){
    $.widget("ui.portlet", {
        options: {
            columns: [],
            sortable: true,
            singleView: true,
            removeItem: null,
            filterRepeat: false,
            columnWidth: 300,
            events: {
                drag: {
                    start: null,
                    stop: null,
                    over: null
                }
            }
        },

        /**
         * create portlet widget
         */
        _create: function() {
            this.element.addClass("ui-portlet");
            var _this = this;
            var _ele = _this.element;
            var o = _this.options;
            
            // create empty container if no columns
            if (!o.columns || o.columns.length == 0) {
                $('<div/>', { width: o.columnWidth }).addClass('ui-portlet-column').appendTo(_ele);
            }

            $.each(o.columns, function(ci, c) {

                // create column
                var $column = $('<div/>', {
                    width: c.width
                }).addClass('ui-portlet-column').appendTo(_ele);

                // create portlet in column
                $.each(c.portlets, function(index, portlet) {
                    _this._createSinglePortlet(_this, _ele, $column, 'last', portlet);
                }); // end each of columns
            });

            // init events
            _this._initEvents();

            // bind single view
            if (o.singleView === true) {
                _this._regSingleView();
            }

            // enable/disable sortable
            _this._sortable(o.sortable);
        },

        /**
         * create single portlet
         */
        _createSinglePortlet: function(portlet, _ele, column, positon, pattrs) {
            var o = portlet.options;

            // filter repeated items
            if (o.filterRepeat === true) {
                if (pattrs.attrs.id) {
                    if ($('#' + pattrs.attrs.id).length > 0) {
                        // call repeat function
                        if ($.isFunction(o.handleRepeat)) {
                            var returnCode = o.handleRepeat.call(_ele, column, pattrs);
                            if (returnCode === false) {
                                return;
                            }
                        } else {
                            return;
                        }
                    }
                }
            }

            // call before create, return if callback return false
            if ($.isFunction(pattrs.beforeCreate)) {
                var returnCode = pattrs.beforeCreate.call(_ele, positon);
                if (!returnCode) {
                    return;
                }
            }

            // create portlet item(container)
            var item = $('<div/>').addClass('ui-portlet-item ui-widget ui-widget-content ui-helper-clearfix ui-corner-all')
                        .data('option', pattrs);
            if (positon === 'last') {
                item.appendTo(column);
            } else {
                if (positon.x === 'last') {
                    item.insertAfter($(column).find('.ui-portlet-item:last'));
                } else {
                    item.insertBefore($(column).find('.ui-portlet-item').eq(positon.x));
                }
            }
            if(pattrs.attrs) {
               item.attr(pattrs.attrs);
            }

            // title
            var title = $('<div/>', {
                'class': 'ui-portlet-header ui-widget-header ui-corner-all',
                html: function() {
                    if($.isFunction(pattrs.title)) {
                        return pattrs.title;
                    }
                    if(pattrs.icon) {
                        return "<span class='" + pattrs.icon + "'></span>" + pattrs.title;
                    } else {
                        return pattrs.title;
                    }
                }
            }).appendTo(item);

            // set icon for title
            if(pattrs.icon) {
                title.prepend("<span class='ui-portlet-header-icon ui-icon " + pattrs.icon + "'></span>");
            }

            // event element
            title.prepend("<a href='#' class='ui-corner-all ui-portlet-event'><span class='ui-icon ui-icon-refresh ui-portlet-refresh'></span></a>");
            title.prepend("<a href='#' class='ui-corner-all ui-portlet-event'><span class='ui-icon ui-icon-minusthick ui-portlet-toggle'></span></a>");
            title.prepend("<a href='#' class='ui-corner-all ui-portlet-event'><span class='ui-icon ui-icon-closethick ui-portlet-close'></span></a>");

            // content
            var ct = $('<div/>', {
                'class': 'ui-portlet-content'
            }).appendTo(item);

            // set content style
            if(pattrs.content.style) {
                $(ct).css(pattrs.content.style);
            }

            // set attrs
            if(pattrs.content.attrs) {
                $.each(pattrs.content.attrs, function(k, v) {
                    var attr = ct.attr(k);
                    if(attr) {
                        if(k == 'style' && v.substr(v.length - 1) != ';') {
                            attr += ';';
                        }
                        if(k == 'class') {
                            attr += ' ';
                        }
                        attr += v;
                    }
                    ct.attr(k, attr);
                });
            }

            // load content
            portlet._content.call(_ele, item, pattrs, function(data) {
                // load scripts
                portlet._loadScripts(pattrs.scripts, function() {
                    // call before show
                    if ($.isFunction(pattrs.afterLoadContent)) {
                        pattrs.afterLoadContent.call(item, item.find('.ui-portlet-content'));
                    }
                });
            });

            // call after create
            if ($.isFunction(pattrs.afterCreated)) {
                pattrs.afterCreated.call(_ele);
            }

            return item;
        },

        /**
         * set option for plugin
         * @param {[type]} key   key
         * @param {[type]} value value
         */
        _setOption: function(key, value) {
            var self = this.element;
            var o = this.options;

            // static options
            if(this.options[key]) {
                this.options[key] = value;
            }

            // need handle speical
            switch(key) {
                case "sortable":
                    this._sortable(value);
                    break;
                case "add":
                    this._addSingle(value);
                    break;
                case "remove":
                    $(value, self).find('.ui-portlet-close').trigger('click');
                    break;
                case "filterRepeat":
                    if (value == null || value == undefined) {
                        return o.filterRepeat;
                    } else {
                        o.filterRepeat = value;
                        break;
                    }
            }
        },

        /**
         * get x and y
         * @return {id: {x: 1, y: 0}}
         */
        index: function(a, b) {
            var self = this.element;
            var indexs = {};
            $('.ui-portlet-column').each(function(i, v) {
                $('.ui-portlet-item', this).each(function(j, v2) {
                    var id = $(this).attr('id');
                    indexs[id] = {
                        x: i,
                        y: j
                    };
                });
            });
            return indexs;
        },

        /**
         * single view
         */
        _regSingleView: function() {
            var _ele = this.element;
            $(_ele).find('.ui-portlet-header').dblclick(function() {
                var $item = $(this).parents('.ui-portlet-item');
                var p = $item.data('option');

                // recovery normal model
                if($item.hasClass('ui-portlet-single-view')) {
                    $(_ele).find('.ui-portlet-item').show();
                    $item.removeClass('ui-portlet-single-view').animate({
                        width: $item.data('width'),
                        height: 'auto' // important
                    }).css({
                        position: 'static'
                    }).removeData('width').removeData('height');

                    // callback
                    if(p.singleView) {
                        if($.isFunction(p.singleView.recovery)) {
                            p.singleView.recovery.call($item, p);
                        }
                    }
                } else {
                    // enable single view
                    $(_ele).find('.ui-portlet-item').hide();
                    // move left:0 top:0, set width use body's width
                    $item.show().addClass('ui-portlet-single-view').data({
                        width: $item.width(),
                        height: $item.height()
                    }).css({
                        position: 'absolute',
                        left: 0,
                        top: 0
                    });

                    // set width and height when enable single view
                    var wh = {};
                    if(p.singleView) {
                        // use custom width and height
                        if(p.singleView.width) {
                            if($.isFunction(p.singleView.width)) {
                                wh.width = p.singleView.width.call($item, p);
                            } else {
                                wh.width = p.singleView.width;
                            }
                        }
                        if(p.singleView.height) {
                            if($.isFunction(p.singleView.height)) {
                                wh.height = p.singleView.height.call($item, p);
                            } else {
                                wh.height = p.singleView.height;
                            }
                        }

                    } else {
                        // use default width
                        wh.width = $(_ele).width() + 14;
                    }

                    $item.animate({
                        width: wh.width,
                        height: wh.height
                    });

                    // callback
                    if(p.singleView && $.isFunction(p.singleView.enable)) {
                        p.singleView.enable.call($item, p);
                    }
                }
            });
        },

        /**
         * load java scripts
         * @param  {[string]} scripts [description]
         */
        _loadScripts: function(scripts, callback) {
            if(scripts) {
                $.each(scripts, function() {
                    var head = $('head').remove('#loadScript');
                    $("<script></script>").attr({
                        src: this,
                        type: 'text/javascript',
                        id: 'loadScript'
                    }).appendTo(head);
                });
            }
            if ($.isFunction(callback)) {
                callback();
            }
        },

        /**
         * enable/disable sortable
         * @param  {[type]} value [true|false]
         */
        _sortable: function(value) {
            var o = this.options;
            var st = $(".ui-portlet-column", this.element).sortable({
                connectWith: ".ui-portlet-column",
                start: function(event, ui) {
                    if ($.isFunction(o.events.drag.start)) {
                        o.events.drag.start.call(ui.item[0], event, ui);
                    }
                },
                stop: function(event, ui) {
                    if ($.isFunction(o.events.drag.stop)) {
                        o.events.drag.stop.call(ui.item[0], event, ui);
                    }
                },
                over: function(event, ui) {
                    if ($.isFunction(o.events.drag.over)) {
                        o.events.drag.over.call(ui.item[0], event, ui);
                    }
                }
            });
            if(value === true) {
                $(this.element).find('.ui-portlet-header').css('cursor', 'move');
                st.sortable('enable');
                $(".ui-portlet-content", this.element).draggable({
                    start: function(e, ui) {
                        return false;
                    }
                });
            } else {
                $(this.element).find('.ui-portlet-header').css('cursor', 'default');
                st.sortable('disable');
            }
        },

        /**
         * add a portlet
         */
        _addSingle: function(option) {
            var _this = this;
            var _ele = _this.element;
            var o = this.options;
            var addOpt = option;
            var column;
            if ($('.ui-portlet-column', _ele).eq(addOpt.position.y).length > 0) {
                column = $('.ui-portlet-column', _ele).eq(addOpt.position.y);
            } else {
                column = $('.ui-portlet-column', _ele).eq(0);
            }
            console.log(column);
            // create portlet
            var item = _this._createSinglePortlet(_this, _ele, column, option.position, option.portlet);

            // init events
            _this._initEvents(item);

            // bind single view
            if (o.singleView === true) {
                _this._regSingleView();
            }

            // enable/disable sortable
            _this._sortable(o.sortable);

        },

        /**
         * events and handlers
         * @return {[type]} [description]
         */
        _initEvents: function(element) {
            var _this = this;
            var _ele = element || this.element;

            // toggle contents
            var toggle = $(".ui-portlet-toggle", _ele).click(function(event, type) {
                var ct = $(this).parents(".ui-portlet-item:first").find(".ui-portlet-content");
                type = type || 'toggle';
                if (type == 'toggle') {
                    ct.slideToggle();
                    $(this).toggleClass("ui-icon-minusthick").toggleClass("ui-icon-plusthick");
                } else if (type == 'hide') {
                    ct.slideUp();
                    $(this).removeClass("ui-icon-minusthick").addClass("ui-icon-plusthick");
                } else if (type == 'show') {
                    ct.slideDown();
                    $(this).removeClass("ui-icon-plusthick").addClass("ui-icon-minusthick");
                }
            }).dblclick(function(event) {
                event.stopPropagation();
            });

            var refresh = $(".ui-portlet-refresh", _ele).click(function(event) {
                _this.refresh.call(_this, event);
            }).dblclick(function(event) {
                event.stopPropagation();
            });

            var close = $(".ui-portlet-close", _ele).click(function(event) {
                _this._destoryItem.call(_this, event);
            }).dblclick(function(event) {
                event.stopPropagation();
            });

            this._hoverable(toggle.parent());
            this._hoverable(refresh.parent());
        },

        /**
         * hoverable
         */
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
            var itemOpt = item.data('option');

            // filter remove item
            if ($.isFunction(itemOpt.beforeRemove)) {
                var returnCode = itemOpt.beforeRemove();
                if (!returnCode) {
                    return;
                }
            }

            // do remove
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
            var portlet = $(event.target).parents('.ui-portlet');
            var item = $(event.target).parents('.ui-portlet-item');
            var pio = item.data('option');
            var ct = item.find('.ui-portlet-content');
            var pt = item.parents('.ui-portlet');

            // callback
            if($.isFunction(pio.beforeRefresh)) {
                pio.beforeRefresh.call(pt, pio);
            }

            // set contents
            this._content.call(portlet, item, pio, function(data) {
                // callback
                if($.isFunction(pio.afterRefresh)) {
                    pio.afterRefresh.call(pt, data, pio);
                }
            });

            // load scripts
            this._loadScripts(pio.scripts);
        },

        /**
         * get content from multi styles
         * @param  {[type]} item [.ui-portlet-item]
         * @param  {[type]} pio  [portlet configs]
         * @param  {[type]} cl   [callback after load]
         */
        _content: function(item, pio, cl) {
            var o = this.options;
            var that = this;
            var type = pio.content.type;
            var content = null;
            var ct = item.find('.ui-portlet-content');

            // before show callback
            if($.isFunction(pio.content.beforeShow)) {
                pio.content.beforeShow.call(this, pio.content.text);
            }

            if(type == 'text') {
                content = pio.content.text;

                // get content from function
                if($.isFunction(content)) {
                    content = content(that, item, pio);
                }

                if($.isFunction(cl)) {
                    cl.call(that, content);
                }
                ct.html(content);
                _callAfterShow(pio.content.text);
            } else if(type == 'ajax') {
                var dataType = pio.content.dataType || 'html';
                $.ajax({
                    url: pio.content.url,
                    dataType: dataType,
                    beforeSend: function() {
                        $(ct).html('Loading...');
                    },
                    success: function(data, textStatus, jqXHR) {
                        if(dataType == 'html') {
                            content = data;
                            $(ct).html(data);
                        } else if(dataType == 'json') {
                            if($.isFunction(pio.content.formatter)) {
                                content = pio.content.formatter(o, pio, data);
                                $(ct).html(content);
                            }
                        }
                        _callAfterShow(content);
                        if($.isFunction(cl)) {
                            cl.call(that, data);
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        var content = "<span style='padding:0.2em' class='ui-state-error ui-corner-all'>Load Error...</span>";
                        $(ct).html(content);
                        if ($.isFunction(pio.content.error)) {
                            pio.content.error.call(ct, jqXHR, textStatus, errorThrown);
                        }
                    }
                });
            }

            /**
             * after show callback
             */

            function _callAfterShow(content) {
                if($.isFunction(pio.content.afterShow)) {
                    pio.content.afterShow.call(that, content);
                }
            }

        },

        /**
         * toggle single portlet
         */
        toggle: function(itemId, type) {
            var self = this.element;
            $('#' + itemId + ' .ui-portlet-toggle', self).trigger('click', [ type || 'toggle' ]);
        },

        /**
         * toggle all portlet
         */
        toggleAll: function(type) {
            var self = this.element;
            $('.ui-portlet-toggle', self).trigger('click', [ type || 'toggle' ]);
        },

        /**
         * destory portlet
         */
        destroy: function() {
            this.element.removeClass("ui-portlet").text("");

            // call the base destroy function
            $.Widget.prototype.destroy.call(this);
            return this;
        }
    });

})(jQuery);