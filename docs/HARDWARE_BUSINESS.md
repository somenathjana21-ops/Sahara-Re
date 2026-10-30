# SAHARA as a Hardware Business — Product, Market and Go-to-Market Options

> **Status:** Strategy note, not a commitment. All prices are indicative, pre-GST, at 100–1,000 unit volumes, and
> need vendor quotes before they go into a pitch deck. Market numbers are cited where they are facts and labelled
> as estimates where they are not.

---

## 1. The honest framing

SAHARA today is a **software triage layer with zero marginal cost per user and zero procurement hook.**

That second half is the problem. India does not buy software subscriptions for welfare delivery at scale. It buys:

- **a scheme** with a budget line,
- **a rate contract** on GeM,
- **a capital asset** with a 5-year AMC, invoiced against a sanction order.

A ₹0/seat SaaS pitch to a District Social Welfare Officer has nowhere to land in that machinery. A ₹65,000
device with a 5-year AMC does. **That — not gadget appeal — is the real reason to go hardware.** Hardware is how a
hackathon prototype becomes a line item in a district budget.

So the question is not "what device can we build?" It is:

> **Which access barrier is costing us users today, and what is the cheapest device that removes it?**

Get that right and the hardware business is a distribution strategy. Get it wrong and you have built a ₹40 lakh
injection mould for a product nobody procures.

---

## 2. The design rule that decides every product below

> **Put hardware in institutions and on the workforce. Never in the victim's home.**

An always-listening speaker in a house where violence happens is not a product — it is a witness the abuser will
find and destroy. A branded wearable is an outing. A phone that appears on a shared charger creates a new
retaliation risk. SAHARA's entire safety architecture (Quick Exit, zero PII, pseudonymous IDs, no law-enforcement
access) assumes the device is **not** in the room with the person causing harm.

Three placements are safe:

| Placement | Why it is safe | Examples below |
|---|---|---|
| **Institution** (One Stop Centre, PHC, panchayat bhawan, relief camp) | Shared, unattended, no attribution to one person | Concepts 2, 4, 6 |
| **Workforce** (ASHA, ANM, counsellor, paralegal) | The device belongs to a professional, not a household | Concepts 1, 5 |
| **Infrastructure** (block/cluster server, telephony gateway) | Nobody carries it; it has no owner to coerce | Concepts 3, 4, 7 |

Every concept below survives that test. The two that fail it are in §13, marked *do not build*.

---

## 3. The five barriers hardware can remove

| # | Barrier | Reality today | What fixes it |
|---|---|---|---|
| 1 | **Device** | Large share of rural SC/ST households are feature-phone-only. `/checkin` needs a browser. | IVR over plain voice call (concept 4), or a shared kiosk (2) |
| 2 | **Literacy** | A 3-question self-report works; a chat window does not, for a non-reader. | Audio prompts + 3 physical buttons + icon/colour UI (1, 2) |
| 3 | **Connectivity** | 2G voice coverage is near-universal; usable data is not. | Offline-first edge compute with nightly sync (3) |
| 4 | **Discovery / coercion** | Any object in the home can be found, and a found object is evidence of contact with the state. | Shared-institution placement; no-install; nothing retained on the device |
| 5 | **Procurement** *(commercial)* | States buy capex + AMC, not seats. | Any device below, sold with an AMC and a platform licence |

Note that barrier 5 is the one that makes this a *business* rather than an accessibility project.

---

## 4. The product ladder — do not skip rungs

```
  Rung 0            Rung 1              Rung 2               Rung 3              Rung 4
  Paid pilot        COTS kit            Branded appliance    Custom PCB          Silicon
  ─────────         ────────            ─────────────────    ───────────         ───────
  5 units,          tablet/SBC in a     sheet-metal or       own board,          ASIC/NPU
  off-the-shelf     laser-cut case      die-cast housing     BIS/EMC tested      integration
  hardware in a     + your software     + your software
  cardboard box
   1 month          3–6 months          9–18 months          18–30 months        3 yr+
   ₹1–3 lakh        ₹5–15 lakh          ₹40–80 lakh          ₹1.5–3 cr           ₹10 cr+

  ── Gate: signed paid pilot ──┬── Gate: 50 units/yr ──┬── Gate: 500 units/yr ──┬── Gate: 5,000 units/yr ──
```

