/* Learning references are general application guidance, not Faishak catalogue verification. */
const salesKnowledge = {
  objectives: [
    {
      id: "portfolio",
      phase: 1,
      title: "Map the Faishak portfolio",
      detail:
        "Identify the brand and application for each supplied product family.",
    },
    {
      id: "claims",
      phase: 1,
      title: "Understand performance evidence",
      detail:
        "Explain the difference between product claims and tested door-assembly evidence.",
    },
    {
      id: "search",
      phase: 1,
      title: "Build a package-focused BCI search",
      detail:
        "Use sector, stage, keywords and update date; review relevance with Lucas.",
    },
    {
      id: "qualification",
      phase: 1,
      title: "Qualify your first five projects",
      detail:
        "Record relevant scope, timing, buyer, ownership and a next action.",
    },
    {
      id: "discovery",
      phase: 2,
      title: "Complete a discovery conversation",
      detail:
        "Understand the buyer’s requirement, incumbent and decision process.",
    },
    {
      id: "stakeholders",
      phase: 2,
      title: "Build a stakeholder brief",
      detail:
        "Map specifier, contractor, QS, subcontractor and procurement roles.",
    },
    {
      id: "technical",
      phase: 2,
      title: "Earn a technical / specification review",
      detail: "Secure an agreed review with a relevant contact.",
    },
    {
      id: "rfq",
      phase: 2,
      title: "Create a qualified RFQ",
      detail:
        "Confirm scope, documents, requirements, timing and buying route.",
    },
    {
      id: "value",
      phase: 3,
      title: "Present an evidence-based value case",
      detail:
        "Compare project fit and verified requirements without unsupported superiority claims.",
    },
    {
      id: "objection",
      phase: 3,
      title: "Practise an incumbent objection",
      detail:
        "Acknowledge the existing supplier and earn a relevant discovery next step.",
    },
    {
      id: "forecast",
      phase: 3,
      title: "Review pipeline and forecast",
      detail:
        "Check stage, blockers, dates and next actions for active opportunities.",
    },
    {
      id: "meeting",
      phase: 3,
      title: "Deliver a sales meeting update",
      detail: "Report movement, risk, support required and commitments.",
    },
  ],
  categories: [
    {
      id: "sealing",
      title: "Sealing & Privacy",
      keywords:
        '"door seal", "acoustic seal", "smoke seal", "drop seal", "fire door"',
      brands: [["Raven", "Australia", "https://www.raven.com.au/"]],
      problem:
        "Reduce unwanted sound, draughts, dust and light at appropriate door interfaces. Smoke and fire applications require compatible tested assemblies.",
      applications: [
        "Healthcare consultation and patient rooms: privacy and acoustic requirements.",
        "Hotels and education: acoustic separation and door-bottom gaps.",
        "Retrofit door interfaces: assess condition, gap size, floor level and closing function.",
      ],
      buyers:
        "Architect / acoustic consultant, door manufacturer, contractor and facilities team.",
      selection: [
        "Door construction, gap dimensions and threshold conditions.",
        "Required acoustic, smoke or fire classification and the exact tested assembly.",
        "Closing force, accessibility, durability and maintenance conditions.",
      ],
      evidence:
        "Request the exact model, suffix, compatible assembly and supporting test documentation. Never convert one product’s result into a blanket door rating.",
      candidates: ["Lorient", "Athmer", "Pemko"],
      questions: [
        "What door assembly and performance evidence does the specification require?",
        "Is the gap, threshold or closing condition the actual problem?",
      ],
    },
    {
      id: "hardware",
      title: "Door Hardware & Ironmongery",
      keywords:
        '"door hardware", ironmongery, "door closer", "panic exit", lockset',
      brands: [
        ["Briton", "United Kingdom", "https://www.briton.co.uk/"],
        ["CISA", "Italy", "https://www.cisa.com/"],
        ["Schlage", "United States", "https://www.schlage.com/"],
        ["GEZE", "Germany", "https://www.geze.com/"],
      ],
      problem:
        "Make doors close, latch, lock and provide suitable escape and access functions for the use case.",
      applications: [
        "Public buildings and transport: duty cycles, escape routes and approved specifications.",
        "Commercial and healthcare: door closing, controlled access and operational reliability.",
        "Replacement work: match door preparation, existing interfaces and user requirements.",
      ],
      buyers:
        "Architect / hardware consultant, main contractor, QS, door supplier and procurement.",
      selection: [
        "Door size, weight, handing and operating conditions.",
        "Fire-door compatibility, escape requirements and relevant local approval evidence.",
        "Finish, keying, electrified interfaces, serviceability and supply timing.",
      ],
      evidence:
        "Compare exact models and ironmongery schedules. Brand reputation alone does not establish compliance or interchangeability.",
      candidates: ["dormakaba", "ASSA ABLOY", "Häfele", "Yale"],
      questions: [
        "Which brands and models are accepted on this project?",
        "What is the substitution process and which documents are required?",
      ],
    },
    {
      id: "automation",
      title: "Automated Entrances",
      keywords:
        '"automatic door", "door operator", "entrance system", "sliding entrance"',
      brands: [
        ["GEZE", "Germany", "https://www.geze.com/"],
        ["Stanley", "United States", "https://www.stanleyaccess.com/"],
      ],
      problem:
        "Provide controlled, accessible movement through suitable automatic entrance systems.",
      applications: [
        "Hospitals and public buildings: accessible entrances and traffic flow.",
        "Retail and commercial entrances: pedestrian movement and operational conditions.",
        "Retrofit automation: confirm the existing door, electrical and safety interfaces.",
      ],
      buyers:
        "Architect, M&E / access consultant, main contractor, owner and facilities manager.",
      selection: [
        "Door configuration, traffic level, clear opening and operating conditions.",
        "Safety sensors, accessibility and integration requirements.",
        "Installation, commissioning, maintenance and response arrangements.",
      ],
      evidence:
        "Use the exact operator/system documentation and qualified installation assessment. Confirm current brand representation and local support.",
      candidates: ["ASSA ABLOY Entrance Systems", "dormakaba", "NABCO"],
      questions: [
        "What safety and access-control integration is required?",
        "Who will commission and maintain the entrance?",
      ],
    },
    {
      id: "sliding",
      title: "Sliding & Pocket Systems",
      keywords:
        '"sliding door", "pocket door", "cavity slider", "sliding system"',
      brands: [
        ["Cavity Sliders", "New Zealand", "https://www.cavitysliders.com/"],
        ["Magnum", "Confirm in Faishak catalogue", null],
      ],
      problem:
        "Save swing space and support appropriate sliding or cavity-door applications.",
      applications: [
        "Residential, hospitality and fit-out spaces with limited swing clearance.",
        "Design-led projects needing pocket or concealed-door configurations.",
        "Accessible room planning where the selected system meets the actual requirements.",
      ],
      buyers:
        "Architect / interior designer, fit-out contractor, builder and door supplier.",
      selection: [
        "Door dimensions, weight, wall construction and pocket depth.",
        "Track, hardware, soft-close and maintenance access.",
        "Required acoustic, fire or accessibility evidence for the selected assembly.",
      ],
      evidence:
        "Confirm the exact frame, track, door and installation assembly. Pocket doors do not automatically provide fire or acoustic performance.",
      candidates: ["ECLISSE", "Scrigno", "Hawa"],
      questions: [
        "Is there sufficient wall depth and maintenance access?",
        "Which door weight and performance requirements apply?",
      ],
    },
    {
      id: "fire",
      title: "Fire & Smoke Interfaces",
      keywords:
        '"fire door", "fire seal", "smoke seal", intumescent, "fire compartment"',
      brands: [
        ["SF", "Confirm origin and manufacturer in catalogue", null],
        ["Raven", "Australia", "https://www.raven.com.au/"],
      ],
      problem:
        "Support the specified fire/smoke door system with compatible interfaces and evidence.",
      applications: [
        "Escape routes and compartmentation doors in relevant buildings.",
        "Replacement interfaces where the approved assembly permits the change.",
        "Door manufacturing and installation requiring traceable compatible components.",
      ],
      buyers:
        "Fire-safety consultant, architect, door manufacturer, contractor and approving parties.",
      selection: [
        "Exact classification and permitted tested configurations.",
        "Door leaf, frame, seal, hardware and installation compatibility.",
        "Required local acceptance and supporting certificates.",
      ],
      evidence:
        "Do not state a product alone makes a door fire-rated. Use the approved assembly and exact supporting documents.",
      candidates: ["Lorient", "Pyroplex", "Sealmaster"],
      questions: [
        "Which tested door assembly is specified?",
        "Does the substitution fall within its approved configuration?",
      ],
    },
  ],
  techniques: [
    {
      name: "Tactical empathy",
      expert: "Chris Voss · negotiation",
      method: "Name the concern without claiming agreement.",
      example: "“It sounds like changing supplier would create approval risk.”",
      avoid: "A scripted label followed immediately by a product pitch.",
    },
    {
      name: "Calibrated question",
      expert: "Chris Voss · negotiation",
      method: "Ask a useful how / what question to uncover the process.",
      example:
        "“What would an alternative need to demonstrate before your team could review it?”",
      avoid: "A question that corners the customer or ignores a clear no.",
    },
    {
      name: "SPIN discovery",
      expert: "Neil Rackham · consultative selling",
      method:
        "Move from current situation to problem, implication and desired outcome.",
      example:
        "“When a door fails to latch, what does that mean for the facilities team?”",
      avoid: "Interrogating the customer with a long list of questions.",
    },
    {
      name: "Stakeholder mapping",
      expert: "Miller / Heiman · complex sales",
      method: "Understand who uses, influences, approves and buys.",
      example:
        "“Who reviews the technical submission, and who owns the purchase decision?”",
      avoid: "Assuming the person answering your email is the decision-maker.",
    },
    {
      name: "Evidence-led insight",
      expert: "Challenger principles · Dixon / Adamson",
      method: "Offer a relevant insight supported by project evidence.",
      example:
        "“Before comparing price, could we confirm which maintenance requirements must be covered?”",
      avoid: "Inventing statistics or criticising the incumbent.",
    },
    {
      name: "Offer clarity",
      expert: "Alex Hormozi · offer principles",
      method: "Make the useful outcome and low-friction next step specific.",
      example:
        "“I can prepare a requirements comparison for those two doors. Would that help your review?”",
      avoid: "Unverified guarantees or inflated savings claims.",
    },
    {
      name: "Useful content first",
      expert: "Gary Vaynerchuk · content principles",
      method: "Earn attention with relevant help and context.",
      example:
        "“Here is the checklist we discussed for the acoustic door interface.”",
      avoid: "Repeated catalogue blasts without a customer need.",
    },
    {
      name: "Clear direct response",
      expert: "Sabri Suby · direct-response principles",
      method: "Lead with a relevant problem and one clear action.",
      example:
        "“Is your team still reviewing the ironmongery package, or has the specification closed?”",
      avoid: "Manufactured urgency or unsupported proof.",
    },
  ],
  sequences: [
    {
      id: "cold",
      title: "Cold introduction",
      strategy:
        "Introduce one relevant application and earn permission to learn more.",
      steps: [
        {
          day: "Day 0",
          channel: "Email",
          goal: "Introduce relevant context",
          message:
            "Hi, I’m Syafiee from Faishak. For {project}, we may be able to support {package}. May I check who handles this scope, and whether a brief requirements review would be relevant?",
          branch:
            "Reply → continue the actual conversation. Wrong contact → ask for the appropriate role once.",
        },
        {
          day: "Day 2",
          channel: "Call",
          goal: "Identify ownership, not force a pitch",
          message:
            "Hi, I sent a short note about {package} for {project}. Have I reached the person who handles this package? What is the best way to understand the current requirements?",
          branch:
            "Answer → ask one discovery question. No answer → leave a brief contextual message if appropriate.",
        },
        {
          day: "Day 4",
          channel: "Useful follow-up",
          goal: "Offer a low-friction resource",
          message:
            "Would a short checklist for {package} be useful for your team’s review? I can keep it specific to {project}.",
          branch:
            "Use email. WhatsApp only with permission or an appropriate established relationship.",
        },
        {
          day: "Day 8",
          channel: "Close the loop",
          goal: "Stop respectfully",
          message:
            "I’ll close the loop for now. If {package} becomes relevant on {project}, I’m happy to help with a requirements review. Thank you.",
          branch:
            "No reply → stop this sequence. Re-enter only with meaningful new context.",
        },
      ],
    },
    {
      id: "project",
      title: "Project inquiry",
      strategy:
        "Lead with verified project context and confirm the package’s buying route.",
      steps: [
        {
          day: "Day 0",
          channel: "Project email",
          goal: "Confirm package timing",
          message:
            "I understand {project} is at the relevant project stage. May I check whether {package} is still open for review, and who owns the specification or procurement?",
          branch: "Do not state appointment or project facts unless verified.",
        },
        {
          day: "Day 1–2",
          channel: "Call",
          goal: "Map the decision process",
          message:
            "For {project}, what is the process for reviewing a {package} supplier? Is the next step with your QS, the specifier or the package subcontractor?",
          branch: "Capture names, roles and the agreed next step.",
        },
        {
          day: "Day 4",
          channel: "Contextual follow-up",
          goal: "Offer a relevant comparison",
          message:
            "If useful, I can map the requirements you mentioned against suitable {package} applications. What evidence would make the review useful?",
          branch: "WhatsApp only if agreed; otherwise email.",
        },
        {
          day: "Day 7",
          channel: "Close / defer",
          goal: "Respect buying timing",
          message:
            "Should I close this inquiry, or reconnect at the timing you recommend for {project}?",
          branch:
            "Closed package → stop; agreed future date → create a dated next action.",
        },
      ],
    },
    {
      id: "specifier",
      title: "Specification engagement",
      strategy:
        "Help the specifier assess application fit and evidence before procurement.",
      steps: [
        {
          day: "Day 0",
          channel: "Technical email",
          goal: "Understand the requirement",
          message:
            "For {project}, are there particular performance or interface requirements for {package} that would be useful to review?",
          branch:
            "Offer documents tied to exact products; avoid blanket certifications.",
        },
        {
          day: "Day 3",
          channel: "Call",
          goal: "Earn a technical discussion",
          message:
            "Would a 15-minute application review help your team confirm the requirements for {package}?",
          branch:
            "If interested, agree the participants and information needed.",
        },
        {
          day: "Day 7",
          channel: "Relevant evidence",
          goal: "Support the agreed review",
          message:
            "Following your requirements for {project}, I can share the exact technical documents for review. Is there a specific assembly or standard we should address?",
          branch: "Send only requested or clearly relevant information.",
        },
        {
          day: "Day 12",
          channel: "Close / agreed follow-up",
          goal: "Confirm the next review point",
          message:
            "Is there a useful date to revisit {package}, or should I close this review for now?",
          branch:
            "No response → stop. A scheduled review replaces this cadence.",
        },
      ],
    },
    {
      id: "quote",
      title: "Quotation follow-up",
      strategy:
        "Clarify evaluation and blockers rather than repeatedly asking for an order.",
      steps: [
        {
          day: "Day 0",
          channel: "Quote handover",
          goal: "Confirm understanding",
          message:
            "Here is the {package} quotation for {project}. Could we confirm receipt, the evaluation date and any technical documents still required?",
          branch: "Record the agreed decision date.",
        },
        {
          day: "Agreed date",
          channel: "Call",
          goal: "Understand the evaluation",
          message:
            "What has changed since the quotation review? Are there scope, compliance, timing or commercial points we should address?",
          branch: "Listen before revising price.",
        },
        {
          day: "+2 working days",
          channel: "Resolution email",
          goal: "Address one real blocker",
          message:
            "Following our discussion, here is the clarification on {package}. Does this resolve the point for {project}, or is another requirement outstanding?",
          branch: "Use actual discussion context; do not invent objections.",
        },
        {
          day: "Agreed next date",
          channel: "Decision / close",
          goal: "Confirm status",
          message:
            "Should we keep this quotation active, revise it against a confirmed scope, or close it for now?",
          branch:
            "Record the outcome and reason. Stop chasing after a clear decision.",
        },
      ],
    },
    {
      id: "reactivate",
      title: "Account reactivation",
      strategy:
        "Reconnect only with a meaningful change or useful application.",
      steps: [
        {
          day: "Day 0",
          channel: "Context email",
          goal: "Explain why now",
          message:
            "We last discussed {package}. With the new context on {project}, would a fresh requirements review be useful?",
          branch: "State the real change; avoid a generic “just checking in”.",
        },
        {
          day: "Day 3",
          channel: "Call",
          goal: "Check present relevance",
          message:
            "Has the requirement or ownership for {package} changed since we last spoke?",
          branch: "If not relevant, close politely.",
        },
        {
          day: "Day 7",
          channel: "Final useful note",
          goal: "Offer help and stop",
          message:
            "I’ll leave this with you. If the requirement for {project} changes, I can help review the application and supporting documents.",
          branch: "No reply → stop until there is a genuine new trigger.",
        },
      ],
    },
  ],
};
