frappe.ui.form.on('Sales Invoice', {
    company() {
		erpnext.accounts.dimensions.update_dimension(this.frm, this.frm.doctype);
		this.frm.set_value("set_warehouse", "");
		this.frm.set_value("taxes_and_charges", "");
	}
})