**Never tool a custom PCB or an injection mould below ~500 units/year.** Every hardware startup in Indian govtech
dies at the tooling rung with a warehouse of unsold units and a 14-month certification bill.

---

## 5. Eight concepts

Scored at the end in §12. Rough order of "would I actually fund this".

---

### Concept 1 — **SAHARA Sathi Kit** (ASHA / ANM handheld)
*The fastest path to a rupee. Rung 1.*

**What it is.** A ₹9,000 kit an ASHA worker carries on her existing home-visit round: a 5" rugged Android Go
handset in a locked-kiosk case, a lanyard, and a laminated picture-card set. The app speaks the three self-report
questions aloud in the local language, the worker taps the answer with the victim, and the check-in is stored
offline. It syncs when the worker next reaches PHC Wi-Fi or any 2G data pocket. Everything SAHARA does downstream
(S1–S4, EWMA baseline, change point, tier) runs unchanged.

**Why hardware is needed.** The victim owns no device, and installing anything on the *worker's* phone is blocked
by state IT policy on personal devices. A state-issued, asset-tagged handset is the only thing a district can
actually deploy.

**Who buys.** NHM State Health Society (DMHP budget), District Health Society, sometimes an NGO under CSR.

**Why it is the best first product.**
- Fits an *existing* workflow and an existing workforce (~10 lakh ASHAs) — no behaviour change to sell.
- ₹9k BOM means a district can pilot 50 kits for ₹4.5 lakh without a tender.
- The kit is the distribution channel for the software you already built, and the data it generates is what makes
  the dashboard valuable — so it lifts the whole platform.
- No radio certification if you buy a BIS-certified handset and only add a case. (Big deal. See §8.)

**Indicative economics.** BOM ₹8,500–9,500 (handset ₹6,500, rugged case ₹900, lanyard/cards ₹250, freight/packaging
₹400, provisioning labour ₹600). Price ₹17,000–21,000. Gross margin ~48–55%. AMC ₹2,400/yr/kit.

**Risk.** Android Go supply is commodity — your moat is the workflow and the scoring, not the hardware. Fine.
That is the point: don't fight on the device.

---

### Concept 2 — **Sakhi Setu Kiosk** (One Stop Centre)
*The most credible government demo. Rung 2.*

**What it is.** A floor-standing, wheeled kiosk in the corner of a One Stop Centre (or DMHP clinic, or block
office): 10–15" panel, a **privacy hood and side wings** so nobody can read the screen over a shoulder, a thermal
printer that dispenses a slip with Tele-MANAS 14416, KIRAN, DLSA and the local OSC number, a UPS, and an optional
solar input for centres with unreliable power. Runs `/checkin` and `/call` in kiosk mode with a hard 90-second
idle reset so no session carries over to the next person.

**Why hardware is needed.** A shared centre with one counsellor and one laptop cannot offer privacy. The hood is
the product. Also: no login, no identity, no session residue — the physical design enforces the privacy claim.

**Who buys.** District Administration / WCD under the OSC scheme (802 operational, 1,025 approved as of FY25–26);
DMHP district cells (767 districts sanctioned).

**Indicative economics.** BOM ₹27,000–33,000 at 100 units (panel PC ₹11k, hood + pedestal + lock ₹8k, thermal
printer ₹3.5k, 4G router ₹2.5k, UPS ₹3k, harness/assembly ₹2k). Price ₹68,000–78,000. AMC ₹8,500/yr (includes
platform licence + one on-site visit). Gross margin ~55%.

**Why it is not the first product.** A kiosk is a *capital* purchase in a *state* budget — one procurement cycle
is 9–18 months, and you will be asked for a 3-district pilot you cannot fund yourself. Use it as the thing you
demo to a Secretary, not the thing you start with.

---

### Concept 3 — **SAHARA Panchayat Node** (offline edge appliance)
*The strongest moat and the best story. Rung 2.*

