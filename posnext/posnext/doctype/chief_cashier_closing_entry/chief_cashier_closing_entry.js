frappe.ui.form.on('Chief Cashier Closing Entry', {
    refresh: function(frm) {
        // Restore HTML summary on refresh
        if (frm.doc.payment_summary_data && frm.fields_dict.payment_summary) {
            frm.fields_dict.payment_summary.$wrapper.html(frm.doc.payment_summary_data);
        }

        if (frm.doc.docstatus === 0) {
            frm.add_custom_button('Get Closing Entry', async function () {
                if (!frm.doc.posting_date) {
                    frappe.msgprint("Please select a Posting Date first.");
                    return;
                }
                frm.set_value("posting_time", frappe.datetime.now_time());
                fetch_closing_entries_and_summary(frm);
            });
        }

        if (frm.doc.docstatus === 1) {
            frm.add_custom_button('Create Payment Transfer', function () {
            frappe.model.with_doctype('Payment Entry', () => {
                const doc = frappe.model.get_new_doc('Payment Entry');
                doc.payment_type = 'Internal Transfer';
                doc.custom_cashier_pos_closing_entry = frm.doc.name;
                frappe.set_route('Form', 'Payment Entry', doc.name);

                // Delay setting the field until after routing
                // frappe.after_ajax(() => {
                // frappe.model.set_value('Payment Entry', doc.name, 'custom_cashier_pos_closing_entry', frm.doc.name);
                // });
            });
            });
        }

    },

    posting_date: function(frm) {
        frm.clear_table("closed_pos_closing_entries");
        frm.refresh_field("closed_pos_closing_entries");

        if (frm.fields_dict.payment_summary) {
            frm.fields_dict.payment_summary.$wrapper.empty();
            frm.set_value("payment_summary_data", "");
        }

        if (frm.doc.posting_date) {
            frm.set_value("posting_time", frappe.datetime.now_time());
            fetch_closing_entries_and_summary(frm);
        }
    },

    banked_amount: function(frm) {
        if (frm.doc.total_amount !== undefined && frm.doc.total_amount !== null) {
            const unbanked = frm.doc.total_amount - frm.doc.banked_amount;
            frm.set_value("unbanked_amount", unbanked);
        }
    },

    total_amount: function(frm) {
        if (frm.doc.banked_amount !== undefined && frm.doc.banked_amount !== null) {
            const unbanked = frm.doc.total_amount - frm.doc.banked_amount;
            frm.set_value("unbanked_amount", unbanked);
        }
    }
});

// Helper function
async function fetch_closing_entries_and_summary(frm) {
    // Fetch and populate Closed POS Closing Entries table
    await frappe.call({
        method: "posnext.posnext.doctype.chief_cashier_closing_entry.chief_cashier_closing_entry.get_open_pos_closings",
        args: {
            posting_date: frm.doc.posting_date
        },
        callback: function(r) {
            if (r.message && r.message.length > 0) {
                frm.clear_table("closed_pos_closing_entries");
                r.message.forEach(entry => {
                    const row = frm.add_child("closed_pos_closing_entries");
                    row.pce_id = entry.name;
                });
                frm.refresh_field("closed_pos_closing_entries");
            } else {
                frappe.msgprint("No open POS Closing Entries found for the selected posting date.");
            }
        }
    });

    // Fetch Payment Summary and render
    frappe.call({
        method: "posnext.posnext.doctype.chief_cashier_closing_entry.chief_cashier_closing_entry.get_payment_summary",
        args: {
            posting_date: frm.doc.posting_date
        },
        callback: function(r) {
            if (r.message && Object.keys(r.message).length > 0) {
                const summary = r.message;
                const all_mops = new Set();
                const mop_totals = {};
                let grand_total = 0;

                for (let user in summary) {
                    for (let mop in summary[user]) {
                        all_mops.add(mop);
                    }
                }

                const mops = Array.from(all_mops).sort();

                let html = `<table class="table table-bordered table-sm">
                    <thead>
                        <tr>
                            <th style="text-align:left;">Cashier</th>`;
                mops.forEach(mop => {
                    html += `<th style="text-align:right;">${mop}</th>`;
                    mop_totals[mop] = 0;
                });
                html += `<th style="text-align:right;">Total</th></tr></thead><tbody>`;

                for (let user in summary) {
                    let user_total = 0;
                    html += `<tr><td>${user}</td>`;
                    mops.forEach(mop => {
                        const amt = summary[user][mop] || 0;
                        user_total += amt;
                        mop_totals[mop] += amt;
                        html += `<td style="text-align: right;">${format_currency(amt)}</td>`;
                    });
                    grand_total += user_total;
                    html += `<td style="text-align: right; font-weight: bold;">${format_currency(user_total)}</td></tr>`;
                }

                html += `<tr style="font-weight: bold;">
                    <td>Total</td>`;
                mops.forEach(mop => {
                    html += `<td style="text-align: right;">${format_currency(mop_totals[mop])}</td>`;
                });
                html += `<td style="text-align: right;">${format_currency(grand_total)}</td></tr>`;
                html += `</tbody></table>`;

                // Set summary HTML and total_amount
                frm.set_value("payment_summary_data", html);
                frm.set_value("total_amount", grand_total);
                frm.fields_dict.payment_summary.$wrapper.html(html);

                // Set unbanked_amount even if zero
                if (frm.doc.banked_amount !== undefined && frm.doc.banked_amount !== null) {
                    const unbanked = grand_total - frm.doc.banked_amount;
                    frm.set_value("unbanked_amount", unbanked);
                }

                frm.save();
            } else {
                frm.fields_dict.payment_summary.$wrapper.empty();
                frm.set_value("payment_summary_data", "");
                frm.set_value("total_amount", 0);
                frm.set_value("unbanked_amount", 0);
            }
        }
    });
}
