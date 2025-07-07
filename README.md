# POSNext Documentation

## 🚀 Update Note

We have introduced an upgraded branch (**Version 15**) for POSNext, fully compatible with **ERPNext Version 14 and Version 15**. In this update, the POS Invoice step has been streamlined, and invoices are now created directly within the **Sales Invoice** module, enhancing efficiency and simplifying the workflow.

---

## 📖 Introduction

POSNext is an **open-source Point of Sale (POS) system** designed specifically for ERPNext. It is a fork of the default ERPNext POS, enriched with additional features inspired by **POSAwesome** and further innovations to meet the demands of modern retail and business environments. POSNext serves as a **flexible, customizable alternative** to POSAwesome, offering users improved adaptability and enhanced functionalities.

---

## 🏁 Getting Started

POSNext is integrated with ERPNext’s default POS module. To begin using POSNext, ensure you have an **active installation of ERPNext**.

### 📌 Prerequisites
- A running instance of **ERPNext Version 15 or 14**

---

## 🔧 Setting Up POSNext

### ⚙️ Configuration

1. **Access POS Profile Settings**: Navigate to the POS Profile settings within ERPNext.
2. **Configure Basic Settings**: Set up essential configurations such as currency, default warehouse, and user-specific settings.
3. **Assign User Roles and Permissions**: Define user roles and permissions tailored to POS operations, ensuring access control and security.

### ✅ Features & Enhancements

#### 🔄 Full Compatibility with ERPNext POS Features
- POSNext retains all **core ERPNext POS** functionalities, ensuring seamless integration with existing ERPNext features.

#### 🔐 Profile Lock in POS Settings
- **Make POS settings read-only** to prevent unauthorized changes and maintain configuration integrity.

#### 📋 Show Order List Button
- Adds an **"Order List"** button in POS, allowing users to conveniently view all past orders.

#### 🛒 Show Held Button
- Enables users to **place orders on hold** and complete them later.

#### 📱 Mobile Number-Based Customer Identification
- **Locks the customer field** and uses mobile numbers for customer identification, ensuring accuracy.

#### 🏁 Show Checkout Button
- Adds a **"Checkout"** button for easy finalization of transactions.

#### 🔳 Show Only List View
- Limits the POS interface to **List View**, displaying item details in a structured list format.

#### 🃏 Show Only Card View
- Configures POS to display items exclusively in **Card View**, enhancing item selection with a visual card layout.

#### 📝 Show Open Form View
- Adds an **optional detailed form view** within the POS menu for expanded transaction details.

#### 🔍 Show Toggle for Recent Orders
- Enables a **toggle switch** in POS for viewing recent transactions.

#### 📂 Save as Draft Option
- Allows users to **save orders as drafts** for later review or editing.

#### ❌ Close POS Option
- Adds a **POS Close** option for session management and security.

#### 🎛️ Default View Setting (Card/List)
- Allows users to **choose a default layout** between Card View and List View.

#### ➕ Allow Adding New Items on Separate Lines
- Enables users to **add new items on individual lines**, improving item organization.

#### 📅 Display Posting Date
- Shows the **transaction posting date** in POS for enhanced record-keeping.

#### 🔢 Show OEM Part Number
- Displays the **OEM part number** of items in POS for quick identification.

#### 📍 Show Logical Rack Location
- Displays the **logical rack location** of items in POS, assisting in efficient inventory management.

#### 💰 Edit Rate and UOM (Unit of Measure)
- **Modify item rates and UOMs** directly in POS for pricing flexibility.

#### 💳 Enable Credit Sales
- Supports **credit sales**, allowing customers to purchase on credit terms.

#### 🗒️ Add Additional Notes
- Provides an option to **add comments or instructions** to transactions.

#### 🏦 Include and Exclude Tax Options
- Allows users to **include or exclude tax** from transactions.

#### 🔄 Display Alternative Items for POS Search
- Shows **alternative items** during searches, useful for substitutions.

#### 📲 Configure Mobile Number Length
- Sets **mobile number validation** based on country requirements.

#### 🟢 Send Invoice via WhatsApp
- Enables **sending invoices directly to customers** via WhatsApp.

#### ⚙️ Customizable POS Profile
- Allows **tailored profile adjustments** to support **multi-currency transactions** and other business needs.

#### 💵 Credit Sale
- Enables **credit sales tracking** for customers making purchases on credit.

#### 📊 Incoming Rate
- Tracks the **cost at which items are received** or procured.

---

## ☁️ Deployment

### 🔧 Self-Hosting
To set up POSNext on your own server:

bench get-app branch version-15 https://github.com/TitansoftLtd/Suam-Posnext.git

bench setup requirements

bench build --app posnext

bench restart

bench --site [your.site.name] install-app posnext

bench --site [your.site.name] migrate


## 📜 License
POSNext is released under the [MIT License](https://github.com/posnext/app/blob/develop/LICENSE).


