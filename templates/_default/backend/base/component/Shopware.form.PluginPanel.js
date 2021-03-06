/**
 * Shopware 4.0
 * Copyright © 2012 shopware AG
 *
 * According to our dual licensing model, this program can be used either
 * under the terms of the GNU Affero General Public License, version 3,
 * or under a proprietary license.
 *
 * The texts of the GNU Affero General Public License with an additional
 * permission and of our proprietary license can be found at and
 * in the LICENSE file you have received along with this program.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * "Shopware" is a registered trademark of shopware AG.
 * The licensing of the program under the AGPLv3 does not imply a
 * trademark license. Therefore any rights, title and interest in
 * our trademarks remain entirely with us.
 *
 * @category   Shopware
 * @package    Base
 * @subpackage Component
 * @copyright  Copyright (c) 2012, shopware AG (http://www.shopware.de)
 * @version    $Id$
 * @author shopware AG
 */
//{namespace name="backend/config/controller/main"}
Ext.define('Shopware.form.PluginPanel',
/** @lends Ext.form.Panel# */
{
    /**
     * The parent class that this class extends.
     * @string
     */
    extend: 'Ext.form.Panel',

    /**
     * Alternate class name for the component.
     * @string
     */
    alternateClassName: 'Shopware.form.ConfigPanel',

    /**
     * List of short aliases for class names
     * @array
     */
    alias: 'widget.plugin-form-panel',

    /**
     * Store which contains the different shops.
     * @object Ext.data.Store
     */
    shopStore: Ext.create('Shopware.apps.Base.store.ShopLanguage'),

    /**
     * Store which contains the form elements.
     * @object Ext.data.Store
     */
    formStore: Ext.create('Shopware.apps.Base.store.Form'),

    /**
     * Truthy to include the buttons, falsy to prevent that behavior
     * @boolean
     */
    injectActionButtons: false,

    descriptionField: true,

    _descriptionAdded: false,

    /**
     * Initiliazes the component, loads the stores and creates the view.
     *
     * @public
     * @return void
     */
    initComponent: function() {
        var me = this;

        // Check if we're having a plugin form id
        if(!me.formId) {
            Ext.Error.raise("No formId is passed to the component configuration");
            return false;
        }

        // Cast the id to an integer
        me.formId = ~~(1 * me.formId);

        if(!me.shopStore.getCount()) {
            me.shopStore.load();
        }

        // Prepare form store and load the form record
        me.formStore.on('load', me.onLoadForm, me, { single: true });
        me.formStore.load({
            filters : [{
                property: 'id',
                value: me.formId
            }]
        });

        me.callParent(arguments);
    },

    /**
     * Event listener method which will be called when the form store was
     * loaded.
     *
     * Prepares the form and calls the "initForm"-method.
     *
     * @public
     * @event load
     * @param [object] store - Shopware.apps.Base.store.Form
     * @param [array] records - Array of returned records
     * @param [boolean] success - Truthy if the operation was successfully, if falsy the operation failed.
     * @return [boolean|void]
     */
    onLoadForm: function(store, records, success) {
        var me = this;

        // Check the response
        if (success !== true || !records.length) {
            Ext.Error.raise("The form store couldn't be loaded successfully.");
            return false;
        }

        // Initialize the form
        me.initForm(records[0]);
    },

    /**
     * Initializes the form panel and checks if the shop store
     * was loaded successfully.
     *
     * @public
     * @param [object] form - Shopware.apps.Base.model.Form
     * @return void
     */
    initForm: function(form) {
        var me = this;

        // If the shop store isn't fully loaded yet, defer the "initForm"-call
        if(me.shopStore.isLoading() || !me.rendered) {
            Ext.defer(me.initForm, 100, me, [ form ]);
            return false;
        }

        if(me.injectActionButtons) {
            me.addDocked(me.getButtons());
        }
        me.add(me.getItems(form));
        me.loadRecord(form);
    },

    /**
     * Creates the action toolbar which is docked (bottom)
     * to the form panel.
     *
     * @public
     * @return [array]
     */
    getButtons: function() {
        var me = this;

        return {
            dock: 'bottom',
            xtype: 'toolbar',
            items: ['->', {
                text: '{s name=form/reset_text}Reset{/s}',
                cls: 'secondary',
                action: 'reset'
            }, {
                text: '{s name=form/save_text}Save{/s}',
                cls: 'primary',
                action: 'save'
            }]
        };
    },

    /**
     * Creates the form elements based on the passed Shopware.apps.Base.model.Form
     * model.
     *
     * @public
     * @param [object] form - Shopware.apps.Base.model.Form
     * @return [array] - array of form element objects (initialConfig)
     */
    getItems: function(form) {
        var me = this,
            type, name, value,
            elementLabel = '',
            elementDescription = '', elementName,
            items = [],
            tabs = [], options;

        if(form.get('description') && me.descriptionField) {

            if(!me._descriptionAdded) {
                items.push({
                    xtype: 'fieldset',
                    margin: 10,
                    title: '{s name=form/description_title}Description{/s}',
                    html: form.get('description')
                });

                // Set private flag
                me._descriptionAdded = true;
            }
        }

        me.shopStore.each(function(shop) {
            var fields = [];
            form.getElements().each(function(element) {
                value = element.getValues().find('shopId', shop.getId());
                value = element.getValues().getAt(value);

                type = element.get('type').toLowerCase();
                type = 'base-element-' + type;
                name = 'values[' + shop.get('id') + ']['+ element.get('id') + ']';

                options = element.get('options');
                options = options || {};
                delete options.attributes;

                elementName = element.get('name');
                elementLabel = element.get('label');
                elementDescription = element.get('description');
                if(element.associations.containsKey('getTranslation')) {
                    if(element.getTranslation().getAt(0) && element.getTranslation().getAt(0).get('label')) {
                        elementLabel = element.getTranslation().getAt(0).get('label');
                    }

                    if(element.getTranslation().getAt(0) && element.getTranslation().getAt(0).get('description')) {
                        elementDescription = element.getTranslation().getAt(0).get('description');
                    }
                }

                fields.push(Ext.apply({
                    xtype: type,
                    name: name,
                    elementName: elementName,
                    fieldLabel: elementLabel,
                    helpText: elementDescription, //helpText
                    value: value ? value.get('value') : element.get('value'),
                    emptyText: shop.get('default') ? null : element.get('value'),
                    disabled: !element.get('scope') && !shop.get('default'),
                    allowBlank: !element.get('required') || !shop.get('default')
                }, options));
            });
            if(fields.length > 0) {
                tabs.push({
                    xtype: 'base-element-fieldset',
                    title: shop.get('name'),
                    items: fields
                });
            }
        });

        if(tabs.length > 1) {
            items.push({
                xtype: 'tabpanel',
                bodyStyle: 'background-color: transparent !important',
                border: 0,
                activeTab: 0,
                enableTabScroll: true,
                deferredRender: false,
                items: tabs,
                plain: true
            });
        } else if(tabs.length == 1) {
            if(tabs[0].title) {
                delete tabs[0].title;
            }
            items.push({
                xtype: 'panel',
                bodyStyle: 'background-color: transparent !important',
                border: 0,
                layout: 'fit',
                items: tabs,
                bodyBorder: 0
            });
        }
        return items;
    },

    /**
     * Event listener method which triggers when the user
     * wants to save the plugin configuraton form.
     *
     * @public
     * @param [object] button - Ext.button.Button
     */
    onSaveForm: function(formPanel, closeWindow, callback) {
        var me = this,
            basicForm = formPanel.getForm() || me.getForm(),
            form = basicForm.getRecord(),
            values = basicForm.getFieldValues(),
            fieldName, fieldValue, valueStore,
            win = formPanel.up('window');

        closeWindow = closeWindow || false;

        form.getElements().each(function(element) {
            valueStore = element.getValues();
            valueStore.removeAll();
            me.shopStore.each(function(shop) {
                fieldName = 'values[' + shop.get('id') + ']['+ element.get('id') + ']';
                fieldValue = values[fieldName];
                if(fieldValue !== '' && fieldValue !== null) {
                    valueStore.add({
                        shopId: shop.get('id'),
                        value: fieldValue
                    });
                }
            });
        });

        form.setDirty();

        var title = '{s name=form/message/save_form_title}Save form{/s}';

        form.store.add(form);
        form.store.sync({
            success :function (records, operation) {
                var template = new Ext.Template('{s name=form/message/save_form_success}Form „[name]“ has been saved.{/s}'),
                    message = template.applyTemplate({
                        name: form.data.label || form.data.name
                    });
                Shopware.Notification.createGrowlMessage(title, message, win.title);
                if(closeWindow) {
                    win.destroy();
                }
                if(callback) {
                    callback.apply(me, records, operation);
                }
            },
            failure:function (records, operation) {
                var template = new Ext.Template('{s name=form/message/save_form_error}Form „[name]“ could not be saved.{/s}'),
                    message = template.applyTemplate({
                        name: form.data.label || form.data.name
                    });
                Shopware.Notification.createGrowlMessage(title, message, win.title);
            }
        });
    }
});