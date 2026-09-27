import os
import shutil
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_sahara_report():
    doc = docx.Document()

    # Configure 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
        # Header setup
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Project SAHARA | Smart India Hackathon 2025–2026 (PS ID: 26094)")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139)
        
        # Footer setup
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun_left = fp.add_run("Team LexorTek (ID: 124874) — Confidential / Evaluation Dossier              ")
        frun_left.font.name = "Calibri"
        frun_left.font.size = Pt(8.5)
        frun_left.font.color.rgb = RGBColor(100, 116, 139)
        
        frun_page = fp.add_run("Page ")
        frun_page.font.name = "Calibri"
        frun_page.font.size = Pt(8.5)
        frun_page.font.color.rgb = RGBColor(100, 116, 139)
        
        # XML page number
        fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
        instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> PAGE </w:instrText>' % nsdecls('w'))
        fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
        fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
        frun_page._r.append(fldChar1)
        frun_page._r.append(instrText)
        frun_page._r.append(fldChar2)
        frun_page._r.append(fldChar3)

    # Color Palette Definitions
    NAVY_HEX = "0F2942"       # Primary Dark Navy
    SLATE_BLUE_HEX = "1B559B" # Secondary Accent Blue
    TEAL_HEX = "0E7490"       # Accent Teal / Cyan
    LIGHT_BG_HEX = "F8FAFC"   # Table alternate row
    CALLOUT_BG_HEX = "F0F4F8" # Callout neutral box
    ALERT_RED_BG = "FEF2F2"   # Red warning callout
    ALERT_RED_BORDER = "B91C1C"
    GREEN_BG = "F0FDF4"       # Green success callout
    GREEN_BORDER = "15803D"
    BORDER_HEX = "CBD5E1"     # Soft grey border

    COLOR_NAVY = RGBColor(15, 41, 66)
    COLOR_SLATE_BLUE = RGBColor(27, 85, 155)
    COLOR_TEAL = RGBColor(14, 116, 144)
    COLOR_BODY = RGBColor(31, 41, 55)
    COLOR_MUTED = RGBColor(100, 116, 139)

    # XML Helper Functions
    def set_cell_background(cell, hex_color):
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        tcPr.append(shd)

    def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_table_borders(table, border_color=BORDER_HEX):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{border_color}"/>'
            f'<w:bottom w:val="single" w:sz="10" w:space="0" w:color="{NAVY_HEX}"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{border_color}"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    # Typography & Helper Builders
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(24)
        run.font.bold = True
        run.font.color.rgb = COLOR_NAVY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(18)
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(12.5)
        run.font.italic = True
        run.font.color.rgb = COLOR_SLATE_BLUE
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.color.rgb = COLOR_NAVY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = COLOR_SLATE_BLUE
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_TEAL
        return p

    def add_p(text, bold_prefix=None, space_after=6, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Calibri"
            r_bold.font.size = Pt(10.5)
            r_bold.font.bold = True
            r_bold.font.color.rgb = COLOR_BODY
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(10.5)
        r_text.font.italic = italic
        r_text.font.color.rgb = COLOR_BODY
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Calibri"
            r_bold.font.size = Pt(10.5)
            r_bold.font.bold = True
            r_bold.font.color.rgb = COLOR_BODY
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(10.5)
        r_text.font.color.rgb = COLOR_BODY
        return p

    def add_callout(text, title=None, border_color=TEAL_HEX, bg_color=CALLOUT_BG_HEX):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        cell.width = Inches(6.5)
        
        tcPr = cell._tc.get_or_add_tcPr()
        shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{bg_color}"/>')
        tcPr.append(shd)
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
            f'<w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=160)
        
        cp = cell.paragraphs[0]
        cp.paragraph_format.space_before = Pt(0)
        cp.paragraph_format.space_after = Pt(3 if text else 0)
        cp.paragraph_format.line_spacing = 1.15
        if title:
            trun = cp.add_run(title + "\n")
            trun.font.name = "Calibri"
            trun.font.size = Pt(11)
            trun.font.bold = True
            trun.font.color.rgb = COLOR_NAVY
        mrun = cp.add_run(text)
        mrun.font.name = "Calibri"
        mrun.font.size = Pt(10)
        mrun.font.italic = True
        mrun.font.color.rgb = COLOR_BODY
        
        # Empty space after callout
        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(6)

    def add_table_custom(headers, data, col_widths=None):
        tbl = doc.add_table(rows=len(data) + 1, cols=len(headers))
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl)
        
        # Header row
        hdr_row = tbl.rows[0]
        tblPr = tbl._tbl.tblPr
        # Repeat header row across pages
        trPr = hdr_row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

        for i, header_text in enumerate(headers):
            cell = hdr_row.cells[i]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_background(cell, NAVY_HEX)
            set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
            if col_widths and i < len(col_widths):
                cell.width = col_widths[i]
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(header_text)
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            
        # Data rows
        for r_idx, row_data in enumerate(data):
            row = tbl.rows[r_idx + 1]
            bg = LIGHT_BG_HEX if (r_idx % 2 == 1) else "FFFFFF"
            for c_idx, cell_value in enumerate(row_data):
                cell = row.cells[c_idx]
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                set_cell_background(cell, bg)
                set_cell_margins(cell, top=100, bottom=100, left=160, right=160)
                if col_widths and c_idx < len(col_widths):
                    cell.width = col_widths[c_idx]
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.1
                run = p.add_run(str(cell_value))
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.color.rgb = COLOR_BODY
        
        # Trailing spacing
        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(0)
        sp.paragraph_format.space_after = Pt(6)
        return tbl

    def add_slide_figure(image_filename, caption_text):
        img_path = os.path.join("extracted_slides", image_filename)
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(3)
            p_img.paragraph_format.keep_with_next = True
            doc.add_picture(img_path, width=Inches(6.2))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(0)
            p_cap.paragraph_format.space_after = Pt(12)
            c_run = p_cap.add_run(f"Figure: {caption_text} (Source: LexorTek SIH Submission Deck)")
            c_run.font.name = "Calibri"
            c_run.font.size = Pt(9)
            c_run.font.italic = True
            c_run.font.color.rgb = COLOR_MUTED

    print("Building Document Content...")

    # =========================================================================
    # COVER / METADATA SECTION (Matching Page 1 of PDF)
    # =========================================================================
    add_title("SMART INDIA HACKATHON 2025–2026")
    add_subtitle("Comprehensive Technical Project Proposal & Architectural Specification Report")

    # Project Metadata Box Table
    meta_headers = ["Metadata Field", "Official Submission Parameter Value"]
    meta_rows = [
        ["Problem Statement ID", "26094"],
        ["Problem Statement Title", "AI Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities"],
        ["Project Title / System Brand", "SAHARA (The Distress Monitoring System)"],
        ["Theme", "MedTech / BioTech / HealthTech"],
        ["PS Category", "Software"],
        ["Team Identification", "Team ID: 124874 | Team Name: LexorTek"],
        ["Target Ministry & Bodies", "Ministry of Social Justice & Empowerment (MoSJE), NHAA (14566), Tele-MANAS (14416)"],
        ["Technical Architecture Seam", "10-Step Ingestion Pipeline, Additive Linear Composite, Dual-Pass Interlock"],
        ["Repository & Live Prototype", "Next.js 15 App Router, TypeScript 5, Supabase PostgreSQL, Deployed & Live on Vercel"],
        ["Document Status", "Production Prototype & Formal Verification Dossier (Release v1.1.0)"]
    ]
    add_table_custom(meta_headers, meta_rows, [Inches(2.4), Inches(4.1)])

    add_slide_figure("slide_1.png", "Title Slide — Smart India Hackathon PS 26094 (Team LexorTek)")

    add_callout(
        "\"The AI does not decide. It decides who a human looks at next, and why.\"\n"
        "This single governing principle dictates every engineering decision in Project SAHARA. It establishes an uncompromised barrier between triage prioritization and clinical decision-making. The system ranks a counsellor's queue with mathematically inspectable justification, completely rejecting autonomous black-box outcomes.",
        "THE GOVERNING PRINCIPLE OF SAHARA",
        TEAL_HEX,
        CALLOUT_BG_HEX
    )

    doc.add_page_break()

    # =========================================================================
    # EXECUTIVE SUMMARY & PROBLEM CONTEXT (Matching Page 2 & LogicBase §1)
    # =========================================================================
    add_h1("1. Executive Summary & Problem Context")
    add_p("Under the mandate of the Ministry of Social Justice and Empowerment (MoSJE) and the statutory framework of the Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act, 1989 (amended 2015/2016), victims of caste-based atrocities are entitled to institutional protection, procedural justice, and rehabilitation relief. However, an acute and systemic gap persists in the post-registration ecosystem.")

    add_h2("1.1 The Post-Registration Wellbeing Vacuum")
    add_p("When an atrocity occurs and a First Information Report (FIR) is lodged, existing administrative and judicial mechanisms provide legal aid, police tracking, and statutory compensation instalments. Yet, between the day a formal complaint is registered and the day the trial ultimately resolves—a protracted interval frequently spanning two to five years—nobody is systematically monitoring the psychological wellbeing of the victim or their immediate family.")
    
    add_p("During this multi-year legal journey, victims encounter severe, compounding structural stressors:", bold_prefix="The Atrocity Trauma Lifecycle: ")
    add_bullet("Accused individuals securing bail and returning to the immediate village locality, instigating intense dread and immediate physical peril.", "Retaliation & Bail Shocks: ")
    add_bullet("Repeated, unpredictable court adjournments that wear down economic stamina and psychological fortitude.", "Systemic Trial Delays: ")
    add_bullet("Witness tampering, overt death threats, and social boycott by dominant agrarian or village factions.", "Intimidation & Harassment: ")
    add_bullet("Statutory compensation instalments stalled in bureaucratic pipelines, compounding wage loss and medical indebtedness.", "Economic Asphyxiation: ")

    add_callout(
        "Current institutional mechanisms track that an FIR was lodged, that an adjournment was granted, or that a helpline was dialed. Nothing connects these docket milestones to whether a human being is surviving the ordeal. Project SAHARA provides this missing, longitudinal wellbeing monitoring layer.",
        "THE SYSTEMIC DEFICIT",
        TEAL_HEX,
        CALLOUT_BG_HEX
    )

    add_h2("1.2 Why Conventional AI and Mental Health Chatbots Fail Disastrously")
    add_p("Standard engineering approaches to mental health monitoring typically propose generative conversational agents or multi-modal emotion-recognition deep learning networks. In the high-stakes, vulnerable context of atrocity survivors, these conventional paradigms fail across three disqualifying dimensions:")
    add_bullet("Acoustic emotion inference models degrade catastrophically when applied across regional Indian dialects, accented speech, low-cost feature phone microphones, and compressed telephony lines. They systematically yield the highest error rates precisely for rural, marginalized, and lower-caste citizens—inverting the principle of technological equity.", "1. Acoustic Bias & Dialect Fragility: ")
    add_bullet("In psychiatric screening, acute crisis events (such as imminent suicidality or severe panic) possess a low base rate (~0.5%). Complex neural networks optimized for overall accuracy tend to either over-flag benign variance (inducing total alert fatigue for staff) or catastrophically miss nuanced, stoic cries for help.", "2. The Base-Rate Screening Dilemma: ")
    add_bullet("Black-box neural networks cannot provide an inspectable, defensible audit trail. When an alert escalates to an administrative officer or emergency counsellor, bolting on post-hoc explanation machinery (such as SHAP or LIME) is legally and operationally unviable.", "3. Opacity and Liability: ")

    doc.add_page_break()

    # =========================================================================
    # SYSTEM OVERVIEW & CORE INNOVATIONS (Matching Page 2 of PDF)
    # =========================================================================
    add_h1("2. System Overview & Core Innovations")
    add_p("Project SAHARA (The Distress Monitoring System) is an explainable-by-construction, multi-modal distress prediction and triage infrastructure designed specifically for victims of atrocities and vulnerable witnesses.")

    add_slide_figure("slide_2.png", "System Architecture & Core Innovation — Idea Overview (Page 2 of PDF)")

    add_h2("2.1 The Core Insight: S3 Case Context Dominance")
    add_p("The foundational breakthrough of SAHARA lies in recognizing that psychological distress among atrocity victims is not an ungrounded sentiment floating in abstract speech. It is driven by concrete, system-side milestones that are deterministically knowable from court calendars and case files. Rather than guessing emotions through brittle Natural Language Processing (NLP) or voice acoustics, SAHARA queries verifiable legal dockets:")
    add_bullet("Is there a court hearing scheduled within the upcoming 7 days?", "Calendar Shocks: ")
    add_bullet("Has the accused been released on bail?", "Threat Milestones: ")
    add_bullet("How many court adjournments have occurred (cumulative delay)?", "Trial Friction: ")
    add_bullet("Is the statutory compensation instalment overdue by more than 30 days?", "Economic Distress: ")
    add_bullet("Has a formal police complaint of witness intimidation been recorded within the last 14 days?", "Physical Peril: ")

    add_p("This is the S3 Case-Context Signal. It requires zero NLP, zero acoustic analysis, zero model inference, and zero training data. It is computable via an instantaneous database query, immune to dialect bias, and 100% explainable to any judicial officer or social worker.", bold_prefix="The Competitive Moat: ")

    add_h2("2.2 Multi-Modal Ingestion for Low-Literacy & Feature Phone Populations")
    add_p("Marginalized victims cannot be expected to download complex smartphone applications, register user accounts, or navigate English-dominated graphical interfaces. SAHARA implements a single, unified intake pipeline across three accessible modalities:")
    add_bullet("A responsive, lightweight mobile interface optimized for low-bandwidth 2G/3G connections, supporting Devanagari Hindi and English with high-contrast, accessible typography.", "1. Web Check-In (/checkin): ")
    add_bullet("An in-browser voice interface powered by browser speech synthesis and recognition, simulating an interactive telephone call. Callers can simply listen and speak naturally.", "2. Simulated Voice IVRS (/call): ")
    add_bullet("Users can interact entirely using standard telephone keypad digits (DTMF). Pressing '0' at any point triggers an unconditional, instantaneous emergency breakout to human hotlines.", "3. Keypad & DTMF Fallback: ")

    add_h2("2.3 Dynamic Baselines: Expressive vs. Stoic Persona Modeling")
    add_p("In clinical psychology, a static, population-wide distress threshold is deeply flawed. A demonstrative individual may frequently use expressive language without being in acute danger. Conversely, a deeply stoic individual who typically reports minimal emotion may experience a minor numerical score increase that represents severe, life-threatening decompensation.")
    add_p("SAHARA solves this by maintaining a personal, running Exponentially Weighted Moving Average (EWMA) baseline for every individual. Alerts are triggered by calculating a z-score against the victim's own historical variance. A sudden intra-individual shift fires an immediate change-point alert, ensuring stoic victims are never ignored.", bold_prefix="Sudden-Shift Detection: ")

    add_h2("2.4 Deterministic Safety Interlocks: Code Guarantees Over Neural Prompts")
    add_p("In Project SAHARA, crisis detection never relies on an LLM prompt. A system prompt is merely a request that can fail under adversarial input, dialect code-switching, or provider model drift. In contrast, a compiled regular expression running against a curated crisis lexicon is an ironclad guarantee. SAHARA executes deterministic regex matching before any AI model is contacted.", bold_prefix="Guaranteed Interlock: ")

    doc.add_page_break()

    # =========================================================================
    # TECHNICAL APPROACH & METHODOLOGY (Matching Page 3 of PDF)
    # =========================================================================
    add_h1("3. Technical Approach & Ingestion Pipeline")
    add_p("Project SAHARA is architected around a strict, deterministic, 10-step check-in pipeline executing over a modern, secure serverless infrastructure.")

    add_slide_figure("slide_3.png", "Technical Approach, Methodology & Ingestion Pipeline (Page 3 of PDF)")

    add_h2("3.1 Technology Stack & Infrastructure Architecture")
    tech_headers = ["Layer", "Technology Component", "Architectural Role & Security Specification"]
    tech_rows = [
        ["Framework & Runtime", "Next.js 15 (App Router) + TypeScript 5", "React Server Components, edge-ready API handlers, strict zero-any typing"],
        ["Database & Security", "Supabase (PostgreSQL 15)", "Row-Level Security (RLS) enabled on all tables; zero public access policies; server-only service-role access"],
        ["LLM Provider Engine", "OpenAI-Compatible Swappable Adapter", "Unified in lib/llm/index.ts; hot-swappable via environment variables (Groq, Gemini, OpenRouter, Ollama)"],
        ["Voice & IVRS Layer", "Web Speech API (Synthesis & Recognition)", "Simulated client-side telephone IVRS; zero telecom carrier license required for local/state pilot"],
        ["Policy Governance", "Versioned Policy Engine (policy/v1.yaml)", "Declarative YAML tier thresholds, EWMA parameters, and SLA definitions validated by Zod"],
        ["Data Contracts", "Zod v4 Schemas (types/contract.ts)", "Frozen, runtime-enforced API wire contracts for check-ins, assessments, and alerts"]
    ]
    add_table_custom(tech_headers, tech_rows, [Inches(1.8), Inches(2.2), Inches(2.5)])

    add_h2("3.2 The 10-Step Unified Pipeline Execution Flow")
    add_p("Every interaction—whether originating from text chat, voice call, or simulated IVRS—routes through a single, hardened ingestion endpoint (POST /api/checkin). The pipeline executes sequentially:")
    
    steps = [
        ("Step 1: Zod Contract Validation", "The incoming HTTP payload is parsed against strict Zod runtime schemas (types/contract.ts). Malformed payloads or untyped structures are immediately rejected with a 400 Bad Request, guaranteeing type safety downstream."),
        ("Step 2: Consent Gate Verification", "The system verifies whether an active, unwithdrawn consent record exists for the subject ID. If consent is absent or revoked, the handler terminates with HTTP 403 Forbidden. Exactly zero database writes or scoring calculations occur."),
        ("Step 3: Minor Protection Check", "If the subject's record contains the is_minor_flag indicator, automated distress scoring is completely bypassed. The session is immediately routed to a designated human child-protection caseworker, adhering strictly to DPDP statutory limits."),
        ("Step 4: Pass 1 Safety Interlock", "The normalized user input transcript is scanned against a deterministic regex lexicon. If an emergency crisis keyword (self-harm, acute violence, direct plea) is matched, the system immediately forces the CRITICAL tier, renders emergency hotlines, and bypasses LLM invocation entirely."),
        ("Step 5: Boxed LLM Invocation", "If no crisis is detected, an OpenAI-compatible adapter calls a tightly constrained language model. The model is permitted only to generate a single empathetic acknowledgment sentence, ask exactly one follow-up question, and extract the S2 linguistic distress score (0–100)."),
        ("Step 6: Pass 2 Safety Interlock", "Before the LLM's generated response is transmitted to the user, it is vetted by a secondary regex filter. The system aggressively strips out medical diagnoses, prescriptive advice, outcome promises, and false reassurance, substituting static human-authored copy if violated."),
        ("Step 7: Scoring Engine & Renormalisation", "The engine compiles the five individual signals (S1 through S5). If self-report (S1) or linguistic (S2) signals are missing, the system dynamically renormalises remaining weights so their sum equals 1.0, ensuring missing data does not mimic calm."),
        ("Step 8: Dynamic EWMA Baseline & z-Score", "The composite score is evaluated against the victim's historical running mean and standard deviation. Crucially, the z-score is computed prior to updating the baseline, and a change-point flag is raised if z > 2.0 with at least two prior check-ins."),
        ("Step 9: Policy Engine YAML Evaluation", "The policy engine evaluates declarative rules top-to-bottom from policy/v1.yaml, assigning a triage tier: GREEN, AMBER, RED, or CRITICAL. Deterministic safety triggers serve as an absolute floor."),
        ("Step 10: Persistence, Audit & Alert Dispatch", "The check-in transcript, component snapshot, composite score, and policy tier are immutably written to Supabase. If the tier is RED or CRITICAL, an urgent alert record is generated with a mandatory human SLA timer.")
    ]
    for step_title, step_desc in steps:
        add_bullet(step_desc, f"{step_title}: ")

    doc.add_page_break()

    # =========================================================================
    # MATHEMATICAL FORMULATIONS & ENGINE SPECIFICATIONS
    # =========================================================================
    add_h1("4. Mathematical Engine Specifications")
    add_p("The core of Project SAHARA's defensibility before judicial and administrative scrutiny is its transparent mathematical foundation.")

    add_h2("4.1 The Additive Linear Composite Formula")
    add_callout(
        "Composite = 0.35 · S1 + 0.25 · S2 + 0.25 · S3 + 0.15 · S4 + 0.00 · S5\n"
        "Where:\n"
        "• S1 = Self-Report Signal (0–100, Weight: 0.35)\n"
        "• S2 = Linguistic Distress Signal (0–100, Weight: 0.25)\n"
        "• S3 = Case Context Signal (0–100, Weight: 0.25)\n"
        "• S4 = Engagement & Interaction Signal (0–100, Weight: 0.15)\n"
        "• S5 = Acoustic Paralinguistic Signal (0–100, Weight: 0.00 — Deliberately Unweighted)",
        "THE LINEAR COMPOSITE DISTRESS FORMULA",
        TEAL_HEX,
        CALLOUT_BG_HEX
    )

    add_h3("Why S5 (Acoustic Paralinguistics) is Weighted Exactly 0.00")
    add_p("In policy/v1.yaml, the weight of S5 is hardcoded to 0.00 and validated by a Zod literal(0) assertion. While acoustic features (pitch variability, speech rate deviation, pause duration) are calculated and displayed on the counsellor's screen labelled 'Low Confidence Context', they contribute zero points to the composite score.")
    add_p("This is an intentional ethical and scientific decision: speech emotion recognition exhibits massive variance across regional dialects, gender registers, and low-cost telephony compression. Giving it numerical weight would penalize rural and marginalized callers with systematic scoring errors.", italic=True)

    add_h2("4.2 S3 Case-Context Rubric Specification")
    add_p("The S3 signal represents the cumulative systemic pressure exerted on the victim by the judicial and administrative process. It is computed as:")
    add_p("S3 = min(100, Σ Applicable Condition Points)", italic=True)

    s3_headers = ["ID", "Case Context Condition", "Points", "Nature", "Clinical & Administrative Rationale"]
    s3_rows = [
        ["R1", "Intimidation report filed within last 14 days", "+25", "Time-Windowed", "Acute pre-crisis indicator; immediate threat of physical retaliation"],
        ["R2", "Accused perpetrator released on bail", "+20", "Static", "Concrete fear of reprisal in localized village / community geography"],
        ["R3", "Next court hearing scheduled within 7 days", "+15", "Time-Windowed", "Anticipatory anxiety, fear of confronting accused in court session"],
        ["R4", "Statutory relief compensation overdue > 30 days", "+15", "Static", "Severe economic hardship, lost wages, and debt accumulation"],
        ["R5", "Court adjournment count ≥ 3", "+10", "Static", "Prolonged trial friction, systemic fatigue, and judicial disillusionment"],
        ["R6", "Social boycott / caste ostracism flag active", "+10", "Static", "Community isolation, denial of water/employment resources"],
        ["R7", "Case open duration > 365 days", "+5", "Static", "Chronic psychological attrition and prolonged institutional wear"]
    ]
    add_table_custom(s3_headers, s3_rows, [Inches(0.5), Inches(2.5), Inches(0.7), Inches(1.1), Inches(1.7)])

    add_p("Notice that Row 1 (+25) and Row 3 (+15) are time-windowed: they dynamically activate and deactivate as the calendar advances, allowing the system to detect impending court distress without requiring the victim to verbalize it.", bold_prefix="Calendar Sensitivity: ")

    add_h2("4.3 Missing-Signal Renormalisation")
    add_p("A critical vulnerability in automated triage systems is treating missing responses as calm indicators (defaulting missing variables to 0). In atrocity contexts, a victim abruptly going silent often indicates acute fear, phone confiscation, or intimidation.")
    add_p("When optional signals (S1 or S2) are null, SAHARA renormalises the remaining active weights so they sum to 1.0:")
    add_callout(
        "W_effective,k = W_k / ( Σ W_j  for j in Present_Signals )\n"
        "Composite = Σ ( W_effective,k · S_k )\n\n"
        "Example: If S2 (linguistic) is null due to LLM provider timeout:\n"
        "Denominator = 0.35 (S1) + 0.25 (S3) + 0.15 (S4) = 0.75\n"
        "• S1 Effective Weight = 0.35 / 0.75 = 0.4667\n"
        "• S3 Effective Weight = 0.25 / 0.75 = 0.3333\n"
        "• S4 Effective Weight = 0.15 / 0.75 = 0.2000",
        "DYNAMIC WEIGHT RENORMALISATION",
        TEAL_HEX,
        CALLOUT_BG_HEX
    )

    add_h2("4.4 EWMA Baseline Equations & Strict Order of Operations")
    add_p("To detect subtle shifts in reserved individuals, SAHARA tracks an individual Exponentially Weighted Moving Average (EWMA) baseline with parameters defined in policy/v1.yaml (smoothing factor λ = 0.3, noise floor σ_floor = 8.0).")
    
    add_p("Crucially, to prevent absorbing current distress into the baseline before assessing anomaly severity, the z-score is computed strictly before updating running parameters:", bold_prefix="Strict Order of Execution: ")
    add_bullet("z_t = ( x_t − μ_{t-1} ) / max( σ_{t-1}, 8.0 )", "1. Compute z-Score: ")
    add_bullet("μ_t = 0.3 · x_t + 0.7 · μ_{t-1}", "2. Update Running Mean: ")
    add_bullet("σ²_t = 0.3 · ( x_t − μ_{t-1} )² + 0.7 · σ²_{t-1}", "3. Update Running Variance: ")
    add_bullet("Change Point Triggered = ( z_t > 2.0 ) AND ( checkin_count ≥ 2 )", "4. Anomaly Evaluation: ")

    doc.add_page_break()

    # =========================================================================
    # FEASIBILITY, VIABILITY & OPERATIONAL ENGINEERING (Matching Page 4 of PDF)
    # =========================================================================
    add_h1("5. Feasibility, Viability & Operational Engineering")
    add_p("A technological innovation for public welfare must be rigorously viable within the fiscal, administrative, and operational constraints of Indian state machinery.")

    add_slide_figure("slide_4.png", "Feasibility, Viability & Challenge Matrix (Page 4 of PDF)")

    add_h2("5.1 Three Pillars of Operational Feasibility")
    add_bullet("The entire backend executes on serverless, auto-scaling cloud compute (Next.js Edge + Supabase). It requires zero on-premise servers, zero specialized GPU clusters for training, and zero telecom carrier licensing for deployment.", "1. Managed Infrastructure: ")
    add_bullet("Distress prediction is driven by ultra-fast arithmetic and deterministic logic (<50ms execution). The single narrow LLM call is isolated and fully bypassable.", "2. Arithmetic Scoring: ")
    add_bullet("The data model directly ingests existing case records from the National Helpline Against Atrocities (NHAA - 14566), the MoSJE Integrated Welfare Portal, and district e-Courts dockets.", "3. Institutional Integration: ")

    add_h2("5.2 Comprehensive Challenge vs. Operational Solution Matrix")
    add_p("The table below details how Project SAHARA addresses the six fundamental failure points identified in public-sector mental health deployments:")

    matrix_headers = ["Identified Challenge", "Operational Failure Mode", "SAHARA Architectural Solution"]
    matrix_rows = [
        [
            "1. Dialect Unreliability",
            "Speech recognition degrades severely across rural Indian dialects, misinterpreting distress.",
            "Multi-modal fallback: Voice is only 1 of 5 signals. A keypad/text path always exists. Acoustic emotion (S5) is deliberately weighted 0.00."
        ],
        [
            "2. Digital Illiteracy & Distrust",
            "Victims struggle with complex app downloads, passwords, and digital authentication.",
            "Zero-friction access: Voice + DTMF keypad intake. No app install, no user account, no login. Zero literacy required to complete check-in."
        ],
        [
            "3. Over-Reliance on AI Scores",
            "Automated algorithms make erroneous medical or legal decisions, creating liability.",
            "System prioritises, it never decides: Only a licensed human counsellor closes a critical alert. Model may elevate tiers, never downgrade."
        ],
        [
            "4. Silent Alert Failures",
            "High-risk alerts disappear into unread email queues or spam filters without verification.",
            "Mandatory ACK Delivery: Every RED and CRITICAL alert enforces a strict SLA countdown. Daily reconciliation asserts human disposition."
        ],
        [
            "5. Highly Sensitive Data Leaks",
            "Mental health records subpoenaed by hostile parties or leaked to local police.",
            "Zero-PII Architecture: Only synthetic pseudonyms (A-XXXX) stored. Full Row-Level Security. Distress data is air-gapped from police."
        ],
        [
            "6. Counsellor Capacity Burnout",
            "Staff overwhelmed by dense clinical transcripts, abandoning the system within weeks.",
            "Designed for 30-Second Triage: Additive component charts explain why an alert fired in under 5 seconds. Clear disposition buttons."
        ]
    ]
    add_table_custom(matrix_headers, matrix_rows, [Inches(1.8), Inches(2.2), Inches(2.5)])

    add_h2("5.3 The 30-Second Triage Protocol & Staff Workflow")
    add_p("If disposition of an alert takes three minutes of reading transcripts, the system will be abandoned by overworked district counsellors within three weeks. SAHARA is explicitly designed for a 30-second triage loop:")
    add_bullet("Triage queue sorts victims by urgency: CRITICAL (Immediate), RED (30-minute SLA), AMBER (24-hour SLA), GREEN (7-day routine).", "1. Instant Queue Sorting: ")
    add_bullet("The counsellor opens the person record and instantly views the additive bar chart showing the exact numerical contribution of S1, S2, S3, and S4.", "2. 5-Second Breakdown: ")
    add_bullet("The counsellor clicks 'Acknowledge', enters their handle, and logs an action disposition ('Contacted', 'Referred to Legal Aid', 'Escalated to Emergency Services').", "3. One-Click Disposition: ")

    doc.add_page_break()

    # =========================================================================
    # IMPACT ASSESSMENT & TRIPLE-BOTTOM-LINE BENEFITS (Matching Page 5 of PDF)
    # =========================================================================
    add_h1("6. Impact Assessment, Benefits & Boundaries")
    add_p("Project SAHARA delivers transformative outcomes across social, economic, and administrative dimensions while upholding rigorous ethical boundaries.")

    add_slide_figure("slide_5.png", "Impact, Triple-Bottom-Line Benefits & Limitations (Page 5 of PDF)")

    add_h2("6.1 Vulnerable Target Populations Served")
    add_bullet("Survivors of heinous caste-based sexual atrocities requiring immediate, trauma-informed psychological protection and witness escort.", "1. Victims of Rape & Gang Rape: ")
    add_bullet("Surviving kin and dependents facing catastrophic bereavement, economic shock, and structural terror.", "2. Murder, Grievous Hurt & Arson: ")
    add_bullet("Key prosecution witnesses under severe village-level intimidation and coercion to turn hostile.", "3. Protected Witnesses: ")
    add_bullet("Entire families displaced by organized caste violence and systemic land dispossessions.", "4. Displaced Vulnerable Families: ")

    add_h2("6.2 Paradigm Shift: Proactive Pre-Crisis Intervention")
    add_p("Traditional helpline services operate purely reactively: they wait for a victim to reach a catastrophic crisis point before offering a suicide hotline. SAHARA fundamentally reverses this timeline.")
    add_callout(
        "Support arrives BEFORE the crisis point and around the moments that predictably hurt — hearing dates, adjournments, bail decisions, and delayed relief compensation.",
        "THE PROACTIVE INTERVENTION PARADIGM",
        TEAL_HEX,
        CALLOUT_BG_HEX
    )

    add_h2("6.3 Triple-Bottom-Line Benefits Matrix")
    benefit_headers = ["Impact Domain", "Measurable Systemic Benefit", "Target Outcome Benchmark"]
    benefit_rows = [
        [
            "Social Impact",
            "• Continuous wellbeing monitoring where zero existed.\n• Restores victim trust and dignity in the judicial process.\n• Prevents witness hostility and case abandonment.",
            ">40% reduction in victim withdrawal from atrocity trials; enhanced perceived procedural justice."
        ],
        [
            "Economic Impact",
            "• Early intervention costs a fraction of emergency medical hospitalization.\n• Identifies statutory compensation delays as a measurable, actionable stressor.",
            "Unblocks delayed relief disbursements; minimizes catastrophic out-of-pocket crisis expenditures."
        ],
        [
            "Administrative Impact",
            "• District, State, and National macro-visibility into vulnerable case caseloads.\n• Evidence-based allocation of scarce counsellor hours.\n• Synchronized coordination between welfare, counselling, and legal aid.",
            "Eliminates subjective triage guesswork; enforces 100% accountability on high-risk cases."
        ]
    ]
    add_table_custom(benefit_headers, benefit_rows, [Inches(1.5), Inches(3.2), Inches(1.8)])

    add_h2("6.4 Transparent System Limitations & Boundary Conditions")
    add_p("To maintain ethical integrity, SAHARA explicitly declares its technical boundaries:")
    add_bullet("The natural language models and speech synthesis are currently validated for Hindi and English. Expanding to additional regional languages is scheduled for Phase 2.", "1. Language Envelope: ")
    add_bullet("Acoustic emotion recognition varies across rural accents and is strictly displayed as low-confidence context; it never alters scores.", "2. Speech Recognition Limits: ")
    add_bullet("SAHARA is a triage prioritization tool, not a diagnostic engine. It does not output DSM-5 or ICD-11 psychiatric diagnoses.", "3. Non-Diagnostic Boundary: ")

    doc.add_page_break()

    # =========================================================================
    # RESEARCH FOUNDATIONS, STATUTORY BASIS & ETHICS (Matching Page 6 of PDF)
    # =========================================================================
    add_h1("7. Research Foundations, Statutory Grounding & Ethics")
    add_p("Project SAHARA is anchored in established Indian statutory law, national welfare helplines, and statistical methodology.")

    add_slide_figure("slide_6.png", "Research Grounding, References & Ethical Framework (Page 6 of PDF)")

    add_h2("7.1 Statutory & Legislative Framework")
    add_bullet("Governs state obligations for victim protection, relief compensation disbursal schedules, and special court infrastructure.", "• SC/ST (Prevention of Atrocities) Act, 1989 & 2016 Rules: ")
    add_bullet("Strict penal prohibition against disclosing the identity of victims of sexual offenses in any public, digital, or judicial record. SAHARA enforces this via synthetic pseudonyms.", "• Section 228A IPC / Section 72 Bharatiya Nyaya Sanhita (BNS): ")
    add_bullet("Mandates consent-first processing, clear purpose limitation, right to withdrawal, and enhanced safeguards for minors.", "• Digital Personal Data Protection (DPDP) Act, 2023: ")

    add_h2("7.2 National Programme & Welfare Alignment")
    add_bullet("Operational 24x7 toll-free helpline providing immediate assistance against atrocities. SAHARA is architected to feed directly into NHAA triage queues.", "• NHAA (14566) — National Helpline Against Atrocities: ")
    add_bullet("National Tele-Mental Health Programme under the Ministry of Health & Family Welfare. SAHARA routes CRITICAL cases directly to Tele-MANAS counsellors.", "• Tele-MANAS (14416 / 1800-89-14416): ")
    add_bullet("National repository tracking FIR filing, charge-sheeting, and compensation payment stages.", "• MoSJE Integrated Welfare Portal: ")
    add_bullet("National benchmarks documenting rising atrocity crime rates, conviction bottlenecks, and trial pendency.", "• NCRB 'Crime in India' Annual Statistics: ")

    add_h2("7.3 Methodological & Scientific Grounding")
    add_bullet("Originating in statistical process control, EWMA provides an optimal recursive filter for detecting subtle shifts in noisy, longitudinal behavioral data.", "• Exponentially Weighted Moving Averages (EWMA): ")
    add_bullet("Statistical tests identify when an individual's observation deviates significantly from their personal distribution (z > 2.0).", "• Change-Point Anomaly Detection: ")
    add_bullet("In low base-rate crisis scenarios (~0.5%), reporting raw 'accuracy' is mathematically deceptive (a trivial model predicting 'all fine' achieves 99.5% accuracy). SAHARA measures recall on seeded crisis cases.", "• The Base-Rate Problem in Rare-Event Screening: ")

    add_h2("7.4 Custom Dataset & Synthetic Ethics Commitment")
    add_callout(
        "NO REAL VICTIM DATA WAS USED AT ANY POINT.\n"
        "THE DISTRESS CORPUS IS 100% SYNTHETIC.\n\n"
        "Real victim data cannot ethically be utilized for software prototype development or model tuning. Public court dockets were referenced solely to extract a de-identified taxonomy of legal stages and stressor categories. All test personas, transcripts, and evaluation sets are synthetic, ensuring zero privacy exposure.",
        "ETHICAL RESEARCH COMMITMENT",
        ALERT_RED_BORDER,
        ALERT_RED_BG
    )

    doc.add_page_break()

    # =========================================================================
    # GOLDEN PATH WORKED CASE STUDY: PERSONA A-4471
    # =========================================================================
    add_h1("8. Empirical Verification: Persona A-4471 Case Study")
    add_p("To demonstrate the exact numerical behavior of the pipeline under real-world conditions, consider the verified 'Golden Path' persona, A-4471.")

    add_h2("8.1 Persona Profile & Standing Legal Stressors")
    add_p("Persona A-4471 is an atrocity victim involved in a protracted land dispossession case currently in the trial stage. Her case context profile exhibits 50 points of standing institutional pressure:")
    add_bullet("Accused perpetrator released on bail: +20 points", "• Standing Stressor 1: ")
    add_bullet("Statutory relief compensation 62 days overdue: +15 points", "• Standing Stressor 2: ")
    add_bullet("Four trial adjournments recorded (≥ 3): +10 points", "• Standing Stressor 3: ")
    add_bullet("Case open duration 400 days (> 365 days): +5 points", "• Standing Stressor 4: ")
    add_p("Standing S3 Context Points = 20 + 15 + 10 + 5 = 50 points. This is deliberately held below the s3_gte: 60 escalation threshold.", italic=True)

    add_h2("8.2 Chronological Check-In Progression")
    gp_headers = ["Timeline Day", "S3 Context", "Composite", "Baseline Mean (μ)", "Baseline Variance (σ²)", "z-Score", "Assigned Tier"]
    gp_rows = [
        ["Day -3", "50", "28.00", "28.00", "0.00", "Undefined", "GREEN"],
        ["Day -2", "50", "31.00", "28.90", "2.70 (σ=1.64→8.0)", "0.375", "GREEN"],
        ["Day -1", "—", "—", "—", "—", "—", "Intimidation report filed; Hearing in 6 days"],
        ["Day 0 (Live)", "90", "53.75", "36.35", "53.30", "3.11", "RED (Change Point)"]
    ]
    add_table_custom(gp_headers, gp_rows, [Inches(1.1), Inches(0.9), Inches(0.9), Inches(1.1), Inches(1.2), Inches(0.8), Inches(1.2)])

    add_h2("8.3 Day 0 Detailed Numerical Decomposition")
    add_p("On Day 0, the victim checks in. S1 moves mildly (50), S2 shows moderate distress (55), and S4 is 0. However, S3 has exploded from 50 to 90 due to the intimidation report (+25) and the court hearing entering the 7-day window (+15):")
    
    decomp_headers = ["Component", "Raw Signal Value (0–100)", "Signal Weight", "Weighted Contribution to Composite"]
    decomp_rows = [
        ["S3 Case Context", "90.0", "0.25", "22.50  (Largest Contributor)"],
        ["S1 Self-Report", "50.0", "0.35", "17.50"],
        ["S2 Linguistic Distress", "55.0", "0.25", "13.75"],
        ["S4 Engagement / Dropoff", "0.0", "0.15", "0.00"],
        ["S5 Acoustic Emotion", "Displayed", "0.00", "0.00  (Deliberately Pinned)"],
        ["Total Composite Score", "—", "1.00", "53.75"]
    ]
    add_table_custom(decomp_headers, decomp_rows, [Inches(2.0), Inches(1.5), Inches(1.2), Inches(1.8)])

    add_h3("The Three Definitive Demonstrations Proven by These Numbers:")
    add_bullet("While her self-report and language showed only moderate distress, the dominant mover was the court calendar and police docket. The case file did the heavy lifting.", "1. Case File Primacy: ")
    add_bullet("An absolute score of 53.75 is well below standard population panic thresholds. It triggered RED because it is 3.11 standard deviations above her own baseline. A static system would have missed her entirely.", "2. Dynamic Sensitivity: ")
    add_bullet("Her trial is six days away, and her intimidation report was filed yesterday. SAHARA alerts the counsellor before the hearing, not after a tragedy occurs.", "3. Proactive Protection: ")

    doc.add_page_break()

    # =========================================================================
    # SYSTEM VERIFICATION & FUTURE ROADMAP
    # =========================================================================
    add_h1("9. System Verification & Implementation Status")
    add_p("Project SAHARA has undergone rigorous automated testing across contract boundaries, mathematical invariance, and safety interlocks.")

    add_h2("9.1 Automated Test Suite Results")
    test_headers = ["Test Suite Category", "Test Count", "Execution Engine", "Pass Rate & Status"]
    test_rows = [
        ["Contract & Schemas", "24 Tests", "Node.js Native Test Runner (tsx)", "100% Passed (Zod schema validation)"],
        ["Safety Lexicon Suite", "40 Tests", "Deterministic Regex Interlock", "100% Recall on seeded critical phrases"],
        ["Scoring & Math Engine", "38 Tests", "EWMA, z-score, renormalisation", "100% Passed (Zero tolerance drift)"],
        ["Policy Engine YAML", "18 Tests", "YAML rules, tier escalation", "100% Passed (Escalation monotonic)"],
        ["Pipeline Integration", "16 Tests", "End-to-End POST /api/checkin", "100% Passed (Zero PII leakage)"],
        ["Total Test Harness", "136 Tests", "Automated CI Pipeline Gate", "136 / 136 Passed (100%)"]
    ]
    add_table_custom(test_headers, test_rows, [Inches(1.8), Inches(1.2), Inches(2.0), Inches(1.5)])

    add_h2("9.2 Phased National Implementation Roadmap")
    add_bullet("Deploy SAHARA in 5 designated Special SC/ST Courts in high-caseload districts. Integrate simulated IVRS with local district legal aid authorities and NHAA (14566).", "Phase 1: District Pilot (Months 1–6): ")
    add_bullet("Incorporate India's national Bhashini language translation and speech recognition APIs to expand coverage across 10 major Indic languages. Synchronize with State Social Welfare Dashboards.", "Phase 2: State-Wide Rollout (Months 7–15): ")
    add_bullet("Full nationwide API integration with the Ministry of Social Justice & Empowerment (MoSJE) Integrated Portal and Tele-MANAS, establishing an automated, national distress safety net.", "Phase 3: National Scale (Months 16–24): ")

    add_h2("9.3 Conclusion & Final Recommendation")
    add_p("Project SAHARA addresses one of the most painful, neglected systemic voids in India's social justice machinery: the unmonitored psychological attrition of atrocity victims. By combining deterministic case-file signals, dynamic per-person baselines, and uncompromising two-pass safety interlocks, SAHARA delivers an explainable, equitable, and production-ready solution.")
    add_p("The system does not replace human care; it ensures that human care arrives precisely when and where it is needed most.", italic=True)

    # Save to workspace
    output_workspace_path = os.path.abspath("SAHARA_Project_Report_LexorTek.docx")
    doc.save(output_workspace_path)
    print(f"Report saved to workspace: {output_workspace_path}")

    # Also save directly to user's Downloads folder next to the PDF!
    downloads_path = r"C:\Users\somen\Downloads\SAHARA_Project_Report_LexorTek.docx"
    try:
        shutil.copyfile(output_workspace_path, downloads_path)
        print(f"Report also copied to Downloads: {downloads_path}")
    except Exception as e:
        print(f"Could not copy to Downloads: {e}")

    return output_workspace_path

if __name__ == "__main__":
    create_sahara_report()
