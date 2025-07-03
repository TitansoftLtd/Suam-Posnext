frappe.listview_settings['Item'] = frappe.listview_settings['Item'] || {};

frappe.listview_settings['Item'].onload = function(listview) {
    listview.page.add_actions_menu_item(__('Barcode Print'), function() {
        const selected_docs = listview.get_checked_items();

        if (!selected_docs.length) {
            frappe.msgprint(__('Please select at least one Item'));
            return;
        }

        const item_codes = selected_docs.map(doc => doc.name);

        frappe.call({
            method: 'posnext.doc_events.item.print_barcodes',
            args: { item_codes },
            callback: function(r) {
                if (r.message && r.message.url) {
                    window.open(r.message.url, '_blank');  
                } else {
                    frappe.msgprint(__('Could not generate barcode print URL.'));
                }
            }
        });
    });
};