**What it is.** A fanless, DIN-rail, IP54 box in the block or panchayat office running the full pipeline — lexicon
interlock, scoring, EWMA, policy engine — **locally, with no internet**. Victims check in at the panchayat's shared
tablet or over the local IVR; check-ins accumulate on the box; a nightly 200 KB sync pushes only scores and
pseudonymous IDs to the district. Raw transcripts never leave the device. Model is a local quantised LLM or, with
`LLM_PROVIDER=none`, the vetted static reply bank.

**Why hardware is needed — three reasons, all commercial:**
1. **Data sovereignty is a procurement requirement, not a feature.** District legal advisers object to victim
   distress data sitting on a vendor's cloud. "Nothing leaves this building" ends that objection in one sentence.
2. **It works where the users are.** No data connectivity required for the daily path.
3. **It cannot leak what it never stores.** Your zero-PII architecture becomes a physical property. That is a
   marketing asset no competitor can copy with a press release.

**Indicative economics.** BOM ₹22,000–25,000 at 100 units (SBC ₹7.5k, NPU accelerator ₹6.5k optional, industrial
storage ₹1.8k, 4G modem + SIM ₹2.8k, UPS/battery ₹1.5k, IP54 enclosure ₹1.2k, surge-protected SMPS ₹0.9k, assembly + 48 h burn-in ₹1.5k). Price ₹55,000–65,000. AMC ₹9,500/yr. Platform licence ₹1.5–3 lakh/yr per
district (this is where the margin actually is). Gross margin ~55% on box, ~85% on licence.

**Risk.** If you run a local LLM, the thermal and reliability envelope gets hard, and a counselling box that
crashes is a safety incident. Ship v1 with `LLM_PROVIDER=none` and the static reply bank — the interlock path is
the safety-critical one anyway, and the box then has no GPU, no fan, and no moving parts.

---

### Concept 4 — **SAHARA Vaani Gateway** (feature-phone IVR node)
*The largest reach, the heaviest certification. Rung 2.*

**What it is.** A 8- or 16-port GSM/VoIP gateway plus a small server, installed at the district or Tele-MANAS cell.
A victim dials a short code from any feature phone, hears the three questions in Hindi or the local language,
answers with the keypad, and presses `0` for immediate human handoff. No app, no data, no smartphone, no literacy.

**Why hardware is needed.** You can rent a cloud IVR, but Indian government buyers will not route victim calls
through a US-hosted CPaaS, and a state telephony short code requires on-prem termination they control.

**Who buys.** NHM / Tele-MANAS cells (53 operational across 36 states and UTs, ~47.7 lakh calls since Oct 2022);
state health societies; large NGOs with a 181-style helpline.

**Indicative economics.** 8-port gateway ₹35,000–45,000 import, server ₹35,000, integration ₹20,000 →
cost ₹90,000–1,00,000. Price ₹2.5–3.5 lakh per node, or sell as a managed service at ₹40,000–60,000/month per
district.

**Risk — read this before you start.** Telecom equipment in India needs **TEC/MTCTE** certification, which is
8–12 weeks, fee-bearing, and per-model. GSM gateways are also *spectrum- and licence-sensitive*: terminating PSTN
traffic commercially needs a VNO/telecom licence or a partnership with one. **Do not build this yourself as a
student team.** Partner with an existing IVR/CPaaS provider, or resell a certified gateway with your software on
top. The margin is fine either way; the licence exposure is not.

---

### Concept 5 — **SAHARA Field Kit** (counsellor / paralegal tablet)
*Useful, low-margin, low-moat. Rung 1.*

**What it is.** A rugged 10" tablet + Bluetooth thermal printer + 20,000 mAh power bank in a pelican case, running
`/staff` offline with queued sync. For DLSA paralegals and DMHP counsellors doing village visits where the triage
queue is only reachable from a desk today.

**Why hardware is needed.** Weakly. This is the least defensible concept — it is a tablet in a box, and any SI can
quote it. Build it only as an accessory sale to an existing kiosk or node contract, never as a standalone bet.

