frappe.ui.form.on("POS Profile", {
    custom_show_only_list_view: function () {
        if(cur_frm.doc.custom_show_only_list_view){
            cur_frm.doc.custom_show_only_card_view = 0
        cur_frm.refresh_field("custom_show_only_card_view")
        }

    },
    custom_show_only_card_view: function () {
        if(cur_frm.doc.custom_show_only_card_view){
            cur_frm.doc.custom_show_only_list_view = 0
            cur_frm.refresh_field("custom_show_only_list_view")
        }


    }
})
