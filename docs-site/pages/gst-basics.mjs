// A plain-language GST guide for first-time business owners. Tax guidance:
// every number here was checked against an official source (linked under
// each section) on the date in CHECKED. Re-check them all when you change it.
const ui = (s) => `<span class="ui">${s}</span>`;
const src = (...links) => `<p class="sources"><b>Official sources:</b> ${links.join(' · ')}</p>`;
const a = (href, text) => `<a href="${href}" rel="noopener">${text}</a>`;

const CHECKED = '29 October 2026';
const CBIC = 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst';
const PORTAL = a('https://www.gst.gov.in/', 'GST portal (gst.gov.in)');

export default [
// =============================================================================
{
  slug: 'gst-basics',
  title: 'GST basics for new business owners',
  nav: 'GST basics',
  lead: 'GST in plain words for a first-time shop owner, freelancer or small manufacturer: whether you need to register, which rate to charge, how to find your HSN or SAC code, which bill to give, returns and due dates, exports and LUT, and a checklist for your first week.',
  body: `
<div class="note warn"><strong>Last checked: ${CHECKED}</strong>
<p>Rules change. Check the ${PORTAL} or ask a tax adviser (a CA or GST practitioner) before acting on anything here. This page explains the basics; it is not legal advice. Every section lists the official pages it is based on.</p></div>

<section id="what-is-gst">
<h2>What GST is</h2>
<p>GST (Goods and Services Tax) is a tax on selling goods and services in India. Your customer pays it to you on top of your price. You pay it to the government. Before you pay, you take off the GST you yourself paid on things you bought for the business. That is called <a href="#itc">input tax credit</a>.</p>
<p>Who gets the tax depends on where your customer is:</p>
<ul>
  <li><strong>Customer in your own state</strong>: the tax is split in two equal halves, <b>CGST</b> (for the Centre) and <b>SGST</b> (for your state).</li>
  <li><strong>Customer in another state</strong>: the whole tax is <b>IGST</b> (Integrated GST).</li>
  <li>In Union Territories without their own legislature, such as Chandigarh or Ladakh, <b>UTGST</b> takes the place of SGST.</li>
</ul>
<p><strong>Example.</strong> Your shop is in Punjab. You sell goods worth ₹10,000 that carry 18% GST.</p>
<div class="table-wrap"><table>
  <tr><th>Customer is in</th><th>Tax on the bill</th><th>Customer pays</th></tr>
  <tr><td>Punjab (same state)</td><td>CGST 9% = ₹900, SGST 9% = ₹900</td><td>₹11,800</td></tr>
  <tr><td>Haryana (another state)</td><td>IGST 18% = ₹1,800</td><td>₹11,800</td></tr>
</table></div>
<p>The customer pays the same either way. Only the name of the tax changes. The app picks the right one by itself from your state and the place of supply: see <a href="invoices.html#gst">How GST is worked out</a>.</p>
${src(a('https://tutorial.gst.gov.in/downloads/news/welcome_kit_for_new_taxpyers.pdf', 'GSTN Welcome Kit for New Businesses'))}
</section>

<section id="registration">
<h2>Do I need GST registration?</h2>
<p>It depends on your <b>aggregate turnover</b>: the total of all your sales in a financial year (April to March), across India, on your PAN. It counts taxable sales, exempt sales, exports and sales to other states. It does not count the GST itself.</p>
<p>You must register once that total crosses the limit in this table:</p>
<div class="table-wrap"><table>
  <tr><th>What you sell</th><th>Limit in most states</th><th>Where the limit is lower</th></tr>
  <tr><td>Goods only</td><td>₹40 lakh</td><td>₹20 lakh in Arunachal Pradesh, Meghalaya, Puducherry, Sikkim, Telangana and Uttarakhand. ₹10 lakh in Manipur, Mizoram, Nagaland and Tripura.</td></tr>
  <tr><td>Services, or goods and services together</td><td>₹20 lakh</td><td>₹10 lakh in Manipur, Mizoram, Nagaland and Tripura.</td></tr>
</table></div>
<p>The ₹40 lakh limit is not for everyone who sells goods. It does not apply if you sell ice cream, pan masala, tobacco products or a few other notified goods; you then use the ₹20 lakh limit (₹10 lakh in the four states above).</p>
<ul>
  <li><strong>Example 1.</strong> A kirana shop in Gujarat sells only goods, ₹35 lakh a year, all inside Gujarat. It does not have to register.</li>
  <li><strong>Example 2.</strong> A freelance designer in Delhi bills ₹22 lakh a year. That is a service above ₹20 lakh, so they must register.</li>
</ul>
<p>Apply within 30 days of the day you cross the limit. Below the limit you <em>may not</em> charge GST: only a registered business can put GST on a bill.</p>
${src(a(`${CBIC}/acts/2017_CGST_act/active/chapter6/section22_v1.00.html`, 'CGST Act section 22'), a('https://gstcouncil.gov.in/sites/default/files/2024-05/notfctn-10-central-tax-english-2019.pdf', 'Notification 10/2019-Central Tax (₹40 lakh for goods)'), a('https://gstcouncil.gov.in/sites/default/files/e-version-gst-flyers/composition-levy-scheme.pdf', 'CBIC flyer: how aggregate turnover is counted'))}
</section>

<section id="registration-compulsory">
<h3>When you must register whatever your turnover</h3>
<p>Some businesses must register from the first rupee:</p>
<ul>
  <li><strong>You sell goods to a buyer in another state.</strong> Service providers are let off: inter-state services alone do not force you to register while you are under the ₹20 lakh limit.</li>
  <li><strong>You sell through an online marketplace</strong> that collects TCS (tax collected at source) from your payouts. One relief: since 1 October 2023, a small seller of <em>goods</em> who stays under the turnover limit, sells only inside one state and has no inter-state sales can sell through such a marketplace without GST registration, using an enrolment number from the GST portal.</li>
  <li><strong>You have to pay tax under reverse charge</strong> on something you buy (see <a href="#glossary">RCM</a>).</li>
  <li><strong>You are a casual taxable person</strong>: you sell for a short time in a state where you have no fixed place of business, for example at an exhibition or a fair.</li>
  <li><strong>You sell on behalf of someone else</strong>, as their agent.</li>
</ul>
${src(a(`${CBIC}/acts/2017_CGST_act/active/chapter6/section24_v1.00.html`, 'CGST Act section 24'), a('https://gstcouncil.gov.in/cgst-tax-notification', 'CGST notifications: 34/2023 (marketplace sellers of goods)'), a('https://taxinformation.cbic.gov.in/', 'Notification 10/2017-Integrated Tax (inter-state services), on the CBIC Tax Information portal'))}
</section>

<section id="voluntary-registration">
<h3>Registering before you have to</h3>
<p>You can register even below the limit. It is worth it when:</p>
<ul>
  <li>most of your customers are GST-registered businesses. They can claim back the GST on your bill, so they often prefer a registered supplier;</li>
  <li>you want to claim back the GST you pay on stock, machines or services;</li>
  <li>you want to sell goods to other states, or on online marketplaces.</li>
</ul>
<p>The cost: once registered, you must charge GST on taxable sales (your price to consumers goes up) and file returns on time every month or quarter, even when you sold nothing.</p>
</section>

<section id="how-to-register">
<h3>How to register, step by step</h3>
<p>Registration is free and done online on the GST portal. Keep these ready first:</p>
<div class="table-wrap"><table>
  <tr><th>Document</th><th>Notes</th></tr>
  <tr><td>PAN</td><td>Of the business. For a proprietor, your own PAN.</td></tr>
  <tr><td>Aadhaar</td><td>Of the owner or partners and the authorised signatory, with the mobile number linked, for OTP checks.</td></tr>
  <tr><td>Photographs</td><td>Of each owner, partner and the authorised signatory. JPG, up to 100 KB.</td></tr>
  <tr><td>Proof of business address</td><td>Property tax receipt, municipal khata copy or electricity bill. If rented: the rent or lease agreement. If someone lets you use their place free: a consent letter from them, with their proof.</td></tr>
  <tr><td>Proof of the business's constitution</td><td>Partnership deed, certificate of incorporation or registration certificate. Not needed for a sole proprietor.</td></tr>
  <tr><td>Proof of the authorised signatory</td><td>A letter of authorisation or board resolution, when the signatory is not the owner.</td></tr>
  <tr><td>Bank account details</td><td>Added after you get your GSTIN (step 7).</td></tr>
</table></div>
<ol class="steps">
  <li><strong>Part A: get a TRN</strong>On gst.gov.in, go to ${ui('Services')} › ${ui('Registration')} › ${ui('New Registration')}. Choose <b>Taxpayer</b>, your state and district, and enter the legal name exactly as on the PAN, the PAN, your mobile number and email. Enter the two OTPs. You get a <b>TRN</b> (Temporary Reference Number).</li>
  <li><strong>Part B: fill in the form</strong>Log in again with the TRN, within 15 days or the draft is deleted. Fill in each tab: business details (this is where you can choose the <a href="#composition">composition scheme</a>), owners or partners, authorised signatory, principal place of business, the goods and services you deal in (up to five HSN and five SAC codes: see <a href="#hsn-sac">HSN and SAC</a>), and state-specific details.</li>
  <li><strong>Submit</strong>Sign with EVC (an OTP) or a digital signature (DSC). A DSC is compulsory for companies and LLPs.</li>
  <li><strong>Aadhaar check</strong>A link comes by SMS and email to each person to be verified. Some applicants are instead asked to book a slot at a GST Suvidha Kendra for a photo, fingerprints and a document check. Once that is done you get an <b>ARN</b> (Application Reference Number).</li>
  <li><strong>Track it</strong>${ui('Services')} › ${ui('Registration')} › ${ui('Track Application Status')}. If the officer asks a question, answer it on the portal by the date given.</li>
  <li><strong>Download the certificate</strong>Once approved, you get your 15-character <b>GSTIN</b>. Download the certificate (form REG-06) from ${ui('Services')} › ${ui('User Services')} › ${ui('View/ Download Certificate')}, print the first page, and display it at your shop or office.</li>
  <li><strong>Add your bank account</strong>${ui('Services')} › ${ui('Registration')} › <b>Amendment of Registration Non-Core Fields</b>. Do it within 30 days of getting your GSTIN, or before your first GSTR-1, whichever comes first; the portal will not take a GSTR-1 without it.</li>
</ol>
<div class="note tip"><strong>The quicker route for small businesses</strong>
<p>Since 1 November 2025, if the GST on your sales to <em>registered</em> businesses will be no more than ₹2.5 lakh a month, you can tick <b>Option for registration under Rule 14A</b> in the form. After Aadhaar authentication, registration is granted online within three working days of the ARN.</p></div>
${src(a('https://tutorial.gst.gov.in/userguide/registration/Apply_for_Registration_Normal_Taxpayer.htm', 'GST portal user manual: new registration'), a('https://tutorial.gst.gov.in/cbt/registration/gstregistration/course/story_content/external_files/GST_Registration_Document_Checklist.pdf', 'GSTN document checklist'), a('https://www.gstcouncil.gov.in/sites/default/files/2025-12/newsletter_november_2025.pdf', 'GST Council newsletter, November 2025 (Rule 14A and bank account advisories)'), a('https://tutorial.gst.gov.in/downloads/news/welcome_kit_for_new_taxpyers.pdf', 'GSTN Welcome Kit'))}
</section>

<section id="composition">
<h2>Regular scheme or composition scheme?</h2>
<p>Once registered you are in the <b>regular</b> scheme unless you choose <b>composition</b>. Composition is a simpler scheme for small local businesses: you pay a small flat percentage of your sales, out of your own pocket, and file fewer returns.</p>
<div class="table-wrap"><table>
  <tr><th></th><th>Regular</th><th>Composition</th></tr>
  <tr><td>Who can choose it</td><td>Anyone registered</td><td>Turnover last year up to ₹1.5 crore (₹75 lakh in Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura and Uttarakhand). For service providers: up to ₹50 lakh.</td></tr>
  <tr><td>Tax you pay</td><td>The GST rate of each item, charged to your customer</td><td>A flat share of your turnover: 1% for manufacturers and traders, 5% for restaurants, 6% for service providers</td></tr>
  <tr><td>Can you charge GST to customers?</td><td>Yes, on a tax invoice</td><td>No. You give a <b>bill of supply</b> headed "Composition taxable person, not eligible to collect tax on supplies"</td></tr>
  <tr><td>Input tax credit on purchases</td><td>Yes</td><td>No</td></tr>
  <tr><td>Selling to other states</td><td>Yes</td><td>No</td></tr>
  <tr><td>Selling on online marketplaces</td><td>Yes</td><td>Goods only, within your own state. No services.</td></tr>
  <tr><td>Returns</td><td>GSTR-1 and GSTR-3B, monthly or quarterly</td><td>CMP-08 every quarter and GSTR-4 once a year (see <a href="#returns">due dates</a>)</td></tr>
</table></div>
<p>You also have to write <b>Composition Taxable Person</b> on the signboard at your shop. You cannot use composition if you sell to other states, make ice cream, pan masala, tobacco products or a few other notified goods, or sell goods that are outside GST (such as petrol or liquor).</p>
<p><strong>Example.</strong> A sweet shop in Indore sells ₹30 lakh a year, all to walk-in customers. Under composition it pays 1% of its sales, ₹30,000 for the year, in four quarterly payments, and charges no GST on its bills. It cannot claim back the GST on its own purchases.</p>
<h3>Which one should I choose?</h3>
<ul>
  <li><strong>Composition suits</strong> a local shop, dhaba or small manufacturer selling mostly to consumers in its own state, with few purchases on which it pays GST.</li>
  <li><strong>Regular suits</strong> you if your buyers are GST-registered businesses (they want to claim the GST back, and cannot from a composition bill), if you sell to other states or abroad, or if you pay a lot of GST on purchases and want it back.</li>
</ul>
<p><strong>How to opt in:</strong> while registering (Part B, Business Details), or later with form <b>CMP-02</b> (${ui('Services')} › ${ui('Registration')} › <b>Application to Opt for Composition Levy</b>) before the financial year starts. To leave, file <b>CMP-04</b>. In the app, use the <a href="invoices.html#invoice-types">Composition (Bill of Supply)</a> document type; it prints the declaration for you.</p>
${src(a('https://gstcouncil.gov.in/sites/default/files/e-version-gst-flyers/composition-levy-scheme.pdf', 'CBIC flyer: Composition Levy Scheme'), a('https://www.gstcouncil.gov.in/sites/default/files/2024-05/notfctn-14-central-tax-english-2019.pdf', 'Notification 14/2019-Central Tax (₹1.5 crore / ₹75 lakh)'), a('https://tutorial.gst.gov.in/userguide/registration/Opt_for_Composition_Scheme.htm', 'GST portal FAQ: opting for composition'), a('https://gstcouncil.gov.in/cgst-tax-notification', 'Notification 36/2023-Central Tax (marketplace sales)'))}
</section>

<section id="which-rate">
<h2>What GST rate do I charge?</h2>
<p>The rate depends on <em>what</em> you sell, not on who you are or how big you are. Every product and service has a code (<a href="#hsn-sac">HSN or SAC</a>), and the government sets the rate for each code. You do not choose it.</p>
<p>From <strong>22 September 2025</strong> the rates were simplified ("GST 2.0"). The main rates are now <b>5%</b>, <b>18%</b> and <b>40%</b>. The old 12% and 28% slabs were removed for almost everything. From <strong>1 February 2026</strong>, pan masala, cigarettes and other tobacco products also moved to 40% (biris to 18%) and the old compensation cess on them ended.</p>
<div class="table-wrap"><table>
  <tr><th>Rate</th><th>Used for</th><th>Examples</th></tr>
  <tr><td>Nil (0%)</td><td>Basic necessities</td><td>Fresh fruit and vegetables, fresh milk, UHT milk, pre-packed paneer, roti, chapati and paratha, exercise books, pencils, erasers, sharpeners, maps, many life-saving medicines, individual life and health insurance</td></tr>
  <tr><td>5%</td><td>Everyday items</td><td>Soap, shampoo, hair oil, toothpaste and toothbrushes, butter, ghee, cheese, packaged namkeen, sauces, pasta, chocolates, coffee, bicycles, kitchenware, most medicines, spectacles, tractors, clothes and shoes up to ₹2,500 a piece or pair. Services: hotel rooms up to ₹7,500 a night; gyms, salons, barbers and yoga centres; most restaurants</td></tr>
  <tr><td>18%</td><td>The standard rate: most goods and services</td><td>TVs, air conditioners, dishwashers, cement, small cars, motorcycles up to 350 cc, auto parts, clothes and shoes above ₹2,500. Most professional services: IT and software, design, consulting, repairs, advertising</td></tr>
  <tr><td>40%</td><td>Luxury and harmful goods</td><td>Sugary and aerated drinks, pan masala, cigarettes and tobacco, bigger cars, motorcycles above 350 cc, yachts, private aircraft; betting, casinos and online money gaming</td></tr>
  <tr><td>3% and 0.25%</td><td>Special rates</td><td>Gold, silver and jewellery (3%); rough diamonds and some precious stones (0.25%)</td></tr>
</table></div>
<p>Some items, such as clothes and shoes, change rate with the price. Many services carry conditions; for example the 5% rate for salons and small hotels comes <em>without</em> input tax credit.</p>
${src(a('https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf', 'GST Council: recommendations of the 56th meeting, 3 September 2025 (full item lists)'), a('https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/sep/doc202594628401.pdf', 'PIB: GST Reforms 2025'), a('https://www.newsonair.gov.in/govt-notifies-february-1st-as-date-from-which-additional-excise-duty-to-be-levied-on-tobacco-products/', 'All India Radio News: tobacco and pan masala from 1 February 2026'))}
</section>

<section id="find-rate">
<h3>Finding the rate for your item</h3>
<ol class="steps">
  <li><strong>Find the code first</strong>Look up the HSN code (goods) or SAC code (services) as described <a href="#hsn-search">below</a>. The rate follows from the code.</li>
  <li><strong>Look at your supplier's bill</strong>A GST bill from your supplier shows the HSN code and the rate they charged. If you resell the same item unchanged, that is usually your code and rate too.</li>
  <li><strong>Check the official list</strong>The GST Council's item-by-item list for the 22 September 2025 changes (linked below) gives the new rate by HSN code. The rate notifications are on CBIC's Tax Information portal, <a href="https://taxinformation.cbic.gov.in/" rel="noopener">taxinformation.cbic.gov.in</a>.</li>
  <li><strong>Still not sure? Ask</strong>A CA or GST practitioner can tell you in minutes. Charging the wrong rate means paying the difference later, with interest.</li>
</ol>
<p>The app suggests a rate for some common codes as you type them into an invoice. Treat it as a hint, and check it against the official rate before you rely on it.</p>
</section>

<section id="exempt-nil-zero">
<h3>Exempt, nil-rated, zero-rated and non-GST</h3>
<div class="table-wrap"><table>
  <tr><th>Term</th><th>What it means for you</th></tr>
  <tr><td>Exempt or nil-rated</td><td>No GST is charged, such as on fresh vegetables. You cannot claim input tax credit on purchases used for these sales. If you sell only these, give a <a href="invoices.html#invoice-types">Bill of Supply</a>.</td></tr>
  <tr><td>Zero-rated</td><td>Exports and sales to SEZ units. No GST in the end, <em>and</em> you keep your input tax credit. See <a href="#exports">Exports</a>.</td></tr>
  <tr><td>Outside GST</td><td>Petrol, diesel, natural gas, aviation fuel and liquor for drinking. They carry other taxes, not GST.</td></tr>
</table></div>
</section>

<section id="hsn-sac">
<h2>Finding your HSN or SAC code</h2>
<p><b>HSN</b> (Harmonised System of Nomenclature) codes classify goods. They are used around the world, and each extra pair of digits narrows the item down: the first 2 digits are the chapter, 4 digits the heading, 6 the sub-heading and 8 the exact tariff item. For example, 3306 is toothpaste and other dental preparations, and 8712 is bicycles.</p>
<p><b>SAC</b> (Services Accounting Code) codes classify services. They start with 99. For example, 998314 is IT design and development services, and 9963 is hotel and restaurant services.</p>
${src(a('https://gstcouncil.gov.in/sites/default/files/2025-09/press_release_press_information_bureau.pdf', 'GST Council 56th meeting annexures (HSN-wise lists)'))}
</section>

<section id="hsn-digits">
<h3>How many digits to print</h3>
<p>It depends on your <b>AATO</b>, your aggregate turnover in the last financial year:</p>
<div class="table-wrap"><table>
  <tr><th>Turnover last year</th><th>Bills to registered businesses (B2B)</th><th>Bills to consumers (B2C)</th></tr>
  <tr><td>Up to ₹5 crore</td><td>At least 4 digits</td><td>Optional</td></tr>
  <tr><td>Above ₹5 crore</td><td>At least 6 digits</td><td>At least 6 digits</td></tr>
</table></div>
<p>More digits are always allowed, and are often clearer. The same rule applies to the HSN summary in your GSTR-1; tell the app which applies to you in <a href="settings.html#gstr-details">GSTR filing details</a>.</p>
${src(a('https://gstcouncil.gov.in/sites/default/files/2024-05/notfctn-78-central-tax-english-2020.pdf', 'Notification 78/2020-Central Tax'), a(`${CBIC}/rules/cgst_rules/active/chapter6/rule46_v1.00.html`, 'CGST Rules, rule 46'))}
</section>

<section id="hsn-search">
<h3>Searching the official list</h3>
<ol class="steps">
  <li><strong>Open the search</strong>On gst.gov.in, without logging in, go to ${ui('Services')} › ${ui('User Services')} › ${ui('Search HSN Code')}. The direct address is <a href="https://services.gst.gov.in/services/searchhsnsac" rel="noopener">services.gst.gov.in/services/searchhsnsac</a>.</li>
  <li><strong>Search by name or by number</strong>Choose HSN for goods or SAC for services, then type a plain word such as <i>toothpaste</i> or <i>repair</i>, or the first digits of a code.</li>
  <li><strong>Pick the closest description</strong>Read the results and choose the most specific one that fits. Check the chapter it sits in makes sense for your item.</li>
  <li><strong>Want the whole list?</strong>The same page has <b>Download HSN Directory in Excel Format</b>.</li>
</ol>
<ul>
  <li><strong>Search by what it is made of and what it is for</strong>: "steel almirah" may be listed as furniture of metal; "plastic bucket" as household articles of plastics.</li>
  <li><strong>Ask your supplier or the manufacturer.</strong> Their bill or the product's packaging usually shows the code.</li>
  <li><strong>Two codes both look right?</strong> They may have different rates. Ask a CA rather than guess.</li>
</ul>
<p>Once you know a product's code and rate, save them on the product in the app, so every invoice picks them up: see <a href="products.html#add-product">Adding a product or service</a>.</p>
${src(a('https://tutorial.gst.gov.in/userguide/taxpayersdashboard/Search_HSN_SAC_Tax_Rates.htm', 'GST portal user manual: search HSN code'))}
</section>

<section id="invoices">
<h2>Which bill to give, and what goes on it</h2>
<div class="table-wrap"><table>
  <tr><th>Document</th><th>When</th></tr>
  <tr><td>Tax invoice</td><td>You are registered (regular scheme) and sell something taxable.</td></tr>
  <tr><td>Bill of supply</td><td>You are in the composition scheme, or you sell only exempt or nil-rated items. No GST is shown.</td></tr>
  <tr><td>Credit note</td><td>To reduce an invoice you already gave: goods returned, a discount after the sale, or you charged too much.</td></tr>
  <tr><td>Debit note</td><td>To increase an invoice you already gave, when you charged too little.</td></tr>
  <tr><td>Delivery challan</td><td>Moving goods without selling them: to a job worker, on approval, or between your own places.</td></tr>
</table></div>
<p>If you are not registered, give an ordinary bill or cash memo without GST. It is not a tax invoice. In the app, see <a href="invoices.html#invoice-types">Choosing the document type</a>.</p>
</section>

<section id="invoice-contents">
<h3>What a tax invoice must show</h3>
<ul>
  <li>Your name, address and GSTIN.</li>
  <li>An invoice number of up to 16 characters (letters, numbers, <code>-</code> and <code>/</code>), never repeated within a financial year, and the date.</li>
  <li>The buyer's name, address and GSTIN, if they are registered.</li>
  <li>For an unregistered buyer, their name, address, delivery address and state when the bill is ₹50,000 or more (or whenever they ask).</li>
  <li>The HSN or SAC code, description, quantity and unit of each item.</li>
  <li>The total value, the taxable value after any discount, and the rate and amount of CGST, SGST, IGST and cess.</li>
  <li>The place of supply and its state, for a sale to another state, and the delivery address if it is different.</li>
  <li>Whether tax is payable under reverse charge.</li>
  <li>Your signature or digital signature. An electronic invoice does not need one.</li>
</ul>
<p>The app prints all of these once your details, the client's and the items are filled in.</p>
${src(a(`${CBIC}/rules/cgst_rules/active/chapter6/rule46_v1.00.html`, 'CGST Rules, rule 46'), a('https://tutorial.gst.gov.in/downloads/news/welcome_kit_for_new_taxpyers.pdf', 'GSTN Welcome Kit, Invoicing in GST'))}
</section>

<section id="b2b-b2c">
<h3>B2B, B2C and the buyer's GSTIN</h3>
<ul>
  <li><strong>B2B</strong> means your buyer is GST-registered. Put their GSTIN on the invoice. They can only claim back the GST you charged if the invoice carries their correct GSTIN and you report it in your GSTR-1. A wrong GSTIN costs your buyer their credit. The app checks a GSTIN's format as you type it: see <a href="invoices.html#gstin-check">What the GSTIN check tells you</a>.</li>
  <li><strong>B2C</strong> means your buyer is a consumer or an unregistered business. These sales are reported as totals, except an inter-state sale to an unregistered buyer above ₹1 lakh, which is reported bill by bill.</li>
</ul>
</section>

<section id="place-of-supply">
<h3>Place of supply, in plain words</h3>
<p>The place of supply decides whether you charge CGST and SGST or IGST.</p>
<ul>
  <li><strong>Goods</strong>: generally where the goods are delivered, where their journey ends.</li>
  <li><strong>Services</strong>: generally where your registered buyer is. For an unregistered buyer, their address if you have it, otherwise your own location.</li>
  <li><strong>Exceptions</strong>: some services follow their own rule. For example, work on a building is supplied where the building is, and a restaurant meal where it is served.</li>
</ul>
<p>Same state as yours: CGST and SGST. Different state: IGST. In the app, the <b>Place of Supply</b> field starts with the client's state; change it when the delivery is elsewhere: see <a href="invoices.html#details">Invoice Details</a>.</p>
${src(a('https://taxinformation.cbic.gov.in/', 'IGST Act sections 10 to 13 on the CBIC Tax Information portal'))}
</section>

<section id="itc">
<h2>Input tax credit (ITC)</h2>
<p>Input tax credit means you take the GST you paid on business purchases off the GST you owe on your sales. You pay only the difference.</p>
<p><strong>Example.</strong> You buy stock for ₹10,000 plus 18% GST, ₹1,800. You sell it for ₹15,000 plus 18% GST, ₹2,700. You owe ₹2,700, take off the ₹1,800 credit, and pay ₹900.</p>
${src(a(`${CBIC}/acts/2017_CGST_act/active/chapter5/section16_v1.00.html`, 'CGST Act section 16'))}
</section>

<section id="itc-conditions">
<h3>When you can claim it</h3>
<ul>
  <li>You have the supplier's tax invoice (or debit note), with your GSTIN on it.</li>
  <li>The supplier has reported it in their GSTR-1, so it shows in your <b>GSTR-2B</b> on the portal.</li>
  <li>You have received the goods or the service. For goods that come in lots, after the last lot.</li>
  <li>The supplier has paid the tax to the government.</li>
  <li>You file your own GSTR-3B.</li>
  <li>You pay the supplier within 180 days of the invoice date. If you do not, you must pay the credit back, with interest, and can claim it again when you pay.</li>
  <li>You claim it by 30 November after the financial year ends, or by the date you file your annual return if that is earlier.</li>
</ul>
<p>On the portal, the <b>Invoice Management System</b> lists your suppliers' invoices so you can accept, reject or keep them pending before your GSTR-2B is final. In the app, enter every purchase bill (<a href="purchases.html#add-purchase">Adding a purchase bill</a>) and check it against GSTR-2B (<a href="gst-returns.html#gstr-2b">GSTR-2B matching</a>).</p>
${src(a(`${CBIC}/acts/2017_CGST_act/active/chapter5/section16_v1.00.html`, 'CGST Act section 16'))}
</section>

<section id="itc-blocked">
<h3>What you cannot claim credit on</h3>
<ul>
  <li>Cars and other vehicles for people with up to 13 seats, and their insurance and repairs, unless you sell vehicles, carry passengers for a fare, or run a driving school.</li>
  <li>Food and drinks, outdoor catering, beauty treatment, health services, cosmetic surgery, and life and health insurance, unless you supply the same thing yourself or a law makes you provide it to staff.</li>
  <li>Club, gym and fitness memberships, and holiday travel for employees.</li>
  <li>Building or renovating your own shop or office (other than plant and machinery).</li>
  <li>Anything for personal use.</li>
  <li>Goods lost, stolen, destroyed, written off, or given away as gifts or free samples.</li>
  <li>Purchases used for exempt sales, and everything bought while you are in the composition scheme.</li>
</ul>
${src(a(`${CBIC}/acts/2017_CGST_act/active/chapter5/section17_v1.00.html`, 'CGST Act section 17(5)'))}
</section>

<section id="returns">
<h2>Returns and due dates</h2>
<p>A return is a form you file on the GST portal to report your sales and pay the tax. The dates below are the usual ones; the government sometimes extends them, so check the portal.</p>
<div class="table-wrap"><table>
  <tr><th>Return</th><th>Due</th><th>Who files it</th><th>What it is</th></tr>
  <tr><td>GSTR-1</td><td>11th of the next month</td><td>Regular, monthly</td><td>Your sales, bill by bill for B2B</td></tr>
  <tr><td>GSTR-3B</td><td>20th of the next month</td><td>Regular, monthly</td><td>Summary of sales and credit; you pay the tax with it</td></tr>
  <tr><td>GSTR-1 (QRMP)</td><td>13th of the month after the quarter</td><td>Turnover up to ₹5 crore who chose quarterly filing</td><td>Sales for the quarter</td></tr>
  <tr><td>IFF</td><td>13th of the next month</td><td>QRMP</td><td>Optional: B2B bills for month 1 or 2 of the quarter, so your buyers get their credit sooner</td></tr>
  <tr><td>PMT-06</td><td>25th of the next month</td><td>QRMP</td><td>Tax payment for month 1 and month 2 of the quarter</td></tr>
  <tr><td>GSTR-3B (QRMP)</td><td>22nd or 24th of the month after the quarter, depending on your state</td><td>QRMP</td><td>Summary for the quarter</td></tr>
  <tr><td>CMP-08</td><td>18th of the month after the quarter</td><td>Composition</td><td>Composition tax for the quarter</td></tr>
  <tr><td>GSTR-4</td><td>30 June after the financial year (from FY 2024-25)</td><td>Composition</td><td>Composition annual return</td></tr>
  <tr><td>GSTR-9</td><td>31 December after the financial year</td><td>Regular, turnover above ₹2 crore (optional below that, from FY 2024-25)</td><td>Annual return</td></tr>
  <tr><td>GSTR-9C</td><td>With GSTR-9</td><td>Turnover above ₹5 crore</td><td>Reconciliation statement</td></tr>
</table></div>
<ul>
  <li><strong>File even when you sold nothing.</strong> A nil return is still due on time: see <a href="gst-returns.html#nil-return">NIL returns</a>.</li>
  <li><strong>Late costs money.</strong> A late return attracts a late fee for every day of delay (lower for a nil return), and tax paid late carries interest at 18% a year.</li>
  <li><strong>Do not let returns pile up.</strong> Once three years have passed since a return's due date, the portal no longer accepts it.</li>
</ul>
${src(a('https://tutorial.gst.gov.in/userguide/returns/GSTR3B.htm', 'GST portal FAQ: GSTR-3B'), a('https://tutorial.gst.gov.in/downloads/news/faq_on_qrmp_iff.pdf', 'GST portal FAQ: QRMP and IFF'), a('https://gstcouncil.gov.in/sites/default/files/e-version-gst-flyers/composition-levy-scheme.pdf', 'CBIC flyer: CMP-08'), a(`${CBIC}/rules/cgst_rules/active/chapter8/rule62_v1.00.html`, 'CGST Rules, rule 62 (GSTR-4 by 30 June)'), a('https://gstcouncil.gov.in/cgst-tax-notification', 'Notification 15/2025-Central Tax (GSTR-9 up to ₹2 crore)'))}
</section>

<section id="returns-in-app">
<h3>How the app helps</h3>
<p>The app does not log in to the portal or file for you. It prepares the figures and the files from what you have entered:</p>
<ul>
  <li><a href="gst-returns.html#gstr-1">GSTR-1</a> and <a href="gst-returns.html#gstr-3b">GSTR-3B</a>, as JSON files you upload on the portal, for a month, a quarter or a year (<a href="gst-returns.html#period">Choosing the period</a>).</li>
  <li><a href="gst-returns.html#gstr-2b">GSTR-2B matching</a>, to see which purchase credits your suppliers have reported.</li>
  <li>The <a href="gst-returns.html#filing-guide">Filing Guide</a>, with step-by-step portal instructions for regular and nil returns.</li>
</ul>
</section>

<section id="eway-einvoice">
<h2>E-way bill and e-invoicing</h2>
<p><strong>E-way bill.</strong> Before goods worth more than ₹50,000 are moved in one consignment, an e-way bill is generated on <a href="https://ewaybillgst.gov.in/" rel="noopener">ewaybillgst.gov.in</a>, with the vehicle details. Some states set a higher limit for movement within the state. Services do not need one. The app can make the file for the e-way bill portal: see <a href="invoices.html#eway-bill">E-way bill</a>.</p>
<p><strong>E-invoicing.</strong> If your aggregate turnover has been above ₹5 crore in any financial year since 2017-18, your B2B invoices and exports must be registered on the e-invoice portal, which gives each one an IRN and a QR code. Below ₹5 crore you do not need it. See <a href="gst-returns.html#e-invoice">E-invoicing (IRN)</a> for how the app handles it.</p>
${src(a('https://ewaybillgst.gov.in/', 'E-way bill portal'), a('https://einvoice1.gst.gov.in/', 'E-invoice portal'), a(`${CBIC}/rules/cgst_rules/active/chapter6/rule46_v1.00.html`, 'CGST Rules, rule 46(r) and (s)'))}
</section>

<section id="exports">
<h2>Exports and foreign clients</h2>
<p>Exports, and sales to units in a Special Economic Zone (SEZ), are <b>zero-rated</b>: no GST in the end, and you still get credit for the GST on your purchases. There are two ways to do it:</p>
<ul>
  <li><strong>Under a LUT, without paying IGST.</strong> The simple way for most small exporters.</li>
  <li><strong>Paying IGST</strong> on the invoice, then claiming that IGST back as a refund.</li>
</ul>
<p>Selling a service to a foreign client counts as an export when you are in India, the client is outside India, the place of supply is outside India, you are paid in foreign currency (or in rupees where the RBI allows it), and the client is not your own branch abroad.</p>
${src(a('https://taxinformation.cbic.gov.in/', 'IGST Act sections 2(6) and 16 on the CBIC Tax Information portal'))}
<h3 id="exports-in-app">Doing it in the app</h3>
<ul>
  <li>Save the client with their country (for example United States). No GSTIN or state is needed; their own tax ID, such as a VAT number, can go in the tax ID box and prints on the invoice. See <a href="clients.html#foreign-client">Clients abroad</a>.</li>
  <li>On the invoice, pick their currency and type the exchange rate for the invoice date. See <a href="invoices.html#currency">Billing in another currency</a>.</li>
  <li>With a LUT saved in Settings, the invoice is under LUT (no IGST) by itself. The place of supply prints as <i>Outside India</i>.</li>
  <li>When the money arrives, record the rupees your bank credited and the FIRC / e-BRC number your bank gives you: that is the proof you were paid in foreign exchange. See <a href="dashboard.html#payment-foreign">Payments from abroad</a>.</li>
  <li>In GST returns the invoice is reported in rupees: GSTR-1 Table 6A and GSTR-3B Table 3.1(b). See <a href="gst-returns.html#exports">Exports and SEZ</a>.</li>
</ul>
</section>

<section id="lut">
<h3>LUT: exporting without paying IGST</h3>
<p>A <b>Letter of Undertaking</b> (form <b>GST RFD-11</b>) is a promise to the department that you will follow the export rules. With it you export without paying IGST, so no money is stuck waiting for a refund. Any registered business can file one, unless it has been prosecuted for tax evasion of more than ₹2.5 crore. It costs nothing.</p>
<p>A LUT is valid for one financial year. File a fresh one every year, before the first export of the year; the start of April is a good habit.</p>
<ol class="steps">
  <li><strong>Open the form</strong>Log in to gst.gov.in and go to ${ui('Services')} › ${ui('User Services')} › <b>Furnish Letter of Undertaking (LUT)</b>.</li>
  <li><strong>Choose the year</strong>Pick the financial year in <b>LUT Applied for Financial Year</b>. If you had a paper LUT for an earlier year, you can upload it (PDF or JPEG, up to 2 MB).</li>
  <li><strong>Declarations and witnesses</strong>Tick the declarations, then enter the name, address and occupation of two independent witnesses.</li>
  <li><strong>Sign and file</strong>Enter the place, choose the authorised signatory, preview it, and file with DSC or EVC.</li>
  <li><strong>Keep the ARN</strong>The portal gives an <b>ARN</b> at once, and the LUT counts as accepted from then. Download the acknowledgement. You can find it again under <b>View My Submitted LUTs</b>.</li>
</ol>
${src(a('https://tutorial.gst.gov.in/userguide/refund/Furnishing_of_Letter_of_Undertaking.htm', 'GST portal user manual: furnishing a LUT'), a('https://cbic-gst.gov.in/pdf/Final_Master_circular_LUT_Bond_04102017.pdf', 'CBIC Circular 8/8/2017-GST'), a('https://cbic-gst.gov.in/pdf/circularno-40-cgst.pdf', 'CBIC Circular 40/14/2018-GST'))}
</section>

<section id="export-invoice">
<h3>What to print on an export or SEZ invoice</h3>
<p>Rule 46 says the invoice must carry this declaration, word for word:</p>
<ul>
  <li>Under a LUT: <b>"SUPPLY MEANT FOR EXPORT/SUPPLY TO SEZ UNIT OR SEZ DEVELOPER FOR AUTHORISED OPERATIONS UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX"</b></li>
  <li>Paying IGST: <b>"SUPPLY MEANT FOR EXPORT/SUPPLY TO SEZ UNIT OR SEZ DEVELOPER FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX"</b></li>
</ul>
<p>For an export it must also show the buyer's name and address, the delivery address and the country of destination. Many exporters also print their LUT's ARN and the year it covers. The rule does not ask for it, but it saves questions.</p>
<p><strong>In the app:</strong></p>
<ul>
  <li>Set the client's country, or tick <b>SEZ</b> on a client in an SEZ: see <a href="clients.html#client-form">Adding and editing a client</a>.</li>
  <li>Save your LUT's ARN and year in <a href="settings.html#lut">Settings, Company</a>. Invoices for such clients then tick <b>Export under LUT (no IGST)</b> by themselves: no IGST is added, and the declaration above prints with your ARN. Untick it to charge IGST; the "on payment" declaration prints instead. See <a href="invoices.html#lut">Exports and SEZ supplies under a LUT</a>.</li>
  <li>The <b>Export / International (LUT)</b> terms preset adds payment and shipping terms for export invoices (see <a href="invoices.html#terms-notes">Terms, notes and a private note</a>).</li>
  <li>Bill in the client's currency if you like: see <a href="invoices.html#currency">Billing in another currency</a>.</li>
  <li>Exports to clients abroad are not in the app's GSTR-1 file. The app lists them, and you add them in Table 6A on the portal: see <a href="gst-returns.html#top-bar">the warnings above the tabs</a>.</li>
</ul>
${src(a(`${CBIC}/rules/cgst_rules/active/chapter6/rule46_v1.00.html`, 'CGST Rules, rule 46 (export endorsement)'))}
</section>

<section id="sez">
<h3>Selling to an SEZ</h3>
<p>A unit or developer in a Special Economic Zone has a GSTIN like any other business. A supply to it for its authorised operations is zero-rated, even when it is in your own state: either under your LUT with no tax, or with IGST (never CGST and SGST) that the buyer or you then claim back. Keep the buyer's proof that the goods or services were received in the SEZ for its authorised operations.</p>
</section>

<section id="tds-tcs">
<h2>TDS and TCS: when tax is cut from your payment</h2>
<p>Three different things are called TDS or TCS. A small business usually meets them like this:</p>
</section>

<section id="income-tax-tds">
<h3>A client deducts income-tax TDS from your payment</h3>
<p>Many business clients must deduct income tax (TDS) when they pay you for contract work, professional or technical fees, rent, commission, or large purchases of goods. They pay you the rest and deposit the TDS with the income tax department against your PAN.</p>
<p><strong>Example.</strong> You bill ₹1,00,000 plus GST. Your client deducts ₹10,000 as TDS and pays you the rest. The ₹10,000 is not lost: it is credited to your PAN, and you claim it in your income tax return. When your invoice shows GST separately, TDS is worked out on the amount before GST.</p>
<ul>
  <li><strong>Check it reached your PAN</strong>: log in at <a href="https://www.incometax.gov.in/" rel="noopener">incometax.gov.in</a> and open your annual tax statement: <b>Form 26AS</b> for tax year 2025-26 and earlier, <b>Form 168</b> from tax year 2026-27.</li>
  <li><strong>Ask for the certificate</strong>: the client gives you a TDS certificate every quarter: <b>Form 16A</b> for payments up to 31 March 2026, and the form that replaces it under the Income-tax Rules, 2026 after that.</li>
  <li><strong>New law from 1 April 2026</strong>: the Income-tax Act, 2025 replaced the 1961 Act. The familiar sections such as 194C, 194J and 194Q are now entries in a table under section 393. Payments made up to 31 March 2026 still use the old sections.</li>
</ul>
<p>In the app, record TDS on an invoice under ${ui('Customize')}: see <a href="invoices.html#tds-tcs">TDS and TCS</a>, and the <a href="gst-returns.html#tds-tcs">TDS / TCS report</a>. For your own income tax, see <a href="income-tax.html">Income tax</a>.</p>
${src(a('https://www.incometaxindia.gov.in/documents/d/guest/press-release-income-tax-act-2025-comes-into-force-from-01-april-2026-pdf', 'Income Tax Department press release: Income-tax Act, 2025 in force from 1 April 2026'), a('https://www.incometaxindia.gov.in/documents/81799/11848482/FAQs-on-Interplay-and-Transition.pdf', 'Income Tax Department FAQs on the transition'), a('https://www.incometaxindia.gov.in/tax-services/process-annual-tax-statement-e-filing-form-26as-form-168', 'Form 168 (earlier Form 26AS)'))}
</section>

<section id="gst-tds-tcs">
<h3>GST TDS and GST TCS</h3>
<ul>
  <li><strong>GST TDS</strong>: government departments and some public bodies deduct 2% GST TDS when a contract with them is worth more than ₹2.5 lakh. It shows on the portal as a credit you can use to pay your GST.</li>
  <li><strong>GST TCS</strong>: an online marketplace keeps 0.5% of the net value of your taxable sales through it (since 10 July 2024; it was 1% before). Accept it on the portal and it is added to your cash ledger, to pay your GST with.</li>
</ul>
${src(a('https://taxinformation.cbic.gov.in/', 'CGST Act sections 51 and 52, on the CBIC Tax Information portal'), a('https://gstcouncil.gov.in/cgst-tax-notification', 'Notification 15/2024-Central Tax (TCS 0.5%)'))}
</section>

<section id="first-week">
<h2>Your first week: a checklist</h2>
<ol class="steps">
  <li><strong>Work out your turnover</strong>Estimate a year's sales and check the table in <a href="#registration">Do I need GST registration?</a> and the list in <a href="#registration-compulsory">When you must register</a>.</li>
  <li><strong>Get your PAN and a bank account</strong>Open a separate current account for the business, so business and personal money never mix.</li>
  <li><strong>Choose your scheme</strong>Regular or composition: see <a href="#composition">which one suits you</a>.</li>
  <li><strong>Register</strong>On gst.gov.in (<a href="#how-to-register">steps</a>). Add your bank account on the portal, display your registration certificate, and, under composition, put "Composition Taxable Person" on your signboard.</li>
  <li><strong>Set up the app</strong>Go through the <a href="first-run.html">first-run setup</a>. Set your state and GSTIN in <a href="settings.html#company-details">Company Details</a>, and pick your <a href="settings.html#business-type">business type</a>.</li>
  <li><strong>Find your codes and rates</strong>For each product or service, find the <a href="#hsn-search">HSN or SAC code</a> and the <a href="#find-rate">rate</a>, and save them on your <a href="products.html#add-product">products</a>.</li>
  <li><strong>Keep every purchase bill</strong>Check your GSTIN is on each one, enter it as a <a href="purchases.html#add-purchase">purchase</a>, and match your credit against GSTR-2B every month.</li>
  <li><strong>Mark your due dates</strong>Note your <a href="#returns">return due dates</a> and file every one on time, even when it is nil. The app's <a href="gst-returns.html">GST Returns</a> screen prepares them.</li>
  <li><strong>Exporting?</strong>File your <a href="#lut">LUT</a> before your first export of the year.</li>
  <li><strong>Keep your records</strong>Keep your books, bills and returns for 72 months (six years) from the due date of the annual return for that year.</li>
</ol>
${src(a('https://tutorial.gst.gov.in/downloads/news/welcome_kit_for_new_taxpyers.pdf', 'GSTN Welcome Kit (records and registration certificate)'))}
</section>

<section id="glossary">
<h2>Words you will meet</h2>
<div class="table-wrap"><table>
  <tr><th>Word</th><th>Meaning</th></tr>
  <tr><td>AATO</td><td>Annual aggregate turnover: all your sales in a financial year, on all GSTINs under one PAN. Decides your HSN digits, QRMP and e-invoicing.</td></tr>
  <tr><td>ARN</td><td>Application Reference Number: the receipt number the GST portal gives when you submit something, such as a registration or a LUT.</td></tr>
  <tr><td>GSTIN</td><td>Your 15-character GST number. The first two digits are your state code, the next ten your PAN.</td></tr>
  <tr><td>HSN</td><td>The code for a kind of goods. Decides the rate.</td></tr>
  <tr><td>ITC</td><td>Input tax credit: GST you paid on business purchases, taken off the GST you owe.</td></tr>
  <tr><td>LUT</td><td>Letter of Undertaking (form RFD-11), filed every year to export or sell to an SEZ without paying IGST.</td></tr>
  <tr><td>PAN</td><td>Permanent Account Number from the income tax department. GST registration is linked to it.</td></tr>
  <tr><td>Place of supply</td><td>Where a sale is treated as happening. Same state as you: CGST and SGST. Another state: IGST.</td></tr>
  <tr><td>RCM (reverse charge)</td><td>For some purchases, such as an advocate's fees or some goods transport, the buyer pays the GST to the government instead of the seller. See <a href="invoices.html#reverse-charge">Reverse charge</a>.</td></tr>
  <tr><td>SAC</td><td>The code for a kind of service. Starts with 99.</td></tr>
  <tr><td>SEZ</td><td>Special Economic Zone. Sales to units there are zero-rated, like exports.</td></tr>
  <tr><td>TRN</td><td>Temporary Reference Number, given in Part A of the registration form.</td></tr>
</table></div>
<p>More terms are in the <a href="glossary.html#terms">Glossary</a>.</p>
</section>
`,
},
];
