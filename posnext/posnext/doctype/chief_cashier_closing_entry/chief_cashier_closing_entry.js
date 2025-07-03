frappe.ui.form.on('Chief Cashier Closing Entry', {
    refresh: function(frm) {
        // ✅ Re-render HTML from saved hidden field
        if (frm.doc.payment_summary_data && frm.fields_dict.payment_summary) {
            frm.fields_dict.payment_summary.$wrapper.html(frm.doc.payment_summary_data);
        }

        // Show this button only when doc is in Draft
        if (frm.doc.docstatus === 0) {
            frm.add_custom_button('Get Closing Entry', function () {
                if (!frm.doc.posting_date) {
                    frappe.msgprint("Please select a Posting Date first.");
                    return;
                }

                frm.set_value("posting_time", frappe.datetime.now_time());

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

                            // ✅ Save HTML to hidden field
                            frm.set_value("payment_summary_data", html);

                            // ✅ Display in HTML field
                            frm.fields_dict.payment_summary.$wrapper.html(html);

                            frm.save();
                        } else {
                            frappe.msgprint("No closing entries found for that date.");
                        }
                    },
                    error: function(err) {
                        console.error("Frappe Call Error:", err);
                        frappe.msgprint("An error occurred while fetching data. Please check console for details.");
                    }
                });
            });
        }

        // Show this button only when doc is Submitted
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button('Create Payment Transfer', function () {
                frappe.new_doc('Payment Entry', {
                    payment_type: 'Internal Transfer',
                    posting_date: frm.doc.posting_date
                });
            });
        }
    }
});
