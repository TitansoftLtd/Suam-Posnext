frappe.ui.form.on('Chief Cashier Closing Entry', {
    refresh: function(frm) {
        frm.add_custom_button('Get Closing Entry', function () {
            if (!frm.doc.posting_date) {
                frappe.msgprint("Please select a Posting Date first.");
                return;
            }

            frappe.call({
                method: "posnext.posnext.doctype.chief_cashier_closing_entry.chief_cashier_closing_entry.get_payment_summary",
                args: {
                    posting_date: frm.doc.posting_date
                },
                callback: function(r) {
                    if (r.message) {
                        console.log("Summary received from server:", r.message); // ADD THIS LINE FOR DEBUGGING
                        const summary = r.message;
                        let html = `<table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Cashier</th>
                                    <th>Mode of Payment</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>`;

                        for (let user in summary) {
                            for (let mop in summary[user]) {
                                html += `<tr>
                                    <td>${user}</td>
                                    <td>${mop}</td>
                                    <td style="text-align: right;">${format_currency(summary[user][mop])}</td>
                                </tr>`;
                            }
                        }

                        html += `</tbody></table>`;

                        frm.set_value("payment_summary", html);
                        frm.refresh_field("payment_summary");
                    } else {
                        frappe.msgprint("No closing entries found for that date.");
                    }
                },
                error: function(err) { // Add error callback for network/server errors
                    console.error("Frappe Call Error:", err);
                    frappe.msgprint("An error occurred while fetching data. Please check console for details.");
                }
            });
        });
    }
});