**Economics.** BOM ₹36,000–39,000. Price ₹55,000. AMC ₹6,000/yr.

---

### Concept 6 — **SAHARA Relief Kit** ("Sahara-in-a-Box")
*Small volume, excellent margin, best press. Rung 1–2.*

**What it is.** A wheeled hard case containing a 4G/mesh access point, 6 rugged tablets in kiosk mode, a solar
panel + charge controller, a 40,000 mAh pack, and a printed quick-start in two languages. Deployable in 20 minutes
at a relief camp, a riot-displacement shelter, a flood camp, or a migration transit point.

**Why hardware is needed.** Camps have no infrastructure, no power, no connectivity, and a transient population —
nothing can be installed and nothing can be assumed. This is the one scenario where a self-contained box is
genuinely the only design.

**Who buys.** SDMA / District Disaster Management Authority, NDRF-linked NGOs, large foundations, and — the
commercially interesting one — **CSR budgets of mining and infrastructure companies** operating in districts with
displacement.

**Economics.** BOM ₹1.9–2.3 lakh. Price ₹3.4–3.8 lakh. Margin ~40%, but a single PO can be 10–20 kits, and there is
no per-unit certification beyond the components' own.

**Bonus.** This is the concept most likely to get you a photograph with a minister, which in this market is worth
more than the revenue.

---

### Concept 7 — **Compliance Appliance / OEM SDK** (sell the box, not the service)
*A different customer, a different company. Rung 2–3.*

**What it is.** The Panchayat Node (concept 3), re-badged and sold to *other* Indian health-tech and elder-care
companies who need DPDP-compliant on-prem inference and cannot send data to a US LLM API. You sell the appliance
plus the interlock library; they sell to their customers.

**Why this is interesting.** It is the only concept where the buyer has a budget and a deadline (DPDP compliance),
pays in 30 days instead of 180, and does not require a tender. It also turns your safety architecture — the
double interlock, the banned-output patterns, the fixed reply bank — into a licensable product, which is the most
defensible asset in this repo.

**Why it is not first.** It requires you to have shipped the appliance at least once (concept 3), and it puts you
in a sales cycle with other startups, which is a different muscle.

---

### Concept 8 — **Discreet wearable / panic tag**
*The obvious idea. Do not lead with it.*

**What people will ask you to build.** A pendant, bangle, or watch with one button that alerts a counsellor.

**Why it underperforms here, specifically:**
- **Coercion.** The population's central risk is retaliation by an accused person on bail, often in the same
  household. A device found on the body is proof of contact with the state — it *increases* risk.
- **Charging.** Every wearable needs a charger; a hidden charger in a hostile household is a discovery event.
- **No responder.** A button is only as good as the SLA behind it. At the district level there is no 30-minute
  responder network, so the alert becomes a dashboard entry — which is exactly what SAHARA already does without
  a device.
- **Theft and false alarms.** Rural asset loss and accidental activation will dominate the incident log.

There is a version that works: a **non-wearable, non-obvious check-in token** — a laminated RFID/NFC card that
looks like a ration card or an MGNREGA job card. The person taps it at the panchayat kiosk; it carries only a
pseudonymous ID; it identifies nothing about its purpose; losing it reveals nothing. ₹45 per card, no battery, no
certification, no charging. Ship that, not the watch.

---

## 6. Market sizing — with an honest ceiling

**Anchor facts**

| Anchor | Figure | Source |
|---|---|---|
| Atrocity cases registered, 2022 | **67,646** (57,582 SC + 10,064 ST), highest since 2013 | NCRB via Ministry statement, Dec 2024 |
| One Stop Centres | **802 operational**, 1,025 approved, FY2024–25 | WCD / Mission Shakti reporting |
| DMHP districts sanctioned | **767** | MoHFW |
| Tele-MANAS cells | **53** across 36 states/UTs, 47.75 lakh calls | MoHFW, Oct 2026 |
| Ayushman Arogya Mandirs | **~1.83 lakh** | MoHFW |
| ASHA workforce | **~10 lakh** | NHM (order of magnitude) |
| Blocks / gram panchayats | ~6,000 / ~2.5 lakh | MoPR |

