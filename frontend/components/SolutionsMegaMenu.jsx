'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ─── Content Data ──────────────────────────────────────────────────────────────

const OPERATIONS_TABS = [
  {
    id: 'logistics',
    label: 'Logistics',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    sections: [
      {
        title: 'Executive Summary',
        type: 'text',
        content: 'AI-driven transportation and fleet optimization platform enabling real-time tracking, route intelligence, predictive analytics, and cost reduction across first mile, mid mile, and last mile operations.',
      },
      {
        title: 'Strategic Collaborations',
        type: 'list',
        items: ['Comtrade Digital Services – Platform engineering and integration', 'Vinturas – Secure supply chain visibility'],
      },
      {
        title: 'Fleet Intelligence',
        type: 'list',
        items: [
          'GPS-based real-time vehicle tracking',
          'AI-based route optimization and re-routing',
          'Predictive ETA and delay alerts',
          'Driver behavior analytics and safety scoring',
          'Fuel optimization and cost analytics',
          'Cold chain monitoring',
        ],
      },
      {
        title: 'Control Tower',
        type: 'list',
        items: [
          'Centralized command dashboard',
          'Real-time disruption alerts',
          'AI-based demand forecasting',
          'End-to-end supply chain visibility',
          'Exception management with automated alerts',
        ],
      },
    ],
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
    sections: [
      {
        title: 'Executive Summary',
        type: 'text',
        content: 'End-to-end AI-enabled warehouse operations covering inbound, storage, inventory, picking, outbound, and returns with IoT, robotics, and digital twin integration.',
      },
      {
        title: 'Inbound Operations',
        type: 'list',
        items: [
          'AI-based dock scheduling and appointment planning',
          'Computer vision for gate entry and vehicle recognition',
          'Automated GRN and verification',
          'Damage detection using image analytics',
        ],
      },
      {
        title: 'Put-away & Storage',
        type: 'list',
        items: [
          'AI-driven dynamic slotting',
          'Warehouse space optimization',
          'Cold storage monitoring systems',
          'Digital twin simulation for layout optimization',
        ],
      },
      {
        title: 'Inventory & Cycle Counts',
        type: 'list',
        items: [
          'AI-based cycle count scheduling',
          'Drone / vision-based inventory counting',
          'Real-time inventory reconciliation',
          'Shrinkage and anomaly detection',
        ],
      },
      {
        title: 'Picking & Internal Movement',
        type: 'list',
        items: [
          'AI-optimized pick path algorithms',
          'Cluster and wave picking optimization',
          'AMR for goods movement',
          'AGV for pallet transport',
          'AI-enabled forklift coordination',
        ],
      },
      {
        title: 'Outbound Operations',
        type: 'list',
        items: [
          'Order prioritization and batching',
          'Dynamic dispatch planning',
          'Load optimization algorithms',
          'Dock scheduling optimization',
        ],
      },
      {
        title: 'Returns Management',
        type: 'list',
        items: [
          'AI-based returns classification',
          'Vision-based inspection',
          'Fraud detection in returns',
          'Inventory reintegration',
        ],
      },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    sections: [
      {
        title: 'Executive Summary',
        type: 'text',
        content: 'AI-powered e-commerce enablement layer focusing on customer engagement, order lifecycle management, and intelligent fulfilment optimization.',
      },
      {
        title: 'Collaborations',
        type: 'list',
        items: ['Graia AI Reception & Front Desk for E-commerce'],
      },
      {
        title: 'Customer Experience',
        type: 'list',
        items: [
          'AI chatbots and voice assistants',
          'Order tracking automation',
          'Returns handling and customer support',
        ],
      },
      {
        title: 'Order Management',
        type: 'list',
        items: [
          'AI-based order routing',
          'Inventory synchronization across channels',
          'Demand prediction and planning',
        ],
      },
      {
        title: 'Fulfilment Optimization',
        type: 'list',
        items: [
          'Warehouse selection optimization',
          'Delivery speed vs cost balancing',
          'Last-mile intelligence',
        ],
      },
    ],
  },
];

const ENTERPRISE_TABS = [
  {
    id: 'school',
    label: 'AI Integration',
    sublabel: 'Schools & Colleges',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    sections: [
      {
        title: 'Executive Summary',
        type: 'text',
        content: 'SWAIS enables AI-driven transformation of school and higher education systems aligned with the National Education Policy 2020, focusing on digital learning, multidisciplinary education, and future-ready skills.',
      },
      {
        title: 'Curriculum Integration',
        type: 'list',
        items: [
          'AI modules embedded into existing school and college curriculum',
          'STEM + AI + Data Science integration',
          'Project-based and experiential learning models',
          'Vocational and skill-based AI programs',
        ],
      },
      {
        title: 'Technology Enablement',
        type: 'list',
        items: [
          'AI-enabled Learning Management Systems (LMS)',
          'Adaptive learning platforms with personalized pathways',
          'Virtual labs and simulation environments',
          'Student performance analytics and dashboards',
        ],
      },
      {
        title: 'Institutional Transformation',
        type: 'list',
        items: [
          'Digital campus infrastructure',
          'Faculty training in AI and digital tools',
          'Hybrid and online learning enablement',
          'Academic process automation',
        ],
      },
      {
        title: 'Funding & Government Alignment',
        type: 'list',
        items: [
          'Ministry of Electronics and Information Technology – Support for AI and digital education',
          'CSR funding for rural and Tier-2/3 education transformation',
          'Innovation grants for AI labs and incubation centers',
        ],
      },
      {
        title: 'Outcomes',
        type: 'list',
        items: [
          'Future-ready students with AI skills',
          'Improved employability',
          'Digital-first education ecosystem',
          'Alignment with national policy and global standards',
        ],
      },
    ],
  },
  {
    id: 'corporate',
    label: 'Corporate Training',
    sublabel: 'Enterprise Programs',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
      </svg>
    ),
    sections: [
      {
        title: 'Executive Summary',
        type: 'text',
        content: 'SWAIS delivers enterprise-grade AI and digital transformation training programs tailored for corporate leadership, middle management, and operational teams to drive organization-wide adoption of AI.',
      },
      {
        title: 'Training Programs',
        type: 'list',
        items: [
          'AI for CXOs and leadership teams',
          'Digital transformation strategy workshops',
          'Data-driven decision-making programs',
          'AI tools for operations, HR, finance, and logistics',
        ],
      },
      {
        title: 'Industry-Specific Modules',
        type: 'list',
        items: [
          'AI in Logistics & Supply Chain',
          'AI in Healthcare & Insurance',
          'AI in Banking & Financial Services',
          'AI in Manufacturing & Industry 4.0',
        ],
      },
      {
        title: 'Delivery Models',
        type: 'list',
        items: [
          'On-site executive workshops',
          'Virtual instructor-led training',
          'Blended learning models',
          'Continuous learning platforms',
        ],
      },
      {
        title: 'Business Impact',
        type: 'list',
        items: [
          'Faster AI adoption across enterprise',
          'Improved productivity and decision-making',
          'Enhanced innovation capability',
          'Alignment of business strategy with AI',
        ],
      },
    ],
  },
  {
    id: 'awareness',
    label: 'AI Awareness',
    sublabel: 'Global Programs',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253" />
      </svg>
    ),
    sections: [
      {
        title: 'Executive Summary',
        type: 'text',
        content: 'SWAIS promotes AI awareness and global exposure programs to build foundational understanding of AI across students, professionals, and institutions, supported by international collaborations.',
      },
      {
        title: 'Global Collaborations',
        type: 'list',
        items: [
          'St. Gallen IMB Business School – Global executive programs and immersion',
          'International academic and research partnerships',
        ],
      },
      {
        title: 'AI Awareness Programs',
        type: 'list',
        items: [
          'Introductory AI literacy programs',
          'Workshops for schools, colleges, and corporates',
          'Awareness sessions for government and public sector',
          'Ethics and responsible AI training',
        ],
      },
      {
        title: 'Global Exposure Initiatives',
        type: 'list',
        items: [
          'International immersion programs',
          'Cross-border academic collaborations',
          'Global certification programs',
          'Exposure to global AI ecosystems',
        ],
      },
      {
        title: 'Outcomes',
        type: 'list',
        items: [
          'Increased AI awareness at all levels',
          'Global exposure for students and professionals',
          'Stronger international collaboration networks',
          'Preparation for future digital economy',
        ],
      },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    sublabel: 'AI-Powered Care',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    hasSubTabs: true,
    subTabs: [
      {
        id: 'reception',
        label: 'Reception & Front Desk',
        sections: [
          { title: 'Executive Summary', type: 'text', content: 'SWAIS transforms hospital reception and front desk operations using AI-driven automation, reducing wait times, improving patient experience, and optimizing administrative efficiency through intelligent workflows.' },
          { title: 'Core Solution – Graia AI Front Desk', type: 'list', items: ['AI-powered patient registration and onboarding', 'Voice-enabled and multilingual interaction system', 'Appointment scheduling and queue management', 'Automated patient guidance within hospital premises'] },
          { title: 'Operational Capabilities', type: 'list', items: ['Walk-in and appointment patient handling', 'Doctor availability matching and scheduling', 'Digital token and queue systems', 'Integration with Hospital Information Systems (HIS)'] },
          { title: 'AI Enhancements', type: 'list', items: ['Predictive patient flow management', 'Chatbot + voice bot for 24/7 engagement', 'Automated form filling and documentation', 'Facial recognition / digital ID integration (optional)'] },
          { title: 'Impact', type: 'list', items: ['50–70% reduction in front desk workload', 'Reduced patient wait time', 'Improved patient satisfaction'] },
        ],
      },
      {
        id: 'lab',
        label: 'Lab & Diagnostics',
        sections: [
          { title: 'Executive Summary', type: 'text', content: 'AI-enabled lab and diagnostics management system that improves accuracy, turnaround time, and operational efficiency across hospital and standalone lab ecosystems.' },
          { title: 'Lab Management System', type: 'list', items: ['End-to-end sample lifecycle tracking', 'Automated test scheduling and prioritization', 'Digital reporting and result dissemination', 'Integration with hospital systems'] },
          { title: 'AI Capabilities', type: 'list', items: ['AI-assisted diagnostics and anomaly detection', 'Image-based analysis for pathology and radiology', 'Predictive workload and lab capacity planning', 'Error detection and quality control systems'] },
          { title: 'Operational Efficiency', type: 'list', items: ['Reduced turnaround time (TAT)', 'Automated sample tracking', 'Improved reporting accuracy', 'Centralized lab data management'] },
        ],
      },
      {
        id: 'insurance',
        label: 'Insurance',
        sections: [
          { title: 'Executive Summary', type: 'text', content: 'SWAIS enables end-to-end automation of healthcare insurance processes, reducing claim processing time, improving accuracy, and minimizing fraud through AI-driven workflows.' },
          { title: 'Claims Processing', type: 'list', items: ['Automated claim submission and validation', 'Real-time eligibility verification', 'Document digitization and processing', 'Integration with insurance providers'] },
          { title: 'AI Capabilities', type: 'list', items: ['Fraud detection using pattern recognition', 'Claim approval prediction models', 'Automated discrepancy identification', 'Smart document extraction (OCR + AI)'] },
          { title: 'Operational Benefits', type: 'list', items: ['Faster claim settlements', 'Reduced manual intervention', 'Improved transparency', 'Enhanced coordination between hospitals and insurers'] },
        ],
      },
      {
        id: 'retention',
        label: 'Patient Retention',
        sections: [
          { title: 'Executive Summary', type: 'text', content: 'AI-driven patient engagement and retention platform designed to improve long-term patient relationships, increase repeat visits, and enhance preventive care through personalized communication and monitoring.' },
          { title: 'Patient Engagement', type: 'list', items: ['Automated follow-ups and reminders', 'Medication adherence tracking', 'Post-discharge care communication', 'Personalized health recommendations'] },
          { title: 'AI Capabilities', type: 'list', items: ['Patient behavior analytics', 'Risk prediction for chronic conditions', 'Personalized engagement models', 'Sentiment analysis from patient feedback'] },
          { title: 'Outcome & Impact', type: 'list', items: ['Increased patient retention and loyalty', 'Improved treatment adherence', 'Reduced readmission rates', 'Enhanced patient lifetime value'] },
        ],
      },
      {
        id: 'records',
        label: 'Medical Records',
        sections: [
          { title: 'Executive Summary', type: 'text', content: 'SWAIS enables secure, compliant, and scalable cloud-based medical records retention for up to 10 years, ensuring regulatory compliance, easy retrieval, and intelligent data utilization across hospital ecosystems.' },
          { title: 'Cloud-Based Repository', type: 'list', items: ['Centralized Electronic Health Records (EHR) storage', 'Secure cloud infrastructure with redundancy and backup', 'Structured and unstructured data storage (reports, scans, images)', 'Long-term archival (7–10+ years compliance-ready)'] },
          { title: 'Compliance & Security', type: 'list', items: ['Alignment with healthcare data retention regulations', 'Role-based access control and audit trails', 'Data encryption (at rest and in transit)', 'Consent-based access and privacy controls'] },
          { title: 'AI-Enabled Records Management', type: 'list', items: ['Smart search and retrieval of patient records', 'AI-based document classification and tagging', 'OCR for digitization of legacy paper records', 'Automated indexing and metadata generation'] },
          { title: 'Integration Capabilities', type: 'list', items: ['Integration with Hospital Information Systems (HIS)', 'Lab, insurance, and pharmacy data linkage', 'Interoperability across multiple hospital units', 'API-based integration with external systems'] },
          { title: 'Operational Benefits', type: 'list', items: ['Instant retrieval of historical patient data', 'Reduced physical storage costs', 'Improved clinical decision-making', 'Enhanced audit readiness and compliance'] },
          { title: 'Strategic Value', type: 'list', items: ['Foundation for AI-driven healthcare analytics', 'Enables longitudinal patient health tracking', 'Supports telemedicine and remote consultations', 'Builds unified patient data ecosystem'] },
        ],
      },
    ],
  },
  {
    id: 'others',
    label: 'Others',
    sublabel: 'Expanding Soon',
    isComingSoonList: true,
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    upcomingSectors: [
      { name: 'Banking', icon: '🏦' },
      { name: 'Manufacturing', icon: '🏭' },
      { name: 'Power & Green Energy', icon: '⚡' },
      { name: 'Cyber Intelligence & Sovereign AI', icon: '🛡️' },
      { name: 'Quantum Computing', icon: '⚛️' },
    ],
  },
];

