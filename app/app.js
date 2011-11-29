var cb;
Ext.application({

    launch: function() {
        cb = this;
        cb.cards = Ext.create('Ext.Panel', {
            layout    : 'card',
            fullscreen: true,
            cardSwitchAnimation: 'slide',
            items: [{
                // the list card
                id: 'listCard',
                layout: 'fit',
                items: [{
                    // main top toolbar
                    xtype: 'toolbar',
                    docked: 'top',
                    title: 'Please waist' // will get added once loaded
                }, {
                    // the list itself, gets bound to the store programmatically once it's loaded
                    id: 'dataList',
                    xtype: 'list',
                    store: null,
                    itemTpl:
                        '<img class="photo" src="{photo_url}" width="40" height="40"/>' +
                        '{name}<br/>' +
                        '<img src="{rating_img_url_small}"/>&nbsp;' +
                        '<small>{address1}</small>',
                    listeners: {
                        selectionchange: function (selectionModel, records) {
                            // if selection made, slide to detail card
                            if (records[0]) {
                                cb.cards.setActiveItem(cb.cards.detailCard);
                                cb.cards.detailCard.setData(records[0].data);
                            }
                        }
                    }
                }]
            }, {
                // the details card
                id: 'detailCard',
                items: [{
                    // detail page also has a toolbar
                    docked : 'top',
                    xtype: 'toolbar',
                    title: '',
                    setData: function(data) {
                        this.setTitle(data.name);
                    },
                    items: [{
                        // containing a back button that slides back to list card
                        text: 'Back',
                        ui: 'back',
                        listeners: {
                            tap: function () {
                                cb.cards.setActiveItem(
                                    cb.cards.listCard,
                                    {type:'slide', direction: 'right'}
                                );
                            }
                        }
                    }]
                }, {
                    // textual detail
                    title: 'Contact',
                    styleHtmlContent: true,
                    cls: 'detail',
                    tpl: [
                        '<img class="photo" src="{photo_url}" width="100" height="100"/>',
                        '<h2>{name}</h2>',
                        '<div class="info">',
                            '{address1}<br/>',
                            '<img src="{rating_img_url_small}"/>',
                        '</div>',
                        '<div class="phone x-button">',
                            '<a href="tel:{phone}">{phone}</a>',
                        '</div>',
                        '<div class="link x-button">',
                            '<a href="{mobile_url}">Read more</a>',
                        '</div>'
                    ]
                }],
                setData: function(data) {
                    this.updateStyleHtmlContent(true);
                    // updating card cascades to update each tab
                    Ext.each(this.items.items, function(item) {
                        item.setData(data);
                    });
                }
            }],


            listeners: {
                'painted': function () {
                    // when the viewport loads, we go through a callback-centric sequence to load up:
                    // a) the name of the nearest city
                    // b) the local businesses from Yelp

                    //some useful references
                    var cards = this;
                    cards.listCard = cards.getComponent('listCard');
                    cards.dataList = cards.listCard.getComponent('dataList');
                    cards.detailCard = cards.getComponent('detailCard');

                    // get the city, then...
                    cb.getCity(function (city) {

                        // update status bar
                        cards.listCard.query('toolbar[docked="top"]')[0].setTitle(city + ' ' + BUSINESS_TYPE);

                        // then use Yelp to get the businesses
                        cb.getBusinesses(city, function (store) {

                            // then bind data to list and show it
                            cards.dataList.setStore(store);
                            cards.setActiveItem(cards.listCard);

                        });
                    });

                }
            }

        });
    },

    getCity: function (callback) {
        callback(DEFAULT_CITY);
        // this could be a geo lookup to get the nearest city
    },

    getBusinesses: function (city, callback) {
        // create data model

        Ext.define("Business", {
            extend: "Ext.data.Model",
            fields: [
                {name: "id", type: "int"},
                {name: "name", type: "string"},
                {name: "latitude", type: "string"},
                {name: "longitude", type: "string"},
                {name: "address1", type: "string"},
                {name: "address2", type: "string"},
                {name: "address3", type: "string"},
                {name: "phone", type: "string"},
                {name: "state_code", type: "string"},
                {name: "mobile_url", type: "string"},
                {name: "rating_img_url_small", type: "string"},
                {name: "photo_url", type: "string"},
            ]
        });

        Ext.regStore("businesses", {
            model: 'Business',
            autoLoad: true,
            proxy: {
                // call Yelp to get business data
                type: 'scripttag',
                url: 'http://api.yelp.com/business_review_search' +
                    '?ywsid=' + YELP_KEY +
                    '&term=' + escape(BUSINESS_TYPE) +
                    '&location=' + escape(city)
                ,
                reader: {
                    type: 'json',
                    root: 'businesses'
                }
            },
            listeners: {
                // when the records load, fire the callback
                'load': function (store) {
                    callback(store);
                }
            }
        })

        Ext.create('Ext.LoadMask', Ext.getBody(), {
            store: 'businesses',
            msg: ''
        });

    }

});