**Bottom-up SAM at government unit prices (annualised, 5-year deployment)**

| Segment | Units | Price | One-time |
|---|---:|---:|---:|
| OSC / DMHP kiosks | 800 | ₹72,000 | ₹5.8 cr |
| Block Panchayat Nodes | 1,500 (pilot-scale) | ₹60,000 | ₹9.0 cr |
| Tele-MANAS / district IVR nodes | 60 | ₹3.0 lakh | ₹1.8 cr |
| ASHA kits | 20,000 | ₹19,000 | ₹38.0 cr |
| Relief kits | 300 | ₹3.6 lakh | ₹10.8 cr |
| **Total one-time SAM** | | | **≈ ₹65 cr** |
| Recurring (AMC + licences) | | | **≈ ₹18–24 cr/yr** |

**Read that number honestly: this is not a large hardware market on its own.** ₹65 crore of one-time hardware
across all of India, deployed over five years, split among competitors, is a small company. At 55% gross margin
and 25% share it is roughly ₹9 crore of lifetime gross profit — enough to build a 20-person company, not enough
to raise a Series A on hardware alone.

**Which is why the business is not "SAHARA devices".** It is **"distress monitoring for vulnerable populations"**,
with atrocity victims as the credibility wedge and these as the volume:

- **Elderly** — ~149 million Indians aged 60+ (2022), projected ~20.8% of population by 2050. Elder abuse and
  neglect monitoring is the same pipeline with a different S₃ rubric (pension delay, property dispute, hospital
  admission, caregiver change). This is the biggest adjacent market by an order of magnitude.
- **Disability** — 2 crore+ disability certificates; caregiver distress and UDID-linked scheme delays map directly
  onto S₃.
- **Disaster and displacement** — concept 6, seasonal, high margin.
- **Maternal mental health** — DMHP + ASHA workflow already in place.
- **School counselling** — the largest unit count (15 lakh schools) and the weakest procurement budget. Ignore it
  for now.

The hardware line item gets you in the door (`₹65 cr`); the S₃ rubric library and the platform licence across five
populations is the business (`₹1,000 cr+` addressable, realistically).

---

## 7. Business models and the procurement playbook

### Four revenue shapes

| Shape | Structure | Use for |
|---|---|---|
| **Capex + AMC** | device once + 18–22% of capex/yr | kiosks, nodes, relief kits — matches how states budget |
| **Device-as-a-service** | ₹2,500–4,000/seat/month, 3-yr term, device included | district-wide ASHA deployments; avoids the district's capex ceiling |
| **Platform licence** | ₹1.5–3 lakh/yr per district + per-seat | the real margin; sold alongside any box |
| **Managed service** | ₹40,000–60,000/month per district | IVR node; keeps the certified-hardware risk with a partner |

Target blended gross margin **55%**, with hardware at 45–55% and licence at 85%+. If the blended number is below
50%, you are a contract manufacturer with extra steps.

### The seven budget lines that actually exist

1. **SCP / TSP funds** — the Scheduled Caste and Scheduled Tribe Component, ring-fenced at ~4.5% and ~2% of
   central ministry plan allocations, with a documented history of **underspending**. An unspent ring-fenced line
   with a March deadline is the single best sales environment in Indian government. Lead here.
2. **Nirbhaya Fund** — funds the OSC scheme; WCD-routed.
3. **NHM / DMHP** — health society budgets, faster and more flexible than treasury budgets.
4. **District Mineral Foundation (DMF)** — mining districts hold large, locally-controlled welfare funds under
   MMDR. Very few vendors know how to sell into DMF. High-leverage, under-served.
5. **CSR** — Schedule VII covers reducing inequality and women's empowerment. A single foundation can fund a
   district pilot without a tender. This is how you get your first paid unit.
6. **State Innovation / Startup funds** — e.g. state electronics or IT department pilot grants; usually ₹5–25 lakh
   and non-dilutive.
7. **Disaster management funds** — SDMA/DMAA, for concept 6.

