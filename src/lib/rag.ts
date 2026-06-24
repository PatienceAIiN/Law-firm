/**
 * RAG (Retrieval-Augmented Generation) utility
 * Uses TF-IDF cosine similarity for document retrieval without native dependencies.
 * Knowledge base covers Indian law topics + site content.
 */

export interface Document {
  id: string
  title: string
  content: string
  category: string
}

// ─── Indian Law Knowledge Base ────────────────────────────────────────────────
const KNOWLEDGE_BASE: Document[] = [
  // Constitutional Law
  {
    id: 'const-1',
    title: 'Fundamental Rights under Indian Constitution',
    category: 'Constitutional Law',
    content: `The Constitution of India guarantees Fundamental Rights under Part III (Articles 12-35). These include:
    Article 14: Right to Equality - No person shall be denied equality before law or equal protection of laws.
    Article 19: Right to Freedom - Six freedoms including speech, assembly, movement, residence, and profession.
    Article 21: Right to Life and Personal Liberty - No person shall be deprived of his life or personal liberty except according to procedure established by law.
    Article 21A: Right to Education - Free and compulsory education for children 6-14 years.
    Article 22: Protection against arbitrary arrest and detention.
    Article 23: Prohibition of traffic in human beings and forced labour.
    Article 32: Right to Constitutional Remedies - Right to move the Supreme Court for enforcement of Fundamental Rights.
    These rights are justiciable and can be enforced through writ petitions.`
  },
  {
    id: 'const-2',
    title: 'Directive Principles and Fundamental Duties',
    category: 'Constitutional Law',
    content: `Directive Principles of State Policy (Part IV, Articles 36-51) are non-justiciable guidelines for governance including equal pay, living wage, free legal aid, and uniform civil code.
    Fundamental Duties (Article 51A, Part IVA) were added by 42nd Amendment 1976. Citizens must respect the Constitution, national flag, anthem, promote harmony, protect environment, and develop scientific temper.
    Constitutional Amendment Procedure: Article 368 - Parliament can amend the Constitution but cannot alter the basic structure (Kesavananda Bharati case 1973).`
  },
  {
    id: 'const-3',
    title: 'Article 30 - Rights of Minorities to Establish and Administer Educational Institutions',
    category: 'Constitutional Law',
    content: `Article 30 of the Constitution of India gives all minorities, whether based on religion or language, the right to establish and administer educational institutions of their choice.
    Key points:
    - It protects minority educational institutions from discriminatory State action.
    - The right includes establishing, administering, and preserving the institution's character.
    - The State can regulate for academic excellence, discipline, and health standards, but cannot destroy the minority character of the institution.
    - Article 30(1) applies to both religious and linguistic minorities.
    - Article 30(2) prevents the State from discriminating in grant of aid simply because the institution is minority-run.
    Practical meaning: minorities can run schools and colleges and protect their educational and cultural rights, subject to reasonable regulation.`
  },
  // Criminal Law
  {
    id: 'crim-1',
    title: 'Bharatiya Nyaya Sanhita (BNS) - New Criminal Law',
    category: 'Criminal Law',
    content: `The Bharatiya Nyaya Sanhita (BNS) 2023 replaced the Indian Penal Code (IPC) 1860, effective July 1, 2024.
    Key changes: Terrorism defined, organized crime provisions, community service as punishment, petty crimes decriminalized.
    BNS 2023 has 358 sections vs IPC's 511.
    Murder (BNS Section 103): Death or life imprisonment + fine.
    Culpable homicide (BNS Section 104): Imprisonment up to 10 years.
    Rape (BNS Section 63): Minimum 10 years, max life imprisonment.
    Theft (BNS Section 303): Up to 3 years or fine.
    Cheating (BNS Section 318): Up to 3 years.
    The Bharatiya Nagarik Suraksha Sanhita (BNSS) replaced CrPC and Bharatiya Sakshya Adhiniyam replaced the Evidence Act.`
  },
  {
    id: 'crim-2',
    title: 'Bail Law in India',
    category: 'Criminal Law',
    content: `Bail in India is governed by BNSS 2023 (formerly CrPC).
    Bailable offence: Bail as a right (Section 478 BNSS).
    Non-bailable offence: Bail at court's discretion (Section 480 BNSS).
    Anticipatory bail (Section 482 BNSS): Applied when anticipating arrest. Sessions Court or High Court can grant it.
    Default bail (Section 479 BNSS): If police fail to file charge sheet within 60 days (non-bailable) or 90 days (offences with life imprisonment).
    Conditions for bail: Personal bond, surety, passport surrender, no travel abroad, no tampering with evidence.
    Bail can be cancelled if conditions violated or if accused tampers with witnesses.`
  },
  {
    id: 'crim-3',
    title: 'FIR and Criminal Procedure',
    category: 'Criminal Law',
    content: `FIR (First Information Report) is registered under Section 173 BNSS for cognizable offences.
    Zero FIR: Can be filed at any police station irrespective of jurisdiction.
    E-FIR: Available in many states online for cognizable offences.
    If police refuse to register FIR, complainant can approach Superintendent of Police or file complaint before Magistrate under Section 175 BNSS.
    Charge sheet must be filed within 60 days (non-bailable) or 90 days (for life imprisonment offences).
    Cognizable offences: Police can arrest without warrant (murder, rape, robbery, dacoity, kidnapping).
    Non-cognizable offences: Police need warrant (assault, cheating, defamation).`
  },
  // Family Law
  {
    id: 'fam-1',
    title: 'Hindu Marriage Act 1955 - Divorce and Matrimonial Rights',
    category: 'Family Law',
    content: `Hindu Marriage Act 1955 governs Hindu marriages including Sikhs, Jains, and Buddhists.
    Valid marriage conditions: Both parties Hindu, not within prohibited degree of relationship, bridegroom 21+ years, bride 18+ years.
    Divorce grounds (Section 13): Adultery, cruelty, desertion (2 years), conversion, unsound mind, leprosy, venereal disease, renunciation, not heard for 7 years.
    Mutual consent divorce (Section 13B): After 1 year of separation, petition jointly, 6-18 month cooling-off period.
    Supreme Court in Shilpa Sailesh (2023) held courts can waive cooling-off period under Article 142 if marriage is irretrievably broken.
    Maintenance (Section 24): Either spouse can claim maintenance during proceedings.
    Alimony (Section 25): Permanent alimony after divorce.
    Restitution of conjugal rights (Section 9): Court can order return to matrimonial home.`
  },
  {
    id: 'fam-2',
    title: 'Child Custody and Guardianship in India',
    category: 'Family Law',
    content: `Child custody in India governed by Guardians and Wards Act 1890 and personal laws.
    Types: Physical custody (who child lives with), Legal custody (decision-making rights).
    Paramount consideration: Welfare of the child (Section 17, Guardians and Wards Act).
    For Hindus: Hindu Minority and Guardianship Act 1956 - father is natural guardian, mother after father.
    For Muslims: Mother has hizanat (custody) for boys till 7 years, girls till puberty.
    Courts consider: Child's age, preference of older child, parent's financial capacity, moral character.
    Visitation rights given to non-custodial parent.
    International child abduction: India is not signatory to Hague Convention, but courts use best interest principle.`
  },
  {
    id: 'fam-3',
    title: 'Domestic Violence Law - PWDVA 2005',
    category: 'Family Law',
    content: `Protection of Women from Domestic Violence Act 2005 (PWDVA) provides civil remedies.
    Definition: Physical, sexual, verbal/emotional, economic abuse between domestic relationships.
    Who can file: Wife, female live-in partner, mother, sister, daughter in domestic relationship.
    Protection Order: Prohibits respondent from committing violence, contacting victim, entering workplace/home.
    Residence Order: Right to continue living in shared household.
    Monetary Relief: Compensation for injuries, medical expenses, loss of earnings.
    Custody Order: Temporary custody of children.
    Application to: Protection Officer, Magistrate, or police.
    Emergency Protection Order possible immediately.
    Violation of Protection Order is criminal offence (imprisonment up to 1 year).`
  },
  // Property Law
  {
    id: 'prop-1',
    title: 'Property Registration and Transfer in India',
    category: 'Property Law',
    content: `Registration Act 1908 governs property registration in India.
    Compulsory registration: Immovable property worth Rs 100+ must be registered (Section 17).
    Documents required: Sale deed, title documents, NOC from society, encumbrance certificate, property tax receipts.
    Stamp duty: Varies by state (5-8% of property value); women buyers get concession in many states.
    Transfer of Property Act 1882: Governs sale, mortgage, lease, exchange, gift of property.
    Sale deed: Transfer of ownership; must be registered.
    Gift deed: Transfer without consideration; must be registered for immovable property.
    Will: Movable/immovable property; Hindus follow Hindu Succession Act 1956; no registration required but advisable.
    Power of Attorney: General or Special; must be notarized; cannot transfer property by itself.`
  },
  {
    id: 'prop-2',
    title: 'RERA - Real Estate Regulation and Development Act 2016',
    category: 'Property Law',
    content: `Real Estate (Regulation and Development) Act 2016 (RERA) protects homebuyers.
    Mandatory registration of projects with RERA authority before advertising/booking.
    Developers must keep 70% of buyer funds in escrow for construction.
    Buyers can withdraw from project and get refund with interest if developer delays.
    Carpet area must be clearly mentioned; no super built-up area sales.
    Defect liability: 5 years from possession for structural defects.
    Complaints: To respective state RERA authority; appeal to Appellate Tribunal.
    Penalty on developer: 10% of project cost for non-registration; imprisonment for repeat offences.
    Compensation for delayed possession at SBI's prime lending rate.`
  },
  {
    id: 'prop-3',
    title: 'Landlord-Tenant Laws in India',
    category: 'Property Law',
    content: `Rent control laws vary by state. Model Tenancy Act 2021 provides a framework.
    Tenancy agreement: Must be written and registered.
    Security deposit: Maximum 2 months rent for residential (Model Tenancy Act).
    Rent increase: Only as per agreement or rent authority order.
    Eviction grounds: Non-payment of rent, subletting without permission, misuse of property, bona fide requirement of landlord, structural renovation.
    Notice period for eviction: Usually 15-30 days for non-payment; 3 months for owner's use.
    Tenant cannot be forcibly evicted; only through court order.
    Leave and License Agreement (Maharashtra): Different from lease; easier termination; 11-month agreements common to avoid rent control.`
  },
  // Corporate Law
  {
    id: 'corp-1',
    title: 'Companies Act 2013 - Key Provisions',
    category: 'Corporate Law',
    content: `Companies Act 2013 governs all companies registered in India.
    Types of companies: Private Limited (min 2 directors, max 200 shareholders), Public Limited (min 3 directors, unlimited shareholders), OPC (One Person Company).
    Incorporation: File SPICe+ form on MCA portal; obtain DIN, DSC, PAN, TAN.
    Directors: Minimum 1 resident director (stayed 182+ days in India).
    Annual filings: Form AOC-4 (financial statements), Form MGT-7 (annual return) within 60 days of AGM.
    MCA21: Digital platform for all company registrations and filings.
    Section 8 Company: Non-profit organization.
    LLP (Limited Liability Partnership): Governed by LLP Act 2008; popular for professional firms.
    FDI: Governed by FEMA 1999 and RBI/DPIIT guidelines.`
  },
  {
    id: 'corp-2',
    title: 'GST and Taxation for Businesses',
    category: 'Corporate Law',
    content: `Goods and Services Tax (GST) is a unified indirect tax effective July 1, 2017.
    GST registration mandatory if turnover exceeds Rs 40 lakh (Rs 20 lakh for special category states) for supply of goods.
    GST rates: 0%, 5%, 12%, 18%, 28%.
    GSTIN: 15-digit unique identification number.
    Returns: GSTR-1 (monthly/quarterly outward supplies), GSTR-3B (monthly summary), GSTR-9 (annual return).
    Input Tax Credit (ITC): Can set off GST paid on purchases against GST collected on sales.
    Income Tax: Companies pay 22% (new regime) or 30% (old regime) + surcharge + cess.
    Startups: Section 80-IAC provides 100% deduction for 3 consecutive years out of 10.
    TDS (Tax Deducted at Source): Applicable on salaries, rent, professional fees, contracts.`
  },
  // Labour Law
  {
    id: 'lab-1',
    title: 'Labour Laws - Employment Rights in India',
    category: 'Labour Law',
    content: `Four Labour Codes consolidate 29 central labour laws:
    1. Code on Wages 2019: Minimum wage, timely payment.
    2. Industrial Relations Code 2020: Trade unions, strikes, lockouts.
    3. Social Security Code 2020: PF, ESI, gratuity, maternity benefit.
    4. Occupational Safety Code 2020: Working conditions.

    Minimum Wage Act: Varies by state and skill level; revised periodically.
    Gratuity: Payable after 5 years of continuous service; 15 days wages per year (max Rs 20 lakh).
    PF (Provident Fund): 12% of basic salary from employee + employer contribution.
    ESI (Employees' State Insurance): Medical and cash benefits; applicable for workers earning ≤ Rs 21,000/month.
    Maternity Benefit Act 2017: 26 weeks paid maternity leave for first 2 children.
    Sexual Harassment of Women at Workplace Act 2013 (POSH): Internal Complaints Committee mandatory for 10+ employees.`
  },
  // Consumer Law
  {
    id: 'cons-1',
    title: 'Consumer Protection Act 2019',
    category: 'Consumer Law',
    content: `Consumer Protection Act 2019 replaced the 1986 Act with stronger provisions.
    Consumer: Person who buys goods/services for personal use (not commercial resale).
    Deficiency in service: Fault, imperfection, inadequacy, or shortcoming.
    Defective goods: Manufacturing defect, design defect.
    Three-tier redressal: District Commission (up to Rs 1 crore), State Commission (Rs 1 crore - Rs 10 crore), National Commission (above Rs 10 crore).
    E-commerce provisions: Sellers on platforms are liable.
    Product liability: Manufacturer/seller liable for harm caused by defective product.
    Complaint limitation: 2 years from date of cause of action.
    Central Consumer Protection Authority (CCPA): Regulates misleading advertisements.
    Online dispute resolution: Provided under the Act.
    Unfair trade practices and restrictive trade practices are actionable.`
  },
  // Cyber Law
  {
    id: 'cyber-1',
    title: 'IT Act 2000 and Cyber Laws in India',
    category: 'Cyber Law',
    content: `Information Technology Act 2000 (amended 2008) is the primary cyber law.
    Cyber crimes: Hacking (Section 66), identity theft (Section 66C), phishing (Section 66D), cyber stalking (Section 66A struck down by SC), child pornography (Section 67B).
    Data protection: IT (Amendment) Act 2008 - Section 43A (compensation for data breach by body corporate), Section 72A (criminal liability for wrongful disclosure).
    Digital Personal Data Protection Act 2023 (DPDP Act): New comprehensive data protection law. Consent-based processing, data principal rights, Data Protection Board.
    Social media regulations: IT (Intermediary Guidelines) Rules 2021 - grievance officer, content takedown, traceability for significant social media intermediaries.
    Electronic signatures and contracts are legally valid under IT Act.
    Cybercrime reporting: www.cybercrime.gov.in or call 1930.`
  },
  // Writ Petitions
  {
    id: 'writ-1',
    title: 'Writs and PIL in India',
    category: 'Constitutional Remedies',
    content: `Five writs under Article 32 (Supreme Court) and Article 226 (High Court):
    1. Habeas Corpus: "Produce the body" - challenge unlawful detention. File before any HC or SC.
    2. Mandamus: "We command" - compel public authority to perform legal duty.
    3. Certiorari: Quash decision of inferior court/tribunal for jurisdictional error.
    4. Prohibition: Stop inferior court from exceeding jurisdiction.
    5. Quo Warranto: Challenge right of person to hold public office.

    Public Interest Litigation (PIL): Filed by any citizen for public interest under Article 32 or 226. Liberalized standing. Letter to Chief Justice can be treated as PIL.
    National Green Tribunal (NGT): Environmental matters.
    NHRC (National Human Rights Commission): Human rights violations.
    Limitation: Writs should be filed promptly; no strict limitation but delay can be a ground for dismissal.`
  },
  // Arbitration
  {
    id: 'arb-1',
    title: 'Arbitration and Alternative Dispute Resolution in India',
    category: 'ADR',
    content: `Arbitration and Conciliation Act 1996 (amended 2015, 2019, 2021) governs arbitration.
    Arbitration agreement: Written clause in contract or separate agreement.
    Domestic arbitration: Award must be made within 12 months (extendable to 18).
    International commercial arbitration: No timeline prescribed.
    Arbitral award: Enforceable as a decree of court.
    Appeal: Under Section 34 (setting aside) within 3 months; limited grounds.
    New Delhi International Arbitration Centre (NDIAC) and Mumbai Centre for International Arbitration (MCIA).
    Mediation Act 2023: Encourages pre-litigation mediation.
    Lok Adalat: Voluntary settlement; award is final and binding; no court fees; free service.
    MSME Disputes: Mandatory 45-day conciliation before arbitration.`
  },
  // Intellectual Property
  {
    id: 'ip-1',
    title: 'Intellectual Property Rights in India',
    category: 'Intellectual Property',
    content: `Patents: Controller General of Patents, Designs and Trade Marks (CGPDTM). Patent valid 20 years. Section 3(d) - no evergreening of pharmaceuticals.
    Trademarks: Trade Marks Act 1999. Registration valid 10 years, renewable. Madrid System for international registration.
    Copyright: Copyright Act 1957. No registration required; protection for life + 60 years.
    Designs: Designs Act 2000. Protection for 10+5 years.
    Geographical Indications (GI): GI Act 1999. Darjeeling Tea, Kanjeevaram Silk, Alphonso Mangoes.
    Trade Secrets: No specific legislation; protected through contracts and confidentiality agreements.
    India is signatory to TRIPS Agreement, Berne Convention, Paris Convention.
    National IPR Policy 2016: "Creative India; Innovative India" - streamline IP registration and enforcement.`
  },
  // Site-specific content
  {
    id: 'site-1',
    title: 'About This Law Firm',
    category: 'Firm Information',
    content: `We are a professional law firm providing expert legal services across multiple practice areas including Corporate Law, Criminal Defense, Family Law, Property Disputes, and Constitutional Law.
    Our team of experienced advocates provides personalized legal guidance with deep expertise in Indian law.
    We offer two consultation modes: In-Person at our office, and Virtual live video sessions hosted in our own secure meeting workspace.
    Our services: Legal consultation, case representation, contract drafting, legal advisory, court representation.
    Contact us through the website to book a priority consultation slot.`
  },
  {
    id: 'site-2',
    title: 'Consultation Booking Process',
    category: 'Firm Information',
    content: `To book a consultation with our law firm:
    1. Visit the Consultation page and open the booking modal.
    2. Select a date from the calendar.
    3. Choose your preferred meeting mode: In-Person or Virtual (live video).
    4. Select an available time slot.
    5. Fill in your details: Name, Email, Phone, Case Subject, and Brief.
    6. Submit the booking form inside the modal.
    A confirmation email will be sent to your email address with meeting details.
    For Virtual meetings, a secure live video link is auto-generated and sent by email.`
  },
  {
    id: 'site-3',
    title: 'Legal Services Offered',
    category: 'Firm Information',
    content: `Our law firm specializes in:
    Corporate Law & Compliance: Company incorporation, regulatory compliance, M&A, contracts, shareholder agreements.
    Criminal Defense: Bail applications, FIR quashing, trial representation, anticipatory bail.
    Family & Matrimonial: Divorce, child custody, maintenance, domestic violence cases, succession.
    Property Disputes: Title verification, RERA disputes, landlord-tenant issues, registration matters.
    Constitutional Matters: Writ petitions, PIL, fundamental rights enforcement.
    Labour & Employment: Employment contracts, wrongful termination, labour disputes.
    Consumer Protection: Consumer forum cases, e-commerce disputes.
    Intellectual Property: Patent, trademark, copyright registration and litigation.`
  }
]

