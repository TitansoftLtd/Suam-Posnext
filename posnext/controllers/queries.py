import frappe
from frappe.utils import nowdate, unique
from frappe.desk.reportview import get_filters_cond, get_match_cond

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def customer_query(doctype, txt, searchfield, start, page_len, filters, as_dict=False):
	doctype = "Customer"
	conditions = []
	cust_master_name = frappe.defaults.get_user_default("cust_master_name")

	fields = ["name"]
	if cust_master_name != "Customer Name":
		fields.append("customer_name")

	fields = get_fields(doctype, fields)
	searchfields = frappe.get_meta(doctype).get_search_fields()
	searchfields = " or ".join(field + " like %(txt)s" for field in searchfields)

	return frappe.db.sql(
		"""select {fields} from `tabCustomer`
		where docstatus < 2
			and ({scond}) and disabled=0
			{fcond} {mcond}
		order by
			(case when locate(%(_txt)s, name) > 0 then locate(%(_txt)s, name) else 99999 end),
			(case when locate(%(_txt)s, customer_name) > 0 then locate(%(_txt)s, customer_name) else 99999 end),
			idx desc,
			name, customer_name
		limit %(page_len)s offset %(start)s""".format(
			**{
				"fields": ", ".join(fields),
				"scond": searchfields,
				"mcond": get_match_cond(doctype),
				"fcond": get_filters_cond(doctype, filters, conditions).replace("%", "%%"),
			}
		),
		{"txt": "%%%s%%" % txt, "_txt": txt.replace("%", ""), "start": start, "page_len": page_len},
		as_dict=as_dict,
	)

def get_fields(doctype, fields=None):
	if fields is None:
		fields = []
	meta = frappe.get_meta(doctype)
	fields.extend(meta.get_search_fields())

	if meta.title_field and meta.title_field.strip() not in fields:
		fields.insert(1, meta.title_field.strip())

	return unique(fields)