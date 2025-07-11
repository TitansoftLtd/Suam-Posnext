import frappe
from erpnext.accounts.doctype.pos_invoice.pos_invoice import get_bin_qty,get_bundle_availability

@frappe.whitelist()
def get_stock_availability(item_code, warehouse):
	if not frappe.db.exists("Item", item_code):
		return 0, False

	is_stock_item = frappe.db.get_value("Item", item_code, "is_stock_item")
	if not is_stock_item:
		# Not a stock item
		if frappe.db.exists("Product Bundle", {"name": item_code, "disabled": 0}):
			return get_bundle_availability(item_code, warehouse), True
		return 0, False

	# Stock item case
	is_group = frappe.db.get_value("Warehouse", warehouse, "is_group")
	if is_group:
		lft, rgt = frappe.db.get_value("Warehouse", warehouse, ["lft", "rgt"])
		child_warehouses = frappe.db.get_all(
			"Warehouse",
			fields=["name"],
			filters={"lft": [">=", lft], "rgt": ["<=", rgt]},
			pluck="name"
		)
	else:
		child_warehouses = [warehouse]

	total_qty = 0
	for wh in child_warehouses:
		qty = get_bin_qty(item_code, wh)
		total_qty += qty or 0

	return total_qty, True