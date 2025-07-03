import frappe


def validate_si(doc,method):
    if doc.pos_profile:
        show_branch =  frappe.db.get_value("POS Profile",doc.pos_profile,'show_branch')
        if 'branch' not in doc.__dict__ and show_branch==1:
            frappe.throw("Create Branch Accounting Dimensions.")
    if doc.is_return and doc.is_pos:
        doc.update_outstanding_for_self = 0
        if doc.payments:
            doc.payments[0].amount = doc.rounded_total or doc.grand_total
        else:
            mop = frappe.db.get_all("POS Payment Method", {"default": True, "allow_in_returns": True, "parent": doc.pos_profile}, "mode_of_payment")
            if mop:
                doc.append("payments", {
                    "mode_of_payment": mop[0].mode_of_payment,
                    "amount": doc.rounded_total or doc.grand_total
                })
def create_delivery_note(doc, method):
    if doc.update_stock:
        return

    if doc.is_return != 1:
        delivery_note = frappe.new_doc("Delivery Note")
        delivery_note.customer = doc.customer
        delivery_note.posting_date = doc.posting_date
        delivery_note.posting_time = doc.posting_time
        delivery_note.taxes_and_charges = doc.taxes_and_charges
        delivery_note.company = doc.company

        all_items_sufficient = True

        for item in doc.items:
            available_qty = frappe.db.get_value(
                "Bin", {"item_code": item.item_code, "warehouse": item.warehouse}, "actual_qty"
            ) or 0

            delivery_note.append("items", {
                "item_code": item.item_code,
                "uom": item.uom,
                "qty": item.qty,
                "rate": item.rate,
                "warehouse": item.warehouse,
                "against_sales_invoice": item.parent,
                "si_detail": item.name,
                "cost_center": item.cost_center
            })

            if item.qty > available_qty:
                all_items_sufficient = False

        for tax in doc.taxes:
            delivery_note.append("taxes", {
                "charge_type": tax.charge_type,
                "account_head": tax.account_head,
                "description": tax.description,
                "rate": tax.rate,
                "tax_amount": tax.tax_amount,
                "total": tax.total,
                "cost_center": tax.cost_center
            })

        for sp in doc.sales_team:
            delivery_note.append("sales_team", {
                "sales_person": sp.sales_person,
                "allocated_percentage": sp.allocated_percentage
            })

        delivery_note.save()

        if all_items_sufficient:
            delivery_note.submit()
            frappe.msgprint(f"Delivery Note {delivery_note.name} submitted as sufficient stock is available.")
        else:
            frappe.msgprint(f"Delivery Note {delivery_note.name} saved as draft due to insufficient stock.")
