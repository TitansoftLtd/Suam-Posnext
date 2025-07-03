import frappe
from frappe import _ 
from frappe.utils.pdf import get_pdf
from frappe.www.printview import get_context 
import json
from frappe.utils import now
from frappe.utils.file_manager import save_file

def validate_item(doc, method):
    for x in doc.custom_items:
        x.parent_item_name = doc.item_name
        x.parent_item_description = doc.description
        x.parent_oem_part_number = doc.custom_oem_part_number


@frappe.whitelist()
def get_product_bundle_with_items(item_code):
    bundle = frappe.db.get_value("Product Bundle", {"new_item_code": item_code}, "name")

    if not bundle:
        return None  

    bundle_doc = frappe.get_doc("Product Bundle", bundle)

    bundle_items = []
    for item in bundle_doc.items:
        bundle_items.append({
            "item_code": item.item_code,
            "qty": item.qty,
            "uom": item.uom
        })

    return {
        "name": bundle_doc.name,
        "new_item_code": bundle_doc.new_item_code,
        "items": bundle_items
    }


@frappe.whitelist()
def print_barcodes(item_codes): 
    if isinstance(item_codes, str):
   
        item_codes = json.loads(item_codes)
      

    items_with_barcodes = [
        frappe.get_doc("Item", code)
        for code in item_codes
        if frappe.get_doc("Item", code).barcodes
    ]

    if not items_with_barcodes:
        frappe.throw(_("No items with barcodes found"))

    print_format = "Barcode Print"

    if len(items_with_barcodes) == 1:
        item_name = items_with_barcodes[0].name
        url = f"/printview?doctype=Item&name={item_name}&format={print_format}&no_letterhead=1"
        return {"url": url}

    html_content = ''.join(
        f'<div>{frappe.get_print("Item", item.name, print_format, doc=item)}</div>'
        for item in items_with_barcodes
    )

    pdf_data = get_pdf(html_content)

    file_name = f"Multiple_Barcodes_{now().replace(' ', '_').replace(':', '-')}.pdf"
    file_doc = save_file(
        fname=file_name,
        content=pdf_data,
        dt="Item",
        dn=items_with_barcodes[0].name,
        is_private=0
    )

    return {
        "url": file_doc.file_url,
        "message": _(f"Generated barcodes for {len(items_with_barcodes)} items."),
        "is_pdf": True
    }