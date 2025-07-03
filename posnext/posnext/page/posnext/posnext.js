// frappe.provide('posnext');
// (function() {
// 	console.log("HEREREssssssww")
//     var scriptPath = '/assets/posnext/js/pos_controller.js';
//     var scriptUrl = scriptPath + '?v=' + Date.now();
//
//     var script = document.createElement('script');
//     script.src = scriptUrl;
//
//     document.head.appendChild(script);
// })();'console.log("POSNEXT POINTSALE")
frappe.pages['posnext'].on_page_load = function(wrapper) {
	 let fullwidth = JSON.parse(localStorage.container_fullwidth || 'false');
	if(!fullwidth){
		localStorage.container_fullwidth = true;
		frappe.ui.toolbar.set_fullwidth_if_enabled();
	}
	frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Point of Sales'),
		single_column: true
	});

		window.wrapper = wrapper
		wrapper.pos = new posnext.PointOfSale.Controller(wrapper);
		window.cur_pos = wrapper.pos;
}
frappe.pages['posnext'].refresh = function(wrapper,onscan = "",value="") {
	// if (document.scannerDetectionData) {
		if(!onscan){
			window.onScan.detachFrom(document)
		}
		wrapper.pos.wrapper.html("");
		wrapper.pos.check_opening_entry(value);
	// }
};