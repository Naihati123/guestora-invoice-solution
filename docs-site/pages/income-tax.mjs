const ui = (s) => `<span class="ui">${s}</span>`;
const img = (f) => `assets/img/${f}`;
const key = (...k) => k.map((x) => `<kbd>${x}</kbd>`).join(' + ');

export default [
// =============================================================================
{
  slug: 'income-tax',
  title: 'Income tax helper',
  nav: 'Income tax',
  lead: 'Estimate your income tax under the old and new regimes, presumptive taxation (44AD, 44ADA, 44AE), advance tax, bank statement import, and an ITR-4 summary to file from.',
  body: `
<div class="note warn"><strong>An estimate for one year</strong>
<p>The tax rules built in are for <b>FY 2025-26</b> (AY 2026-27). When today is in a later year, a banner says so, and invoices from the later year are not counted: enter that income yourself. Treat every figure as an estimate and have your CA confirm it before filing. The helper does not file your return; see <a href="limitations.html#income-tax-limits">what it does not do</a>.</p></div>

<section id="which-year">
<h2>Which year the figures are for</h2>
<p>The line under the page title says the year: <b>FY 2025-26 · AY 2026-27</b>. <b>FY</b> (financial year) is the year you earned the money, 1 April 2025 to 31 March 2026. <b>AY</b> (assessment year) is the year after, when you file the return for it.</p>
<p>If today falls in a later financial year, an amber banner at the top says <b>These figures are for FY 2025-26, not the current FY ...</b>. It means:</p>
<ul>
  <li>The slabs, rebate and capital-gains rates used are those of FY 2025-26. Rates for the newer year are not built in yet, so nothing is worked out with them.</li>
  <li>The business income filled in from your invoices counts only invoices dated in FY 2025-26. Income of the newer year must be typed in by hand.</li>
</ul>
<p>The banner is a reminder, not an error. You can still use every tab to check FY 2025-26 before filing for it.</p>
</section>

<section id="tabs">
<h2>The five tabs</h2>
<p>Open ${ui('Income Tax')} from the sidebar. The buttons at the top switch between five tabs; rest the mouse on one to see what it does. The small ${ui('?')} at the end of the row opens this guide at the tab you are on.</p>
<div class="table-wrap"><table>
  <tr><th>Tab</th><th>What it does</th></tr>
  <tr><td>${ui('Regime Calculator')}</td><td>Old and new regimes side by side, and which costs less</td></tr>
  <tr><td>${ui('Presumptive (§44AD/ADA)')}</td><td>Income under sections 44AD, 44ADA and 44AE, without full books</td></tr>
  <tr><td>${ui('Advance Tax')}</td><td>The instalments due, and interest for paying late</td></tr>
  <tr><td>${ui('Bank Statement Import')}</td><td>Read a bank CSV and sort each transaction</td></tr>
  <tr><td>${ui('ITR Summary')}</td><td>The year in one place, and the ITR-4 summary PDF</td></tr>
</table></div>
<p>The tabs work together: the Presumptive tab and the bank import fill the calculator, the calculator's tax drives the Advance Tax tab, and the ITR Summary uses all of them. What you type on the first three tabs is remembered in this browser, so you can close the app and come back. Figures read from your invoices, purchase bills and expenses are for the business selected in the sidebar; what you type stays the same whichever business is selected.</p>
</section>

<section id="regime-calculator">
<h2>Regime Calculator</h2>
<p>Since FY 2023-24 every individual can choose between two ways of working out income tax:</p>
<div class="table-wrap"><table>
  <tr><th></th><th>New regime (section 115BAC)</th><th>Old regime</th></tr>
  <tr><td>Rates</td><td>Lower slab rates, wider slabs</td><td>Higher slab rates</td></tr>
  <tr><td>Deductions</td><td>Almost none: only the standard deduction on salary (₹75,000) and employer NPS, 80CCD(2)</td><td>80C (PPF, LIC, ELSS...), 80D health insurance, home-loan interest, donations and the rest; standard deduction ₹50,000</td></tr>
  <tr><td>Zero tax up to</td><td>₹12 lakh of income (rebate under 87A, up to ₹60,000)</td><td>₹5 lakh (rebate up to ₹12,500)</td></tr>
  <tr><td>How to choose it</td><td>The default; nothing to do</td><td>Business owners file <b>Form 10-IEA</b> before the return's due date</td></tr>
</table></div>
<p>In short: if you have big deductions (a home loan, full 80C, health insurance for parents), the old regime may cost less; otherwise the new one usually wins. The calculator works out both and tells you.</p>
<p>The left column, <b>Your income</b>, is what you type. The right column shows the result, live as you type: the <b>Recommended</b> card, then the <b>Old Regime</b> and <b>New Regime</b> cards side by side.</p>
<figure><img src="${img('app-income-tax.png')}" alt="The Regime Calculator." loading="lazy"><figcaption>The Regime Calculator.</figcaption></figure>
</section>

<section id="your-income">
<h3>Your income</h3>
<p>First three questions about you. They change the old-regime slabs and some deduction limits:</p>
<div class="table-wrap"><table>
  <tr><th>Box</th><th>What it changes</th></tr>
  <tr><td><b>Your age on 31 March</b></td><td><b>Under 60</b>, <b>60 to 79 (senior citizen)</b> or <b>80 or older (super senior citizen)</b>. Old-regime tax-free limit ₹2.5 lakh, ₹3 lakh or ₹5 lakh. Also the 80D, 80DDB, 80TTA and 80TTB limits.</td></tr>
  <tr><td><b>My parents (whose health insurance I pay) are 60 or older</b></td><td>Raises the 80D limit for their insurance from ₹25,000 to ₹50,000.</td></tr>
  <tr><td><b>I am a government employee</b></td><td>Employer NPS, 80CCD(2), allowed up to 14% of salary instead of 10%.</td></tr>
</table></div>
<p>Then your income for the year, in rupees:</p>
<div class="table-wrap"><table>
  <tr><th>Box</th><th>What to enter</th></tr>
  <tr><td><b>Gross Salary (Form 16 box 1)</b></td><td>Salary before any deduction, as in box 1 of your Form 16. Zero if you have no salary. The standard deduction is applied for you.</td></tr>
  <tr><td><b>Business / Professional Income</b></td><td>Your business profit. If it is zero, the app fills it in from this business's rupee sales, less purchases and business expenses, all without GST, for FY 2025-26 (personal drawings and asset purchases are not counted as expenses). The note under it then says <b>Auto-filled from your invoices...</b>. Change it if your books say otherwise, or use the <a href="#presumptive">Presumptive</a> tab.</td></tr>
  <tr><td><b>House Property (rent received)</b></td><td>Rent from a let-out property, less municipal tax and the 30% standard deduction. Home-loan interest goes in <b>§24b</b> below.</td></tr>
  <tr><td><b>Other Sources (bank interest, dividends, etc.)</b></td><td>Savings and FD interest, dividends, other income. Savings interest also goes in 80TTA below to claim the deduction.</td></tr>
</table></div>
<p>${ui('Reset')} at the top of the card clears every box on this tab back to zero. (The business income fills itself in again the next time you open the screen.)</p>
<div class="note tip"><strong>Something wrong?</strong><p>Business income stays at zero: it is filled only from invoices dated in FY 2025-26, in rupees, for the business selected in the sidebar; and only when the box is zero. Business income looks too high: purchase bills or expenses for the year are not entered in the app. Type the right figure over it.</p></div>
</section>

<section id="capital-gains">
<h3>Capital gains (special rates)</h3>
<p>Profit from selling shares or equity mutual funds is taxed at its own rate, not your slab rate, under both regimes:</p>
<div class="table-wrap"><table>
  <tr><th>Box</th><th>What it is</th><th>Tax</th></tr>
  <tr><td><b>STCG on listed equity (§111A)</b></td><td>Short-term gain: shares or equity funds held 12 months or less</td><td>20% flat</td></tr>
  <tr><td><b>LTCG on listed equity (§112A)</b></td><td>Long-term gain: held more than 12 months</td><td>First ₹1.25 lakh free, 12.5% on the rest</td></tr>
</table></div>
<p>Gains on property, gold or debt funds are not entered here; ask your CA. With capital gains you may need ITR-2 or ITR-3 instead of ITR-4; see <a href="#itr4-pdf">Can you file ITR-4?</a></p>
</section>

<section id="deductions">
<h3>Deductions (Old Regime only)</h3>
<p>Each box is an amount you can subtract from income under the old regime. They do <b>not</b> reduce new-regime tax. Under each box is its limit (<b>Cap</b>) and what it covers; if you type more than the limit, only the limit is counted.</p>
<div class="table-wrap"><table>
  <tr><th>Box</th><th>For</th><th>Limit used</th></tr>
  <tr><td><b>§80C</b></td><td>PPF, ELSS, LIC premium, EPF, children's tuition fees, home-loan principal, NSC</td><td>₹1,50,000</td></tr>
  <tr><td><b>§80CCD1B</b></td><td>Your own extra NPS contribution</td><td>₹50,000</td></tr>
  <tr><td><b>§80D</b></td><td>Health insurance for self, family and parents</td><td>₹25,000 + ₹25,000; ₹50,000 for each part that is 60 or older</td></tr>
  <tr><td><b>§80TTA</b></td><td>Savings-account interest, under 60</td><td>₹10,000 (nothing if 60+)</td></tr>
  <tr><td><b>§80TTB</b></td><td>Bank and post-office deposit interest, 60 and older</td><td>₹50,000 (nothing if under 60)</td></tr>
  <tr><td><b>§80E</b></td><td>Education-loan interest, for 8 years</td><td>No cap</td></tr>
  <tr><td><b>§80G</b></td><td>Donations to approved funds and charities</td><td>No cap; enter the amount you may claim</td></tr>
  <tr><td><b>§80GG</b></td><td>Rent you pay when you get no HRA</td><td>₹60,000</td></tr>
  <tr><td><b>§80DDB</b></td><td>Treatment of specified serious illness</td><td>₹40,000; ₹1,00,000 if 60+</td></tr>
  <tr><td><b>§80U</b></td><td>Your own disability</td><td>₹1,25,000</td></tr>
  <tr><td><b>§24b</b></td><td>Home-loan interest on the house you live in</td><td>₹2,00,000</td></tr>
  <tr><td><b>§80CCD(2) — employer NPS</b></td><td>What your employer pays into your NPS. Allowed under <b>both</b> regimes.</td><td>10% of salary (14% for government employees)</td></tr>
</table></div>
<p>The 80G box takes the amount you are allowed to claim; the 50% or 100% rule for each charity is not applied for you.</p>
</section>

<section id="recommended">
<h3>Recommended regime</h3>
<p>The card at the top right says <b>Recommended: NEW Regime</b> (green) or <b>OLD Regime</b> (purple), and <b>Saves you ₹... compared to the other regime</b>. If both cost the same, new is recommended.</p>
<ul>
  <li><b>New recommended</b>: nothing to do. It is the default when you file.</li>
  <li><b>Old recommended</b>: with business income, file <b>Form 10-IEA</b> on incometax.gov.in before the return's due date, or the new regime applies anyway. Salaried people without business income choose in the return itself.</li>
</ul>
<p>The Advance Tax tab and the ITR Summary use the recommended regime's tax.</p>
</section>

<section id="old-vs-new">
<h3>Old Regime and New Regime cards</h3>
<p>Each card works out the tax step by step. The recommended one has a coloured border.</p>
<div class="table-wrap"><table>
  <tr><th>Line</th><th>Meaning</th></tr>
  <tr><td><b>Gross Total Income</b></td><td>Salary after standard deduction, business, house property and other sources added up (capital gains are taxed separately below)</td></tr>
  <tr><td><b>Standard Deduction</b></td><td>₹75,000 (new) or ₹50,000 (old) off salary; only if you have salary</td></tr>
  <tr><td><b>Chapter VI-A</b></td><td>The deductions allowed: all the boxes above for old, only 80CCD(2) for new</td></tr>
  <tr><td><b>Taxable Income</b></td><td>Income the slabs apply to</td></tr>
  <tr><td><b>Slab Tax</b></td><td>Tax by the slabs below</td></tr>
  <tr><td><b>STCG (20%)</b>, <b>LTCG (12.5%)</b></td><td>Capital-gains tax, shown only when you entered gains</td></tr>
  <tr><td><b>§87A Rebate</b></td><td>The tax waived for smaller incomes, shown when it applies</td></tr>
  <tr><td><b>Surcharge</b></td><td>Extra tax on income above ₹50 lakh, shown when it applies</td></tr>
  <tr><td><b>Health &amp; Ed Cess (4%)</b></td><td>4% on the tax plus surcharge</td></tr>
  <tr><td><b>Total Tax</b></td><td>What you owe for the year, before TDS and advance tax already paid</td></tr>
</table></div>
<p>The slabs built in, for FY 2025-26:</p>
<div class="table-wrap"><table>
  <tr><th>New regime</th><th>Rate</th><th>Old regime (under 60)</th><th>Rate</th></tr>
  <tr><td>Up to ₹4 lakh</td><td>0%</td><td>Up to ₹2.5 lakh</td><td>0%</td></tr>
  <tr><td>₹4 to 8 lakh</td><td>5%</td><td>₹2.5 to 5 lakh</td><td>5%</td></tr>
  <tr><td>₹8 to 12 lakh</td><td>10%</td><td>₹5 to 10 lakh</td><td>20%</td></tr>
  <tr><td>₹12 to 16 lakh</td><td>15%</td><td>Above ₹10 lakh</td><td>30%</td></tr>
  <tr><td>₹16 to 20 lakh</td><td>20%</td><td></td><td></td></tr>
  <tr><td>₹20 to 24 lakh</td><td>25%</td><td></td><td></td></tr>
  <tr><td>Above ₹24 lakh</td><td>30%</td><td></td><td></td></tr>
</table></div>
<p>For seniors the old regime's 0% band is ₹3 lakh (60 to 79) or ₹5 lakh (80+). The note under the cards, <b>How this is computed</b>, gives the order: slabs, then the 87A rebate, then surcharge, then cess.</p>
<div class="note info"><strong>Example</strong><p>A shop owner with ₹10,00,000 business income and no deductions: new regime taxable ₹10 lakh, slab tax ₹40,000, fully waived by the 87A rebate: <b>₹0</b>. Old regime: slab tax ₹1,12,500 + 4% cess = <b>₹1,17,000</b>. New is recommended.</p></div>
</section>

<section id="presumptive">
<h2>Presumptive income</h2>
<p>"Presumptive" means the law presumes your profit is a fixed share of your turnover, so you do not keep full books of account or get them audited. You declare that share (or more) as income and file the simple <b>ITR-4 (Sugam)</b>. Most small shops, traders and professionals use it.</p>
<p>Fill in the left card (<b>Section</b>), check the right card (<b>Presumptive computation</b>), then click ${ui('Use ₹... as Business Income')} to send the figure to the Regime Calculator.</p>
</section>

<section id="presumptive-sections">
<h3>Section: 44AD, 44ADA or 44AE</h3>
<p>Click the button that fits your work. The boxes below change with it.</p>
<div class="table-wrap"><table>
  <tr><th>Button</th><th>For</th><th>Income presumed</th><th>Limit</th></tr>
  <tr><td>${ui('§44AD')}</td><td>Trading, retail, wholesale and manufacturing</td><td>6% of turnover received digitally (UPI, NEFT, RTGS, cheque), 8% of cash turnover</td><td>₹3 crore turnover if cash is no more than 5% of it, otherwise ₹2 crore</td></tr>
  <tr><td>${ui('§44ADA')}</td><td>Professionals: CA, doctor, lawyer, architect, engineer, consultant</td><td>50% of gross receipts</td><td>₹75 lakh receipts if cash is no more than 5%, otherwise ₹50 lakh</td></tr>
  <tr><td>${ui('§44AE')}</td><td>Transporters owning up to 10 goods vehicles</td><td>₹1,000 per tonne per month for each heavy vehicle (over 12,000 kg); ₹7,500 per month for each other vehicle</td><td>10 vehicles at any time in the year</td></tr>
</table></div>
<p>The boxes:</p>
<ul>
  <li><b>44AD</b>: <b>Turnover received DIGITALLY (UPI/NEFT/RTGS/cheque)</b>, <b>Turnover received in CASH</b>, and <b>Actual profit (optional override)</b>.</li>
  <li><b>44ADA</b>: <b>Gross receipts (digital)</b>, <b>Gross receipts (cash)</b>, and <b>Actual profit (optional override)</b>.</li>
  <li><b>44AE</b>: <b>Heavy vehicles (&gt; 12,000 kg): sum of vehicle-months</b> (2 trucks for 12 months = 24), <b>Heavy vehicle gross tonnage (avg)</b> (13 to start), and <b>Light vehicles: sum of vehicle-months</b>.</li>
</ul>
<p><b>Actual profit</b>: if your real profit is higher than the presumed share, enter it, because you must declare the higher figure. You cannot declare less than the presumed share under these sections.</p>
<ol class="steps">
  <li><strong>Find your turnover</strong>Your sales for the year without GST are on the <a href="#itr-summary">ITR Summary</a> tab (<b>Sales excl. GST</b>).</li>
  <li><strong>Split it</strong>Enter what came by UPI, bank transfer or cheque as digital, and the rest as cash.</li>
  <li><strong>Check the result</strong>Read the Presumptive computation card and any warning.</li>
  <li><strong>Send it to the calculator</strong>Click ${ui('Use ₹... as Business Income')}.</li>
</ol>
</section>

<section id="presumptive-computation">
<h3>Presumptive computation</h3>
<p>The right card shows the working:</p>
<ul>
  <li>44AD and 44ADA: <b>Turnover / gross receipts</b>, <b>Deemed income @ 6% / 8%</b> (or <b>@ 50%</b>), and <b>Declared income</b>: the deemed income, or your actual profit if higher.</li>
  <li>44AE: <b>Heavy vehicles (₹1,000 × tonnes × months)</b>, <b>Light vehicles (₹7,500 × months)</b> and <b>Declared income</b>.</li>
</ul>
<p>A yellow box warns when something is wrong: turnover over the limit (you then need regular books, ITR-3 and a tax audit under section 44AB), cash above 5% when that costs you the higher limit, more than 10 vehicles, or an actual profit lower than the presumed share.</p>
<p>${ui('Use ₹... as Business Income')} copies the declared income into <b>Business / Professional Income</b> on the Regime Calculator and opens that tab. For 44AD and 44ADA it also ticks <b>Presumptive</b> on the Advance Tax tab (pay everything by 15 March). The button is hidden when you are over the limit. The ITR-4 PDF uses this figure for business income.</p>
</section>

<section id="why-presumptive">
<h3>Why presumptive taxation?</h3>
<p>The box at the bottom right lists what you gain, and the one catch:</p>
<ul>
  <li>No full books of account and no tax audit (section 44AB).</li>
  <li>Advance tax in one go, by 15 March, instead of four instalments.</li>
  <li>The simple ITR-4 (Sugam) form instead of ITR-3.</li>
  <li><b>The catch (44AD):</b> once you opt in, keep using it for 5 years. If you leave early, you cannot come back to 44AD for the next 5 years.</li>
</ul>
</section>

<section id="advance-tax">
<h2>Advance tax</h2>
<p>Advance tax means paying income tax during the year, in parts, instead of all at the end. If your tax for the year, after TDS already cut, is ₹10,000 or more, you must pay it in four instalments:</p>
<div class="table-wrap"><table>
  <tr><th>Due by</th><th>Paid in total by then</th></tr>
  <tr><td>15 June</td><td>15%</td></tr>
  <tr><td>15 September</td><td>45%</td></tr>
  <tr><td>15 December</td><td>75%</td></tr>
  <tr><td>15 March</td><td>100%</td></tr>
</table></div>
<p>If you use presumptive taxation (44AD or 44ADA), you may pay all of it by 15 March instead. Paying late or short costs interest of 1% a month under sections 234B and 234C. You pay advance tax on incometax.gov.in with challan 280 (e-Pay Tax).</p>
<p>The tab uses the <b>Total Tax</b> of the recommended regime from the Regime Calculator, so fill that in first.</p>
</section>

<section id="advance-schedule">
<h3>Advance Tax Schedule</h3>
<p>The top card. It says <b>Based on your recommended NEW Regime total tax of ₹...</b>.</p>
<div class="table-wrap"><table>
  <tr><th>Item</th><th>What it does</th></tr>
  <tr><td><b>Presumptive (pay 100% by 15 March)</b></td><td>Tick it if you use 44AD or 44ADA: the schedule becomes one instalment on 15 March.</td></tr>
  <tr><td><b>TDS already deducted</b></td><td>Tax already cut from your salary, interest, rent or contract payments. Find it in Form 26AS or the AIS on incometax.gov.in.</td></tr>
  <tr><td><b>Total tax liability</b>, <b>Less: TDS credit</b>, <b>Net advance-tax liability</b></td><td>The tax, the TDS, and what is left to pay as advance tax.</td></tr>
</table></div>
<p>If what is left is under ₹10,000, a green note says <b>no advance tax required</b> and nothing else shows. Otherwise the instalment table appears:</p>
<div class="table-wrap"><table>
  <tr><th>Column</th><th>Meaning</th></tr>
  <tr><td><b>Installment</b>, <b>Due Date</b></td><td>#1 to #4 and their dates</td></tr>
  <tr><td><b>% cumulative</b></td><td>How much of the year's tax should be paid in total by then</td></tr>
  <tr><td><b>This installment</b></td><td>The amount for that date alone</td></tr>
  <tr><td><b>Paid by due date</b></td><td>The payments you entered, dated on or before it</td></tr>
  <tr><td><b>Shortfall</b></td><td>What is still missing by that date: red if any, green if none</td></tr>
</table></div>
<div class="note tip"><strong>Something wrong?</strong><p>The total tax is zero or wrong: fill in the <a href="#regime-calculator">Regime Calculator</a> first; this tab follows it. A shortfall after you paid: enter the payment, with its real date, under Payments made.</p></div>
</section>

<section id="advance-payments">
<h3>Payments made</h3>
<p>Record each advance-tax payment you have made, so the schedule and the interest are right.</p>
<ol class="steps">
  <li><strong>Add a line</strong>Click ${ui('+ Add payment')}. A line appears with today's date.</li>
  <li><strong>Date</strong>Change it to the date on your challan.</li>
  <li><strong>Amount</strong>Type what you paid.</li>
  <li><strong>Remove</strong>The ${ui('×')} at the end of a line removes it.</li>
</ol>
<p>"No advance-tax payments recorded yet." shows until you add one. The payments are remembered in this browser.</p>
</section>

<section id="interest-234">
<h3>Interest under §234B / §234C</h3>
<p>What paying late or short costs, worked out from the schedule and your payments:</p>
<ul>
  <li><b>§234C — installment shortfall</b>: 1% a month on what was short at each date, for 3 months (1 month for the March instalment). The June and September instalments are forgiven if you paid at least 12% and 36% by then.</li>
  <li><b>§234B — post year-end delay (1% per month)</b>: if by 31 March you had paid less than 90% of the tax, 1% a month on what is unpaid, from 1 April until today.</li>
  <li><b>Total interest</b>: the two added up.</li>
</ul>
<p>Shortfalls are rounded down to the nearest ₹100 first, as the rules say. The interest is an estimate; the department's figure on filing is final.</p>
</section>

<section id="bank-import">
<h2>Bank statement import</h2>
<p>Turn a year of bank transactions into the figures the calculator needs: interest, rent received, 80C and 80D payments, business receipts.</p>
<ol class="steps">
  <li><strong>Download a CSV</strong>From net-banking or your bank's app, save the statement for the year as CSV. Excel files must be saved as CSV first; PDFs are not accepted.</li>
  <li><strong>Drop it in</strong>Drag the file onto the box <b>Drop a bank-statement CSV here or click to select</b>, or click it and choose the file. SBI, HDFC, ICICI, Axis, Kotak, PNB and Yes Bank formats are recognised, and most others with Date, Narration, Debit, Credit and Balance columns work too. It is read on your computer; nothing is uploaded.</li>
  <li><strong>Check the categories</strong>Each transaction is sorted by its description. Change any that are wrong. Mark your sales receipts as <b>Business receipts</b> yourself.</li>
  <li><strong>Push to the calculator</strong>Click ${ui('Push to Calculator')}.</li>
</ol>
<p>The imported statement is not kept after you leave the screen.</p>
<div class="note tip"><strong>Something wrong?</strong><p><b>"No transactions found"</b> or <b>"Could not parse this CSV"</b>: the file is not the bank's plain CSV, or it is an Excel file renamed to .csv. See <a href="troubleshooting.html#csv-import">A CSV import did not work</a>.</p></div>
</section>

<section id="bank-csv">
<h3>How to get the CSV</h3>
<p>Shown under the drop box until you import a file:</p>
<ul>
  <li><b>Net-banking</b>: Accounts, Statements, download as CSV (or as Excel, then open it in Excel and save as CSV).</li>
  <li><b>Mobile app</b>: Account statement, Share, Export CSV.</li>
  <li>Choose the dates of the financial year, 1 April 2025 to 31 March 2026.</li>
  <li>The file is read in your browser; nothing is sent to a server.</li>
</ul>
<p>Import one account at a time. For two accounts, import the first, push it, then import the second and push it.</p>
</section>

<section id="bank-review">
<h3>Reviewing the transactions</h3>
<p>After the import the card is titled with the bank and the count, such as <b>HDFC — 412 transactions</b>. Below it, a strip of coloured totals per category, then a table with <b>Date</b>, <b>Description</b>, <b>Debit</b> (red), <b>Credit</b> (green) and <b>Category</b>.</p>
<p>The app guesses each category from the words in the description; change any by picking from the Category box on its row. The totals follow.</p>
<div class="table-wrap"><table>
  <tr><th>Category</th><th>Guessed from words like</th><th>On push</th></tr>
  <tr><td>Salary income</td><td>salary, payroll</td><td>Not pushed (enter salary from Form 16)</td></tr>
  <tr><td>Business receipts</td><td>Never guessed: set it on your sales receipts</td><td>Added to Business / Professional Income</td></tr>
  <tr><td>Business expense</td><td>office rent, rent paid, EMI, home loan, electricity, broadband, telephone, AWS, Adobe</td><td>Not pushed</td></tr>
  <tr><td>Interest earned</td><td>int, interest, SB int</td><td>Added to Other Sources, and to 80TTA (up to ₹10,000)</td></tr>
  <tr><td>Rent received</td><td>rent, rental</td><td>70% added to House Property (the 30% deduction taken off)</td></tr>
  <tr><td>Investment / MF / PPF</td><td>SIP, mutual fund, ELSS, PPF, NPS</td><td>Not pushed; put 80C items in 80C yourself</td></tr>
  <tr><td>80C claim</td><td>LIC, life insurance</td><td>Added to 80C</td></tr>
  <tr><td>80D claim</td><td>health insurance, mediclaim</td><td>Added to 80D</td></tr>
  <tr><td>GST paid</td><td>GST, CGST, SGST, IGST</td><td>Not pushed</td></tr>
  <tr><td>Transfer / unclassified</td><td>IMPS, NEFT, RTGS, UPI, and anything not matched</td><td>Not pushed</td></tr>
  <tr><td>Personal spending</td><td>Amazon, Flipkart, Swiggy, Zomato, ATM, cash withdrawal</td><td>Not pushed</td></tr>
</table></div>
<p>${ui('Push to Calculator')} <b>adds</b> these to what is already in the calculator and opens it. Each statement can be pushed once; pushing again says it is already in the calculator. Import it again to push a fresh copy. ${ui('Clear')} throws the imported statement away.</p>
<div class="note tip"><strong>Something wrong?</strong><p>Most rows are <b>Transfer / unclassified</b>: UPI and NEFT payments carry little description; set the business ones to Business receipts by hand. Figures doubled in the calculator: the same statement was imported and pushed twice; ${ui('Reset')} the calculator and push once.</p></div>
</section>

<section id="itr-summary">
<h2>ITR Summary and the ITR-4 PDF</h2>
<p>The whole year in one place, for the business selected in the sidebar. Four cards at the top, for FY 2025-26, all without GST:</p>
<div class="table-wrap"><table>
  <tr><th>Card</th><th>From</th></tr>
  <tr><td><b>Sales excl. GST (FY 2025-26)</b></td><td>Your rupee invoices, less credit notes; estimates, challans and cancelled invoices left out. TCS is taken out too.</td></tr>
  <tr><td><b>Trading Purchases</b></td><td>Your <a href="purchases.html">purchase bills</a>, taxable value</td></tr>
  <tr><td><b>Business Expenses</b></td><td>Your <a href="expenses.html">expenses</a> without GST, except <b>Personal / Drawings</b> and <b>Asset Purchase</b></td></tr>
  <tr><td><b>Net Business Income</b></td><td>Sales less purchases less expenses (never below zero)</td></tr>
</table></div>
</section>

<section id="income-breakdown">
<h3>Income breakdown</h3>
<p>Sales, less trading purchases and business expenses, gives <b>= Net business income</b>. Then what you typed in the calculator: <b>+ Salary declared</b>, <b>+ Rent received</b>, <b>+ Other sources</b> and <b>+ Capital gains (STCG + LTCG)</b>. These last four are greyed when empty.</p>
<p>If you entered expenses under <b>Asset Purchase</b> (a computer, a machine, furniture), a note says they are not deducted here: an asset is written off over the years as depreciation (section 32). Ask your CA for the depreciation figure and enter it as a business expense.</p>
<p>The net business income here is from your books. It is not copied into the calculator by itself; the calculator has its own <b>Business / Professional Income</b> box.</p>
</section>

<section id="tax-snapshot">
<h3>Tax snapshot</h3>
<p><b>Recommended regime</b>, <b>Tax under NEW Regime</b> (or OLD), <b>Tax under other regime</b> and <b>You save vs other regime</b>, all from the Regime Calculator.</p>
<p>Below, a grey box. If your sales are under ₹2 crore and your <a href="settings.html#business-type">business type</a> is not professional, it says <b>You may qualify for Section 44AD presumptive taxation</b>; see the <a href="#presumptive">Presumptive</a> tab. It also gives the due dates: <b>31 July 2026</b> for the return when no audit is needed, <b>31 October 2026</b> with a tax audit, and the advance-tax dates.</p>
</section>

<section id="itr4-pdf">
<h3>ITR-4 (Sugam) Filing Summary PDF</h3>
<p>${ui('Download ITR-4 Summary')} makes a PDF with each ITR-4 field worked out, in the order of the form, to copy into incometax.gov.in or hand to your CA:</p>
<ul>
  <li><b>Assessee</b>: business name, GSTIN and PAN from <a href="settings.html#company-details">Settings</a>.</li>
  <li><b>Part A — General</b>: PAN (or "Fill from your profile"), filing status, Aadhaar reminder.</li>
  <li><b>Nature of Business</b>: the presumptive section and turnover, when you filled the Presumptive tab.</li>
  <li><b>B — Income</b>: salary less standard deduction, house property, business (the presumptive income if you filled that tab, otherwise the calculator's figure), other sources, gross total income.</li>
  <li><b>C — Deductions</b>: each Chapter VI-A deduction under the old regime, or 80CCD(2) under the new.</li>
  <li><b>D — Tax Computation</b>: taxable income, slab tax, rebate, surcharge, cess, total tax.</li>
  <li><b>E — Advance Tax</b>: each instalment and what you paid, when advance tax applies.</li>
</ul>
<p>The PDF uses the recommended regime, and your PDF accent colour from Print Settings when custom colours are on. It is saved to your Downloads folder as <code>ITR-4-Summary-YourBusiness-2026-27.pdf</code>.</p>
<div class="note warn"><strong>Can you file ITR-4?</strong><p>ITR-4 is for resident individuals, HUFs and firms (not LLPs) with total income up to ₹50 lakh, using presumptive taxation. With most capital gains (anything beyond long-term gains on listed shares of up to ₹1.25 lakh), income above ₹50 lakh, or regular books instead of presumptive income, you need ITR-2, ITR-3 or another form: use the PDF as a worksheet for your CA. Check every figure against Form 26AS and AIS before filing.</p></div>
<div class="note tip"><strong>Something wrong?</strong><p><b>"Could not generate PDF"</b>: press ${key('Ctrl', 'F5')} and try again. The PAN line is empty: add your PAN to the business in Settings. Business income in the PDF differs from the tax: the PDF takes the Presumptive tab's figure when that tab has one, while the tax comes from the calculator; click ${ui('Use ₹... as Business Income')} on the Presumptive tab so both match.</p></div>
</section>

<section id="not-included">
<h3>Not included yet</h3>
<p>The last card lists what the helper does not do, so you know what to get elsewhere: reading Form 16, a capital-gains module with broker imports, a house-property module for several properties, ITR-1, ITR-2 and ITR-3, the ITR JSON file the portal uploads, and Form 26AS reconciliation. File the return itself on incometax.gov.in or through your CA.</p>
</section>
`,
},
];
