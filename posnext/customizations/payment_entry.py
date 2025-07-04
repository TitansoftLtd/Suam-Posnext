import frappe
from frappe.model.document import Document

def update_banked_amount(doc, method):
    # Only handle Internal Transfer with link to Chief Cashier Closing Entry
    if doc.payment_type == "Internal Transfer" and doc.get("custom_cashier_pos_closing_entry"):
        chief_entry = doc.custom_cashier_pos_closing_entry

        if method == "on_submit":
            amount = doc.paid_amount or 0
        elif method == "on_cancel":
            amount = -(doc.paid_amount or 0)
        else:
            return

        # Update banked_amount field on Chief Cashier Closing Entry
        frappe.db.set_value(
            "Chief Cashier Closing Entry",
            chief_entry,
            "banked_amount",
            frappe.db.sql("""
                SELECT IFNULL(SUM(pe.paid_amount), 0)
                FROM `tabPayment Entry` pe
                WHERE pe.docstatus = 1
                AND pe.payment_type = 'Internal Transfer'
                AND pe.custom_cashier_pos_closing_entry = %s
            """, chief_entry)[0][0]
        )