### The single highest-leverage move: become a registered MSE

Under DPIIT's Public Procurement (Preference to Make in India) Order and the MSE order framework:

- MSEs are **exempt from prior-turnover and prior-experience criteria** in public procurement (subject to quality
  and capability checks). This removes the one condition that disqualifies every first-time founder from a
  government tender.
- Central ministries, departments and CPSEs carry a **25% MSE procurement mandate**, of which **4% is earmarked
  for MSEs owned by SC/ST entrepreneurs** and **3% for MSEs owned by women**. State adoption varies — check your
  target state's own MSE policy, several go further than the centre.

Register on **Udyam** as an MSE, and if the founding team qualifies, as a **women-owned MSE**. In a market where
your competitor's bar is "3 years of government supply history", this is worth more than any certification.

### Then list on GeM

One GeM catalogue listing against a rate contract unlocks every district in the country without a fresh tender.
This is the highest-ROI administrative task in the entire plan, and it costs nothing but paperwork. Budget six
weeks and one consultant.

### Pilot pricing

Never do a free pilot. Charge **₹2–5 lakh for a 90-day, one-district pilot** with a written evaluation protocol
(recall on seeded criticals, SLA adherence, counsellor time saved, language coverage). Free pilots are how govtech
hardware companies spend two years and earn nothing; a paid pilot is the only proof anyone will accept at the next
level.

---

## 8. Certification and compliance — the actual bill

| Requirement | Applies to | Cost (indicative) | Lead time |
|---|---|---|---|
| **BIS / CRS registration** | If the product is in the Compulsory Registration Scheme list (power adapters, batteries, some electronics) | ₹1.5–3 lakh per model | 6–10 weeks |
| **WPC ETA** | Any radio — Wi-Fi, BLE, 4G module | ₹25k–60k per model | 4–8 weeks |
| **TEC / MTCTE** | Telecom equipment, incl. GSM gateways (concept 4) | ₹1–3 lakh per model | 8–12 weeks |
| **EMC / safety pre-scan** | Everything with a PSU | ₹60k–1.5 lakh | 3–4 weeks |
| **CDSCO — Medical Device Software** | See below. This is the one that can end the company. | ₹2–8 lakh + QMS | 6–18 months |
| **DPDP Act 2023 + Rules** | Consent artefacts, breach reporting to the Data Protection Board, retention limits, DPO | internal + counsel | ongoing |
| **CERT-In directions (Apr 2022)** | Cloud/telemetry: 6-hour incident reporting, 180-day logs, NTP sync | internal | ongoing |
| **E-waste EPR (2022 Rules)** | Producer take-back obligation for every unit sold | ₹15–40/unit provision | registration + annual returns |
| **Battery Waste Rules 2022** | Any lithium cell shipped | ₹10–25/unit provision | registration |
| **STQC / CERT-In empanelled audit** | Usually demanded by state IT departments before go-live | ₹1–2 lakh | 4–8 weeks |
| **RPwD Act accessibility** | Public-facing interfaces | design cost | — |

**Reconcile once: you can skip roughly 60% of this list by buying certified commodities.** Concept 1 (a BIS-
certified Android handset in your own case) needs **no BIS, no WPC, no EMC, no MTCTE**. Concept 3 (custom box)
needs most of them. That delta — call it ₹6–10 lakh and 6 months — is the real argument for starting at Rung 1.

### The CDSCO trap — read carefully

Since 2026 CDSCO has published guidance on **Medical Device Software** under MDR-2017. The dividing line is
**intended use**:

- Software that only supports general wellbeing, and makes **no reference to a disease, disorder or pathological
  condition**, can sit outside the medical device regime.
- Software that **monitors, screens, predicts or alerts** on a clinical condition is medical device software, risk
  classed A–D, with IEC 62304-style lifecycle evidence, QMS, cybersecurity documentation and licensing.

Today SAHARA's own documents say *"we do not claim to predict suicide"* and *"the AI does not decide"*. **Those
sentences are regulatory assets, not modesty.** The moment a marketing deck says "detects depression" or "predicts
self-harm risk", you are arguably Class B/C SaMD and your ₹60,000 kiosk becomes a 12–18 month licensing project.

