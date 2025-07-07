frappe.ui.form.on('Dispatch QMS', {
    refresh: function(frm) {
        frm.disable_save();
        // Get the wrapper element for your custom HTML field
        const root_element = frm.fields_dict.dispatch_status_container && frm.fields_dict.dispatch_status_container.wrapper;

        if (!root_element) {
            console.warn("Could not find the root element for dispatch blocks. Ensure a custom HTML field 'dispatch_status_container' exists.");
            return;
        }

        // Initialize the blocks if they are not already rendered by the HTML field options
        let processingBlock = root_element.querySelector('.processing-block');
        let readyBlock = root_element.querySelector('.ready-block');

        if (!processingBlock) {
            processingBlock = document.createElement('div');
            processingBlock.className = 'processing-block card card-body';
            root_element.querySelector('.dispatch-blocks-wrapper').appendChild(document.createElement('h3')).textContent = 'Processing Dispatches';
            root_element.querySelector('.dispatch-blocks-wrapper').appendChild(processingBlock);
        }
        if (!readyBlock) {
            readyBlock = document.createElement('div');
            readyBlock.className = 'ready-block card card-body';
            root_element.querySelector('.dispatch-blocks-wrapper').appendChild(document.createElement('h3')).textContent = 'Ready To Collect Dispatches';
            root_element.querySelector('.dispatch-blocks-wrapper').appendChild(readyBlock);
        }

        function refreshDispatchBlocks() {
            const currentUser = frappe.session.user;

            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Suam Settings",
                    name: "Suam Settings"
                },
                callback: function(settingsRes) {
                    if (!settingsRes.message) {
                        console.error("Suam Settings not found.");
                        processingBlock.innerHTML = "<p>Error: Suam Settings not configured.</p>";
                        readyBlock.innerHTML = "<p>Error: Suam Settings not configured.</p>";
                        return;
                    }

                    const settings = settingsRes.message;
                    const allowedWarehouses = (settings.allowed_qms_users || [])
                        .filter(row => row.user_id === currentUser)
                        .map(row => row.warehouse);

                    if (allowedWarehouses.length === 0) {
                        processingBlock.innerHTML = "<p>No processing dispatches available for your warehouses.</p>";
                        readyBlock.innerHTML = "<p>No ready dispatches available for your warehouses.</p>";
                        return;
                    }

                    frappe.call({
                        method: 'frappe.client.get_list',
                        args: {
                            doctype: 'Dispatch',
                            fields: ['name', 'sales_invoice', 'workflow_state'],
                            filters: {
                                is_return: 0,
                                warehouse: ['in', allowedWarehouses],
                                workflow_state: ['in', ['Processing', 'Ready To Collect']]
                            },
                            order_by: 'name asc',
                            limit_page_length: 100
                        },
                        callback: async function(res) {
                            const dispatches = res.message || [];

                            const enrichedDispatches = await Promise.all(dispatches.map(async dispatch => {
                                const full = await frappe.call({
                                    method: 'frappe.client.get',
                                    args: {
                                        doctype: 'Dispatch',
                                        name: dispatch.name
                                    }
                                });
                                const items = full.message.items || [];
                                const total_qty = items.reduce((sum, item) => sum + (item.qty || 0), 0);

                                // Calculate unique item count
                                const unique_items = new Set(items.map(item => item.item_code));
                                const item_count = unique_items.size;

                                return {
                                    ...dispatch,
                                    total_qty,
                                    item_count
                                };
                            }));

                            const processingDispatches = enrichedDispatches.filter(d => d.workflow_state === 'Processing');
                            const readyDispatches = enrichedDispatches.filter(d => d.workflow_state === 'Ready To Collect');

                            const processingHTML = generateDispatchTable(processingDispatches, '#e2631b');
                            const readyHTML = generateDispatchTable(readyDispatches, 'green');

                            processingBlock.innerHTML = processingHTML;
                            readyBlock.innerHTML = readyHTML;
                        }
                    });
                }
            });
        }

        function generateDispatchTable(dispatches, color) {
            if (dispatches.length === 0) {
                return "<p>No dispatches found.</p>";
            }

            let html = `
                <table class="table table-bordered table-hover table-striped">
                    <thead>
                        <tr>
                            <th>Invoice No.</th>
                            <th>No. of Items</th>
                            <th>Quantities</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            dispatches.forEach(dispatch => {
                let status_html = `<span class="badge" style="background-color: ${color};">${dispatch.workflow_state}</span>`;
                html += `
                    <tr>
                        <td><a href="/app/sales-invoice/${dispatch.sales_invoice}" target="_blank">${dispatch.sales_invoice}</a></td>
                        <td>${dispatch.item_count}</td>
                        <td>${dispatch.total_qty}</td>
                        <td>${status_html}</td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            return html;
        }

        // Initial load
        refreshDispatchBlocks();

        // Clear any existing interval to prevent duplicates on refresh
        if (frm.__dispatch_refresh_interval) {
            clearInterval(frm.__dispatch_refresh_interval);
        }

        // Auto-refresh every 1 second (optional: adjust if needed)
        frm.__dispatch_refresh_interval = setInterval(refreshDispatchBlocks, 1000);
    },

    // Clear the interval when the form is unloaded (e.g., closing the form)
    on_close: function(frm) {
        if (frm.__dispatch_refresh_interval) {
            clearInterval(frm.__dispatch_refresh_interval);
            frm.__dispatch_refresh_interval = null;
            console.log("Dispatch refresh interval cleared.");
        }
    },
});