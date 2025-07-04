import frappe
from frappe.model.document import Document

def update_banked_amount(doc, method):
    # Only handle Internal Transfer with a link to Chief Cashier Closing Entry
    if doc.payment_type == "Internal Transfer" and doc.get("custom_cashier_pos_closing_entry"):
        chief_entry = doc.custom_cashier_pos_closing_entry

        # Recalculate total banked amount from all submitted payment entries linked to this chief entry
        banked_amount = frappe.db.sql("""
            SELECT IFNULL(SUM(pe.paid_amount), 0)
            FROM `tabPayment Entry` pe
            WHERE pe.docstatus = 1
              AND pe.payment_type = 'Internal Transfer'
              AND pe.custom_cashier_pos_closing_entry = %s
        """, chief_entry)[0][0]

        # Get total_amount from the Chief Cashier Closing Entry
        total_amount = frappe.db.get_value("Chief Cashier Closing Entry", chief_entry, "total_amount") or 0

        # Calculate unbanked_amount
        unbanked_amount = total_amount - banked_amount

        # Update both fields
        frappe.db.set_value("Chief Cashier Closing Entry", chief_entry, {
            "banked_amount": banked_amount,
            "unbanked_amount": unbanked_amount
        })

        # (Optional) Add a comment to the Chief Cashier Closing Entry for audit trail
        frappe.db.commit()
        frappe.get_doc("Chief Cashier Closing Entry", chief_entry).add_comment(
            "Info",
            f"Banked amount updated to {frappe.utils.fmt_money(banked_amount)}. Unbanked amount is now {frappe.utils.fmt_money(unbanked_amount)}."
        )