Practical rules:
- Write an **Intended Use Statement** now, one page, and have a regulatory consultant sign off before you print a
  single brochure.
- Use *"distress triage and prioritisation"*, never *"diagnosis", "detection", "prediction of suicide"*.
- Put "does not diagnose or treat" in the IFU, the box, and the boot screen.
- Get a **named clinical supervisor** on the letterhead before any real deployment. Your own brief already says
  this; hardware makes it non-optional, because a box with a logo on it looks like a medical device to a
  regulator, a journalist, and a judge.

---

## 9. Manufacturing path

| Stage | Volume | Where | NRE |
|---|---:|---|---:|
| EVT (engineering validation) | 5–10 | in-house, 3D-printed / laser-cut | ₹1.5–3 lakh |
| DVT (design validation) | 30–50 | small-batch assembly, Bengaluru / Noida | ₹4–8 lakh |
| PVT (production validation) | 100 | contract manufacturer | ₹8–15 lakh |
| MP (mass production) | 1,000+ | Syrma SGS, Kaynes, Dixon, Optiemus, SFO, Avalon | ₹1.8–3 lakh PCB NRE + tooling |

Rules that save money:
- **Laser-cut acrylic or sheet-metal first.** Injection tooling is ₹4–12 lakh per part and is scrap the moment the
  design changes.
