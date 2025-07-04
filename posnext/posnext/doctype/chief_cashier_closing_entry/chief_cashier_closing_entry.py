from frappe.model.document import Document
import frappe
from frappe.utils import getdate
from collections import defaultdict

class ChiefCashierClosingEntry(Document):
    def on_submit(self):
        # Mark POS Closing Entries as closed on submit
        for row in self.closed_pos_closing_entries:
            frappe.db.set_value("POS Closing Entry", row.pce_id, "custom_closed", 1)
    def on_cancel(self):
        # Mark POS Closing Entries as closed on cancel
        for row in self.closed_pos_closing_entries:
            frappe.db.set_value("POS Closing Entry", row.pce_id, "custom_closed", 0)

@frappe.whitelist()
def get_open_pos_closings(posting_date):
    posting_date = getdate(posting_date)

    return frappe.get_all(
        "POS Closing Entry",
        filters={
            "docstatus": 1,
            "posting_date": posting_date,
            "custom_closed": 0
        },
        fields=["name"]
    )

@frappe.whitelist()
def get_payment_summary(posting_date):
    posting_date = getdate(posting_date)

    # Fetch submitted POS Closing Entries
    entries = frappe.get_all(
        "POS Closing Entry",
        filters={
            "docstatus": 1,
            "posting_date": posting_date
        },
        fields=["name", "user"]
    )

    summary = defaultdict(lambda: defaultdict(float))

    for entry in entries:
        payments = frappe.get_all(
            "POS Closing Payment Entry",
            filters={"parent": entry.name},
            fields=["mode_of_payment", "closing_amount"]
        )

        for p in payments:
            summary[entry["user"]][p["mode_of_payment"]] += float(p["closing_amount"])

    return summary