from frappe.model.document import Document
import frappe
from frappe.utils import getdate
from collections import defaultdict

class ChiefCashierClosingEntry(Document):
    pass

@frappe.whitelist()
def get_payment_summary(posting_date):
    posting_date = getdate(posting_date)

    # 1. Fetch submitted POS Closing Entries for the given date
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
        # 2. For each POS Closing Entry, fetch its child payments from 'POS Closing Entry Payment'
        #    using the parent's 'name' as the filter for the 'parent' field in the child table.
        payments = frappe.get_all(
            "POS Closing Payment Entry",
            filters={"parent": entry.name},
            fields=["mode_of_payment", "closing_amount"]
        )

        # 3. Aggregate the amounts by user and mode of payment
        for p in payments:
            # Ensure closing_amount is treated as a float, defaulting to 0 if None or empty
            summary[entry["user"]][p["mode_of_payment"]] += float(p["closing_amount"])

    # 4. Return the aggregated summary
    return summary