- **Buy the radio module pre-certified** (Quectel/Simcom 4G, or just don't include one — tether to a ₹2,500 MiFi).
  Module-level ETA saves a full WPC cycle.
- **Field-replaceable battery and a 3-year spares commitment.** A district will not buy a sealed device with a
  2-year life from a company with 8 employees.
- **Design for the repairability you can actually deliver in a district**: one screw type, one board, no glue,
  remote diagnostics, and a swap-not-repair RMA model with a 5-day turnaround. Rural repair logistics kill more
  deployments than software bugs.
- Provision **3–5% of hardware revenue** for warranty.

---

## 10. Risks, and which ones are fatal

| Risk | Severity | Mitigation |
|---|---|---|
| **Payment cycle 90–180 days** — you are the district's bank | Fatal for cash flow | CSR-funded first units; 50% advance on PO; invoice against LC where possible; factor receivables |
| **Pilot purgatory** — 3 free pilots, no PO, 18 months gone | Fatal | Paid pilots only; written evaluation criteria; a walk-away date |
| **CDSCO reclassification** by one sentence in a deck | Fatal | §8 — intended-use statement, counsel sign-off, disciplined language |
| **Device stolen / confiscated** | High | Institutional placement, asset tagging, remote wipe, no victim-identifying marks |
| **"Sahara" branding as an outing** | High | Neutral enclosure branding ("Community Support Terminal"), no complaint-related iconography |
| **Programme discontinued, devices stranded** | High | Ship generic hardware; keep the software portable to the next scheme |
| **Vendor lock-in to one state** | High | Two states by month 12, or you are a ward of one IAS officer |
| **Competitor is an SI quoting a Dell tablet** | Medium | Compete on the S₃ rubric + audit trail + interlock, never on the box |
| **Local LLM thermal failure** | Medium | Ship `LLM_PROVIDER=none`; static reply bank is the safe path anyway |
| **Certification slips a quarter** | Medium | Start WPC/BIS before the final design freeze on the module you know you'll use |
| **Founder team graduates / disperses** | Fatal | Incorporation, vesting, and a written split *before* the first PO |

---

## 11. 18-month roadmap

| Phase | Months | Milestone | Spend |
|---|---|---|---|
| **0. Validate** | 1–2 | Intended-use statement signed; Udyam MSE registration; 20 discovery calls (5 DSWOs, 5 OSCs, 5 DMHP, 5 NGOs) | ₹1 lakh |
| **1. Paid pilot** | 3–5 | 50 Sathi Kits + 1 kiosk in **one** district, funded by CSR or a state innovation grant. Real counsellors, real check-ins, 90 days. | ₹6–9 lakh |
| **2. Prove it** | 6–7 | Written evaluation; 3 letters of intent; GeM listing filed; one state reference | ₹3 lakh |
| **3. First PO** | 8–11 | 150–300 kits + 5 kiosks under SCP/TSP or NHM; Rung-1 hardware only, no tooling | ₹25–40 lakh (funded by PO advance) |
| **4. Harden** | 12–15 | Panchayat Node DVT (30 units); WPC ETA on the chosen module; IEC 62304-lite documentation started | ₹15 lakh |
| **5. Second state** | 16–18 | Second state pilot; Tele-MANAS partnership conversation; decide whether to raise | ₹20 lakh |

**Total external capital needed to reach a real PO: roughly ₹10–15 lakh.** That is the most important number in
this document. If a hardware plan needs ₹2 crore to reach first revenue, it is the wrong plan.

---

## 12. Verdict

| # | Concept | Capital | Time to ₹ | Moat | Field risk | Regulatory load | Verdict |
|---|---|---:|---:|---|---|---|---|
| 1 | **Sathi Kit** (ASHA) | ₹6–9 L | **3–5 mo** | Medium | Low | **Low** | **Build first** |
| 3 | **Panchayat Node** | ₹15–25 L | 12 mo | **High** | Medium | Medium | **Build second — this is the moat** |
| 2 | **Sakhi Kiosk** | ₹8–12 L | 9–15 mo | Medium | Low | Low | Build as attach to #1/#3 |
| 6 | **Relief Kit** | ₹6 L | 6 mo | Low | Medium | Low | Opportunistic; great PR |
| 5 | **Field Kit** | ₹4 L | 6 mo | **Low** | Low | Low | Attach-only |
| 4 | **Vaani Gateway** | ₹10 L | 9–12 mo | Medium | Medium | **Very high** | Partner, don't build |
| 7 | **Compliance Appliance** | ₹10 L | 15 mo | High | Low | Medium | Year 2, after #3 ships |
| 8 | **Wearable / panic tag** | ₹25 L+ | 18 mo+ | Low | **Very high** | **High** | **Do not build** (ship the NFC card instead) |

**The recommendation, in one sentence:** build the **Sathi Kit** to get your first paid district, build the
**Panchayat Node** to make yourself un-copyable, and let the kiosk and relief kit ride along on those two contracts
— then use the whole thing to sell a distress-monitoring platform to five populations, of which atrocity victims
are the most important and the least lucrative.

---

## 13. What I would not build

| Idea | Why not |
|---|---|
| **A smart speaker / always-listening device** | In a household where the accused is on bail, this is a surveillance device the abuser will find. Ethically disqualifying and it contradicts your own privacy architecture. |
| **A free-phone giveaway programme** | Highest per-unit cost, no AMC, no moat, endless replacement liability, and every unit is a discovery risk. |
| **A custom wearable** | §5 concept 8. Solves a problem (charging, coercion, responders) you cannot solve at district scale. |
| **A custom PCB in year one** | Burns ₹8–15 lakh and 6 months for a product you have not sold yet. |
| **An app for victims' own smartphones** | You already have the web app; the users without smartphones are exactly the users the problem statement is about. |
| **Selling to police** | Your own brief forbids distress data reaching law enforcement. Keep it that way; it is also the reason victims will use it. |
| **Anything that says "AI predicts suicide"** | Turns you into regulated SaMD, destroys the trust posture, and is not true. |

---

## Appendix — assumptions

- Prices are indicative, pre-GST, INR, at 100–1,000 units, and require quotes.
- BOM figures assume 2026 Indian component costs; a 15–20% swing either way is normal.
- Market anchors: NCRB 2022 (67,646 cases), WCD OSC reporting FY2024–25 (802 operational), MoHFW DMHP (767
  districts) and Tele-MANAS (53 cells, Oct 2026).
- CDSCO Medical Device Software guidance: verify the current issue status and consult a regulatory affairs
  professional before any claim leaves the building.
- SCP/TSP and DMF allocation mechanics vary by state and year; confirm the actual budget line with the district
  before you build a pitch around it.
