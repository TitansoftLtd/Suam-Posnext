import frappe

def update_banked_amount(doc, method):
    if doc.payment_type == "Internal Transfer" and doc.get("custom_cashier_pos_closing_entry"):
        chief_entry = doc.custom_cashier_pos_closing_entry

        # Get total paid amount from all submitted Payment Entries linked to this Chief Cashier Closing Entry
        banked_amount = frappe.db.sql("""
            SELECT IFNULL(SUM(pe.paid_amount), 0)
            FROM `tabPayment Entry` pe
            WHERE pe.docstatus = 1
              AND pe.payment_type = 'Internal Transfer'
              AND pe.custom_cashier_pos_closing_entry = %s
        """, (chief_entry,))[0][0]

        # Fetch total amount from the Chief Cashier Closing Entry
        total_amount = frappe.db.get_value("Chief Cashier Closing Entry", chief_entry, "total_amount") or 0

        # Calculate unbanked amount
        unbanked_amount = total_amount - banked_amount

        # Update the Chief Cashier Closing Entry fields
        frappe.db.set_value("Chief Cashier Closing Entry", chief_entry, {
            "banked_amount": banked_amount,
            "unbanked_amount": unbanked_amount
        })

        # Optionally log for debugging
        frappe.logger("payment_entry").info(f"Updated Chief Cashier Closing Entry: {chief_entry} | Banked: {banked_amount} | Unbanked: {unbanked_amount}")