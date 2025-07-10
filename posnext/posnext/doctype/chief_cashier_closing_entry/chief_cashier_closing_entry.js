frappe.ui.form.on('Chief Cashier Closing Entry', {
    refresh: function (frm) {
        // Render summary HTML if exists
        if (frm.doc.payment_summary_data && frm.fields_dict.payment_summary) {
            frm.fields_dict.payment_summary.$wrapper.html(frm.doc.payment_summary_data);
        }

        // Allow fetching only in draft
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
                });
            });
        }

        // Update latest banked/unbanked amount
        if (!frm.is_new() && frm.doc.docstatus === 1) {
            update_banked_and_unbanked(frm);
        }
    },

    posting_date: function (frm) {
        frm.clear_table("closed_pos_closing_entries");
        frm.refresh_field("closed_pos_closing_entries");

        if (frm.fields_dict.payment_summary) {
            frm.fields_dict.payment_summary.$wrapper.empty();
            frm.set_value("payment_summary_data", "");
        }

        if (frm.doc.posting_date) {
            frm.set_value("posting_time", frappe.datetime.now_time());
            fetch_closing_entries_and_summary(frm);
        } else {
            frm.set_value("total_amount", 0);
            frm.set_value("banked_amount", 0);
            frm.set_value("unbanked_amount", 0);
        }
    },

    banked_amount: function (frm) {
        if (frm.doc.total_amount !== undefined && frm.doc.total_amount !== null) {
            const unbanked = frm.doc.total_amount - frm.doc.banked_amount;
            frm.set_value("unbanked_amount", unbanked);
        }
    },

    total_amount: function (frm) {
        if (frm.doc.banked_amount !== undefined && frm.doc.banked_amount !== null) {
            const unbanked = frm.doc.total_amount - frm.doc.banked_amount;
            frm.set_value("unbanked_amount", unbanked);
        }
    }
});

async function fetch_closing_entries_and_summary(frm) {
    // Fetch POS Closing Entries
    await frappe.call({
        method: "posnext.posnext.doctype.chief_cashier_closing_entry.chief_cashier_closing_entry.get_open_pos_closings",
        args: {
            posting_date: frm.doc.posting_date
        },
        callback: function (r) {
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

    // Fetch and render payment summary
    frappe.call({
        method: "posnext.posnext.doctype.chief_cashier_closing_entry.chief_cashier_closing_entry.get_payment_summary",
        args: {
            posting_date: frm.doc.posting_date
        },
        callback: async function (r) {
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
                    <thead><tr><th style="text-align:left;">Cashier</th>`;
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

                html += `<tr style="font-weight: bold;"><td>Total</td>`;
                mops.forEach(mop => {
                    html += `<td style="text-align: right;">${format_currency(mop_totals[mop])}</td>`;
                });
                html += `<td style="text-align: right;">${format_currency(grand_total)}</td></tr>`;
                html += `</tbody></table>`;

                // Update UI always
                frm.fields_dict.payment_summary.$wrapper.html(html);

                // Update DB only if values changed
                const new_values = {
                    payment_summary_data: html,
                    total_amount: grand_total,
                    unbanked_amount: grand_total - (frm.doc.banked_amount || 0)
                };

                const changes = {};
                for (let key in new_values) {
                    if (frm.doc[key] !== new_values[key]) {
                        changes[key] = new_values[key];
                    }
                }

                if (Object.keys(changes).length > 0) {
                    await frappe.call({
                        method: "frappe.client.set_value",
                        args: {
                            doctype: frm.doc.doctype,
                            name: frm.doc.name,
                            fieldname: changes
                        },
                        callback: function () {
                            frm.reload_doc(); // 🔁 Prevents dirty warning
                        }
                    });
                }
            } else {
                frm.fields_dict.payment_summary.$wrapper.empty();

                const reset_values = {
                    payment_summary_data: "",
                    total_amount: 0,
                    unbanked_amount: 0
                };

                const changes = {};
                for (let key in reset_values) {
                    if (frm.doc[key] !== reset_values[key]) {
                        changes[key] = reset_values[key];
                    }
                }

                if (Object.keys(changes).length > 0) {
                    await frappe.call({
                        method: "frappe.client.set_value",
                        args: {
                            doctype: frm.doc.doctype,
                            name: frm.doc.name,
                            fieldname: changes
                        },
                        callback: function () {
                            frm.reload_doc(); // 🔁 Prevents dirty warning
                        }
                    });
                }
            }
        }
    });
}

async function update_banked_and_unbanked(frm) {
    const r = await frappe.call({
        method: "posnext.posnext.doctype.chief_cashier_closing_entry.chief_cashier_closing_entry.get_banked_amount_for_entry",
        args: {
            chief_entry: frm.doc.name
        }
    });

    if (r.message) {
        const { banked_amount } = r.message;
        const total = frm.doc.total_amount || 0;
        const unbanked = total - banked_amount;

        const changes = {};
        if (frm.doc.banked_amount !== banked_amount) {
            changes.banked_amount = banked_amount;
        }
        if (frm.doc.unbanked_amount !== unbanked) {
            changes.unbanked_amount = unbanked;
        }

        if (Object.keys(changes).length > 0) {
            await frappe.call({
                method: "frappe.client.set_value",
                args: {
                    doctype: frm.doc.doctype,
                    name: frm.doc.name,
                    fieldname: changes
                },
                callback: function () {
                    frm.reload_doc(); // 🔁 Clean refresh
                }
            });
        }
    }
}