// ─── TF-IDF Retrieval ─────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
}

function termFrequency(tokens: string[], term: string): number {
  const count = tokens.filter(t => t === term).length
  return count / tokens.length
}

function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dot = 0
  let magA = 0
  let magB = 0
  Array.from(vecA.entries()).forEach(([term, val]) => {
    dot += val * (vecB.get(term) || 0)
    magA += val * val
  })
  Array.from(vecB.values()).forEach((val) => {
    magB += val * val
  })
  if (magA === 0 || magB === 0) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

function buildTFVector(tokens: string[]): Map<string, number> {
  const unique = Array.from(new Set(tokens))
  const vec = new Map<string, number>()
  unique.forEach((term) => {
    vec.set(term, termFrequency(tokens, term))
  })
  return vec
}

export function retrieveRelevantDocs(query: string, topK = 3): Document[] {
  const queryTokens = tokenize(query)
  const queryVec = buildTFVector(queryTokens)

  const scored = KNOWLEDGE_BASE.map(doc => {
    const docTokens = tokenize(doc.title + ' ' + doc.content)
    const docVec = buildTFVector(docTokens)
    const score = cosineSimilarity(queryVec, docVec)
    return { doc, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(({ score }) => score > 0.001)
    .map(({ doc }) => doc)
}

export function buildSystemPrompt(retrievedDocs: Document[], siteData?: {
  firmName?: string
  tenantSlug?: string
  practiceAreas?: Array<{ title: string; description: string }>
  teamMembers?: Array<{ name: string; title: string; expertise?: string | null }>
  articles?: Array<{ title: string; excerpt?: string | null; slug?: string }>
  faqs?: Array<{ question: string; answer: string }>
  officeAddress?: string
  officePhone?: string
  officeEmail?: string
}): string {
  const context = retrievedDocs.length > 0
    ? retrievedDocs.map(d => `[${d.category}] ${d.title}:\n${d.content}`).join('\n\n---\n\n')
    : 'No specific context retrieved.'

  let siteContext = ''
  if (siteData) {
    const parts: string[] = []
    if (siteData.firmName) parts.push(`Firm Name: ${siteData.firmName}`)
    if (siteData.officeAddress) parts.push(`Office Address: ${siteData.officeAddress}`)
    if (siteData.officePhone) parts.push(`Phone: ${siteData.officePhone}`)
    if (siteData.officeEmail) parts.push(`Email: ${siteData.officeEmail}`)
    if (siteData.practiceAreas?.length) {
      parts.push(`Practice Areas: ${siteData.practiceAreas.map(p => p.title).join(', ')}`)
      siteData.practiceAreas.forEach(p => parts.push(`  • ${p.title}: ${p.description}`))
    }
    if (siteData.teamMembers?.length) {
      parts.push(`Legal Team:`)
      siteData.teamMembers.forEach(m => parts.push(`  • ${m.name} — ${m.title}${m.expertise ? ` (${m.expertise})` : ''}`))
    }
    if (siteData.articles?.length) {
      parts.push(`Recent Articles:`)
      siteData.articles.forEach(a => parts.push(`  • ${a.title}${a.excerpt ? ` — ${a.excerpt}` : ''}`))
    }
    if (siteData.faqs?.length) {
      parts.push(`FAQs:`)
      siteData.faqs.forEach(f => parts.push(`  Q: ${f.question}\n  A: ${f.answer}`))
    }
    if (parts.length > 0) siteContext = '\n\nCURRENT WORKSPACE INFORMATION:\n' + parts.join('\n')
  }

  const base = siteData?.tenantSlug ? `/team/${siteData.tenantSlug}` : ''
  const navHome = siteData?.tenantSlug ? base : '/'
  const navAbout = siteData?.tenantSlug ? `${base}/team` : '/'
  const navPractice = siteData?.tenantSlug ? `${base}/practice-areas` : '/'
  const navArticles = siteData?.tenantSlug ? `${base}/articles` : '/'
  const navConsult = siteData?.tenantSlug ? `${base}/book` : '/signup'
  const navContact = siteData?.tenantSlug ? `${base}/contact` : '/'

  return `You are LAW AI — the in-workspace legal assistant for ${siteData?.firmName || 'this law firm'}.

KNOWLEDGE BASE CONTEXT:
${context}${siteContext}

# HOW YOU ANSWER (NON-NEGOTIABLE)

1. **Be crisp.** Default answer length: 2-4 short sentences. Use a bullet list ONLY when the user explicitly asks for steps, a comparison, or a list.
2. **Be complete in that brief space.** Don't stop mid-thought. End on a clear conclusion or one specific next action.
3. **No filler.** Never start with "Great question", "Sure", "I'd be happy to", "As an AI", or any apology. Start with the answer.
4. **No code.** You MUST NOT generate code, code blocks, scripts, SQL, regex, JSON, YAML, shell commands, or pseudo-code in ANY programming language, ever — even if the user asks for it. If asked for code, reply: "I can't write code — I'm a legal assistant. I can explain the law or help you with this firm's services."
5. **No hallucination.** If you don't know an Act / Section / case / fact, say so plainly: "I don't have that detail — please confirm with the firm." Never invent statute numbers, case names, judgments, dates, or citations.
6. **Stay scoped.** Answer questions about Indian law, this firm's services, navigation on this site, or booking a consultation. For anything else, redirect briefly to a consultation.
7. **Cite when you ARE sure.** For known law, name the Act and Section/Article in one short clause — don't write paragraphs of statute text.
8. **Match the user's language.** English → English. Hindi → Hindi. Hinglish → Hinglish.
9. **Personal situations:** explain the law in 2-3 sentences, then say "Book a consultation for advice on your specific case."
10. **Follow-ups & short replies ("yes", "ok", "tell me more"):** continue the previous topic — never ask the user to repeat themselves.
11. **Navigation:** when the user asks to go somewhere on the site, confirm in one short sentence ("Opening the practice areas now.") and the UI handles the redirect.
12. **Tone:** warm, direct, factual. No legalese unless the user is clearly a lawyer.

# WHAT YOU NEVER DO

- Generate code in any language
- Invent statutes, sections, cases, judgments, or citations
- Give a definitive legal opinion on the user's specific case ("you will win", "you are guilty")
- Promise outcomes or timelines
- Discuss topics unrelated to Indian law or this firm
- Write essays — be brief, be specific
- Reference, mention, or imply the existence of any OTHER law firm, advocate, case, client, or workspace. The only firm context you have is the WORKSPACE INFORMATION block above. If the user asks about another firm, say "I can only help with ${siteData?.firmName || 'this firm'}'s workspace."

# YOUR KNOWLEDGE

You know: Indian Constitution, BNS / IPC, BNSS / CrPC, BSA / Evidence Act, CPC, Hindu/Muslim/Christian personal laws, POCSO, NDPS, Companies Act, GST, Income Tax, RERA, Consumer Protection, IT Act, DPDP Act, Labour Codes, IPR, Arbitration Act, PWDVA, SC/ST Act, and landmark Supreme Court / High Court judgments. Use this knowledge confidently — but only when sure.`
}

function extractDocHighlights(doc: Document) {
  return doc.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
}

export function buildFallbackReply(query: string, retrievedDocs: Document[]): string {
  const lowerQuery = query.toLowerCase()
  const shortQuery = tokenize(query).length <= 2

  if (lowerQuery.includes('article 30')) {
    return [
      'Article 30 protects the right of minorities, based on religion or language, to establish and administer educational institutions of their choice.',
      'It means minority schools and colleges can preserve their character, while the State may still regulate standards, discipline, and health.',
      'Article 30(2) also prevents discrimination in grant of aid only because an institution is minority-run.',
    ].join(' ')
  }

  if (
    lowerQuery.includes('book') ||
    lowerQuery.includes('consultation') ||
    lowerQuery.includes('appointment') ||
    lowerQuery.includes('slot')
  ) {
    return 'You can book a consultation directly from the Book Consultation page. Open the booking modal, choose a date, select your meeting mode, and confirm an available slot. For case-specific advice, please use that booking flow.'
  }

  if (
    lowerQuery.includes('contact') ||
    lowerQuery.includes('email') ||
    lowerQuery.includes('phone') ||
    lowerQuery.includes('reach')
  ) {
    return 'You can reach the firm through the contact page, direct phone line, or email listed on the site. If your matter needs legal review, use the consultation booking flow so the team can review the issue with context.'
  }

  if (!retrievedDocs.length) {
    if (shortQuery) {
      return 'Please give a little more detail so I can answer accurately.'
    }
    return 'I can help with Indian law topics, firm services, and consultation booking. Please ask a more specific question, or book a consultation for case-specific guidance.'
  }

  const primaryDoc = retrievedDocs[0]
  const highlights = extractDocHighlights(primaryDoc)

  return [
    `Based on ${primaryDoc.title}:`,
    ...highlights.map((line) => `- ${line}`),
    '',
    'This is general guidance only, not case-specific legal advice. For advice on your facts, book a consultation.',
  ].join('\n')
}
