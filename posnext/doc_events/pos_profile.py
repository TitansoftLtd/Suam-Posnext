import frappe


def validate_pf(doc,method):
    if not doc.custom_edit_rate_and_uom:
        doc.custom_use_discount_percentage = 0
        doc.custom_use_discount_amount = 0


@frappe.whitelist()
def get_pos_profile_branch(pos_profile_name):
    if not pos_profile_name:
        frappe.throw("POS Profile name is required.")

    branch = frappe.db.get_value("POS Profile", pos_profile_name, "branch")
    return {"branch": branch}