// ─── Sub Section Card ──────────────────────────────────────────────────────────

function SectionCard({ section }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
        <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{section.title}</h4>
      </div>
      {section.type === 'text' ? (
        <p className="text-slate-300 text-sm leading-relaxed pl-3.5">{section.content}</p>
      ) : (
        <ul className="space-y-1.5 pl-3.5">
          {section.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <svg className="w-3.5 h-3.5 text-cyan-500/60 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Derived slices ────────────────────────────────────────────────────────────
// EduTech = first 3 ENTERPRISE_TABS (school, corporate, awareness)
const EDUTECH_TABS = ENTERPRISE_TABS.slice(0, 3);
// Healthcare entry (has nested sub-tabs)
const HEALTHCARE_DATA = ENTERPRISE_TABS.find(t => t.id === 'healthcare');
// Others entry
const OTHERS_DATA = ENTERPRISE_TABS.find(t => t.id === 'others');

// ─── Main Mega Menu ────────────────────────────────────────────────────────────

export default function SolutionsMegaMenu({ onClose }) {
  // 4 main tabs: logistics | edutech | healthcare | others
  const [mainTab, setMainTab] = useState('logistics');
  // Logistics sub-tab
  const [logSubTab, setLogSubTab] = useState('logistics');
  // EduTech sub-tab
  const [eduSubTab, setEduSubTab] = useState('school');
  // Healthcare sub-tab
  const [healthSubTab, setHealthSubTab] = useState('reception');

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const activeLogTab = OPERATIONS_TABS.find(t => t.id === logSubTab) || OPERATIONS_TABS[0];
  const activeEduTab = EDUTECH_TABS.find(t => t.id === eduSubTab) || EDUTECH_TABS[0];

  const MAIN_TABS = [
    { id: 'logistics',   label: 'Logistics · Warehouse · E-Commerce' },
    { id: 'edutech',     label: 'EduTech' },
    { id: 'healthcare',  label: 'Healthcare' },
    { id: 'others',      label: 'Others' },
  ];

  const overlay = (
    <div className="fixed inset-0 bg-[#07070d] z-[999] flex flex-col animate-fadeIn" style={{ paddingTop: '80px' }}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* ── Sticky header ── */}
      <div className="bg-[#07070d] border-b border-white/8 px-4 sm:px-6 lg:px-8 pt-4 pb-0">

        {/* Main tabs + close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {MAIN_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  mainTab === t.id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all text-xs sm:text-sm font-medium shrink-0 ml-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Sub-tab pills — only shown for logistics and edutech tabs */}
        {(mainTab === 'logistics' || mainTab === 'edutech') && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
            {mainTab === 'logistics'
              ? OPERATIONS_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setLogSubTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      logSubTab === tab.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-500 bg-white/[0.03] border border-white/8 hover:text-slate-300'
                    }`}
                  >
                    <span className={logSubTab === tab.id ? 'text-cyan-400' : 'text-slate-600'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))
              : EDUTECH_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setEduSubTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      eduSubTab === tab.id
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'text-slate-500 bg-white/[0.03] border border-white/8 hover:text-slate-300'
                    }`}
                  >
                    <span className={eduSubTab === tab.id ? 'text-purple-400' : 'text-slate-600'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))
            }
          </div>
        )}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

          {/* ── Tab 1: Logistics · Warehouse · E-Commerce ── */}
          {mainTab === 'logistics' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/10 flex items-center justify-center text-cyan-400">
                  {activeLogTab.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">{activeLogTab.label}</h3>
                  <p className="text-xs text-slate-500">AI-Powered {activeLogTab.label} Intelligence</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeLogTab.sections.map((section, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-cyan-500/20 transition-colors">
                    <SectionCard section={section} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab 2: EduTech ── */}
          {mainTab === 'edutech' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/10 flex items-center justify-center text-purple-400">
                  {activeEduTab.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">{activeEduTab.label}</h3>
                  <p className="text-xs text-slate-500">{activeEduTab.sublabel}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeEduTab.sections.map((section, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-purple-500/20 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">{section.title}</h4>
                    </div>
                    {section.type === 'text' ? (
                      <p className="text-slate-300 text-sm leading-relaxed pl-3.5">{section.content}</p>
                    ) : (
                      <ul className="space-y-1.5 pl-3.5">
                        {section.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                            <svg className="w-3.5 h-3.5 text-purple-500/60 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab 3: Healthcare ── */}
          {mainTab === 'healthcare' && HEALTHCARE_DATA && (() => {
            const activeHealthTab = HEALTHCARE_DATA.subTabs.find(t => t.id === healthSubTab) || HEALTHCARE_DATA.subTabs[0];
            return (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/10 flex items-center justify-center text-rose-400">
                    {HEALTHCARE_DATA.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">{HEALTHCARE_DATA.label}</h3>
                    <p className="text-xs text-slate-500">{HEALTHCARE_DATA.sublabel}</p>
                  </div>
                </div>
                {/* Healthcare sub-tab pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {HEALTHCARE_DATA.subTabs.map(st => (
                    <button
                      key={st.id}
                      onClick={() => setHealthSubTab(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                        healthSubTab === st.id
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'text-slate-500 bg-white/[0.03] border border-white/5 hover:text-slate-300'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeHealthTab.sections.map((section, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-rose-500/20 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest">{section.title}</h4>
                      </div>
                      {section.type === 'text' ? (
                        <p className="text-slate-300 text-sm leading-relaxed pl-3.5">{section.content}</p>
                      ) : (
                        <ul className="space-y-1.5 pl-3.5">
                          {section.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                              <svg className="w-3.5 h-3.5 text-rose-500/60 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Tab 4: Others ── */}
          {mainTab === 'others' && OTHERS_DATA && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  {OTHERS_DATA.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base">More Sectors</h3>
                  <p className="text-xs text-slate-500">Expanding continuously</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {OTHERS_DATA.upcomingSectors.map((sector, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-slate-500/30 transition-colors">
                    <span className="text-xl">{sector.icon}</span>
                    <span className="text-sm font-semibold text-slate-400">{sector.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 bg-white/[0.02] border border-dashed border-white/10 rounded-xl px-4 py-3">
                  <span className="text-xl">✦</span>
                  <span className="text-sm font-semibold text-slate-600 italic">And a lot more…</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-400">This section is <span className="text-cyan-400 font-semibold">actively expanding</span>. More sector content coming soon.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
