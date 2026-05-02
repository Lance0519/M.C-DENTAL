# M.C DENTAL CLINIC — APPOINTMENT MANAGEMENT SYSTEM
## Technical Documentation

---

# PART I. INTRODUCTION

## 1.1 The Problem and Its Background

Dental clinics in the Philippines, particularly small-to-medium practices, continue to rely on manual and paper-based systems for managing appointments, patient records, and clinic operations. M.C Dental Clinic, like many local dental practices, has traditionally depended on phone calls, physical logbooks, and handwritten record-keeping for scheduling patient visits, tracking medical histories, and managing clinic services. This manual approach introduces several operational inefficiencies: double-booked time slots, lost or misplaced patient records, difficulty in tracking treatment histories, and the inability to provide patients with a modern, self-service booking experience.

Furthermore, the COVID-19 pandemic highlighted the urgent need for contactless and digital healthcare solutions. Health screening questionnaires, which are now standard practice before dental visits, add an additional layer of administrative overhead when handled manually. Patients also expect the convenience of online appointment booking, real-time availability checking, and digital communication with their healthcare providers — features that paper-based systems simply cannot support.

The M.C Dental Clinic Appointment Management System was developed to address these challenges by providing a comprehensive, web-based platform that digitizes and streamlines the entire clinic workflow — from patient registration and appointment scheduling to medical history management, service catalogs, and administrative reporting.

## 1.2 Statement of the Problem

The primary problem addressed by this study is the lack of an integrated digital management system for M.C Dental Clinic, resulting in inefficient appointment scheduling, fragmented patient records, limited operational visibility, and a substandard patient experience.

### 1.2.1 Specific SOPs

The system specifically aims to resolve the following operational problems:

1. **Manual Appointment Scheduling** — The clinic has no centralized online system for patients to book, reschedule, or cancel appointments, leading to scheduling conflicts, double-bookings, and wasted time.
2. **Fragmented Patient Records** — Patient demographics, medical histories, treatment notes, and dental images are stored in separate physical files, making retrieval, cross-referencing, and continuity of care slow and error-prone.
3. **Lack of Real-Time Schedule and Doctor Management** — Staff and administrators cannot view real-time appointment calendars, doctor availability, or clinic-wide operating schedules, resulting in overbooking and underutilization of resources.
4. **No Digital Service and Promotion Catalog** — Clinic services and promotional offers have no digital channel for management, visibility, or integration into the booking process, limiting patient awareness and administrative efficiency.
5. **Absence of Notification and Communication Tools** — Patients and staff do not receive timely digital notifications about appointment confirmations, cancellations, rescheduling updates, or other critical clinic events.
6. **Limited Reporting, Audit, and Accountability** — The clinic cannot easily generate operational reports, track revenue, monitor staff activity, or maintain audit trails, reducing administrative oversight and accountability.
7. **Lack of a Professional Online Presence and User Experience** — The clinic has no modern, responsive website or patient-facing interface (e.g., smile gallery, online booking portal), limiting patient engagement and the clinic's professional image.

## 1.3 General Objectives

To design, develop, and deploy a comprehensive, web-based Dental Clinic Appointment Management System for M.C Dental Clinic that digitizes and automates clinic operations including appointment scheduling, patient records management, service and promotion management, and administrative reporting.

### 1.3.1 Specific Objectives

1. To develop an online appointment booking system with real-time time slot availability, calendar-based date selection, integrated health screening questionnaires, and self-service rescheduling and cancellation capabilities.
2. To implement a centralized patient management module with digital profiles, medical history tracking, dental image management, and comprehensive visit records.
3. To build a doctor and schedule management system that maintains doctor profiles, tracks day-of-week availability, manages clinic-wide operating hours, and handles break and holiday schedules.
4. To develop a service and promotion management module that allows administrators to manage service catalogs with pricing, create promotional offers with discount percentages and validity periods, and integrate promotions into the booking workflow.
5. To implement a real-time notification system that alerts patients, staff, and administrators about appointment statuses, cancellation and reschedule requests, and other critical clinic events.
6. To create an audit logging and reporting module that provides comprehensive activity tracking, user action logging with IP address recording, revenue and appointment analytics, and exportable reports.
7. To design a responsive, professional, and visually premium web application — including public-facing pages (homepage, services, about, contact, smile gallery), a patient booking portal, and role-based dashboards (Admin, Staff, Patient) — with dark mode support and a cohesive gold, white, and black design system.

## 1.4 Significance of the Study

This study is significant to the following stakeholders:

- **M.C Dental Clinic (Management & Staff)** — The system eliminates manual scheduling inefficiencies, reduces administrative overhead, and provides real-time operational analytics. Staff can manage appointments, patients, doctors, and schedules from a single integrated platform, significantly improving productivity and reducing human error.

- **Patients** — The system offers patients the convenience of online appointment booking, self-service appointment management (rescheduling, cancellation requests), digital access to their medical history, and timely notifications. The integrated health screening questionnaire streamlines the pre-visit process.

- **Dental Practitioners/Doctors** — Doctors benefit from organized schedules, accessible patient histories and treatment records at the point of care, and a clear overview of daily appointments. This supports better clinical decision-making and continuity of care.

- **Future Researchers and Developers** — This project serves as a reference model for developing healthcare management systems using modern web technologies (React, Next.js, Supabase). The modular architecture and documented design system can be adapted for other clinic or healthcare settings.

- **The IT/CS Academic Community** — This study contributes a comprehensive, real-world case study of full-stack web application development applied to the healthcare domain, demonstrating best practices in UI/UX design, API architecture, role-based access control, and cloud-native database management.

## 1.5 Scope and Delimitations

**Scope:**
The M.C Dental Clinic Appointment Management System covers the following core functionalities:

- User authentication and registration (Admin, Staff, Patient roles) with JWT-based session management and email verification.
- Online appointment booking with calendar-based date selection, time slot availability checking, health screening questionnaire, and multi-service selection.
- Appointment lifecycle management including status tracking (pending, confirmed, completed, cancelled, no_show), cancellation/reschedule request workflows, and payment status tracking.
- Patient records management including demographic profiles, medical history with treatment notes and visit images, and patient image galleries.
- Doctor and schedule management including doctor profiles, day-of-week availability, and clinic-wide operating hours/holiday configuration.
- Service and promotion catalog management with CRUD operations, pricing, validity periods, and active/inactive status control.
- Smile Gallery (before/after case studies) for public display and administrative management.
- Real-time notification system covering appointment events, administrative actions, and system activities.
- Comprehensive audit logging with user activity tracking, IP address logging, and export functionality.
- Role-based dashboards providing tailored interfaces for Admin, Staff, and Patient users.
- Public-facing website with Homepage, Services, About, Contact, Gallery, and Booking pages.
- Responsive web design with dark mode support.

**Delimitations:**
The following features are explicitly outside the scope of the current system iteration. Each exclusion reflects either resource constraints within the project timeline, complexity requiring dedicated integration work, or a deliberate decision to maintain system focus on core clinic operations:

- **Online Payment Integration (GCash, PayMaya, etc.)** — Excluded due to the regulatory and technical complexity of third-party payment gateway compliance; recommended as a priority enhancement in future iterations (see Section 4.2).
- **Telemedicine or Remote Consultations** — Outside scope as M.C. Dental Clinic's services are inherently hands-on and require physical patient presence.
- **Electronic Prescriptions** — Requires integration with Philippine regulatory frameworks (e.g., DOH e-prescription standards) beyond the current project's academic timeline.
- **Multi-Branch Support** — The current database schema is designed for a single clinic location; multi-branch architecture requires schema restructuring recommended for future development.
- **SMS or Push Notifications** — Excluded due to costs associated with SMS API providers (e.g., Semaphore, Vonage); the system uses in-app notifications as a functional substitute.
- **Insurance Integration (PhilHealth, etc.)** — Requires access to government API infrastructure not available within the project's scope.
- **Inventory Management** — Dental supply inventory is managed separately by clinic administration and falls outside appointment and records management functions.

---

# PART II. REVIEW OF RELATED LITERATURE

## 2.1 Related Literature

### 2.1.1 Local

**Philippine Health Information Exchange (PHIE)** — The Department of Health's initiative to digitize health records across the Philippines has underscored the importance of electronic health record (EHR) systems in improving healthcare delivery. While PHIE focuses on large-scale national interoperability, its principles of digitized patient records and standardized data management directly inform the patient management module of this system (Department of Health, 2020).

**E-Health in Philippine Healthcare Settings** — Studies by the Philippine Institute for Development Studies (PIDS) have documented the slow but steady adoption of digital health tools in Philippine hospitals and clinics. Challenges such as limited IT infrastructure, low digital literacy among staff, and high implementation costs have been identified as barriers. However, web-based systems with intuitive interfaces — such as the M.C Dental Clinic system — are cited as practical solutions for small and medium healthcare facilities transitioning from manual to digital workflows (Albert et al., 2021).

**Digital Transformation in Philippine Dental Practice** — Local dental conferences and journals have highlighted the growing demand for online appointment booking in Filipino dental clinics, particularly post-pandemic. The University of the Philippines Manila College of Dentistry noted that patients increasingly expect digital touchpoints and self-service booking capabilities, reinforcing the relevance of this project's online scheduling module (UP Manila, 2022).

### 2.1.2 Foreign

**Electronic Dental Record Systems** — The American Dental Association (ADA) has long advocated for the adoption of electronic dental records to improve care continuity, data accuracy, and operational efficiency. Research published in the *Journal of Dental Research* demonstrates that clinics using digital record systems experience a 30–40% reduction in administrative time and significant improvements in patient data accuracy (Hogarth, 2010).

**Online Appointment Scheduling in Healthcare** — A systematic review by Zhao et al. (2017) in the *Journal of Medical Internet Research* found that online appointment systems reduce no-show rates by up to 25% and improve patient satisfaction scores by providing convenience and autonomy. The study highlights key features — real-time availability, automated reminders, and self-service rescheduling — that are all incorporated into the M.C Dental Clinic system.

**Role-Based Access Control (RBAC) in Healthcare IT** — Research by Ferraiolo and Kuhn (2019) in the *ACM Computing Surveys* establishes RBAC as the standard access control model for healthcare information systems. The principle of granting system permissions based on user roles (e.g., admin, staff, patient) ensures data privacy, regulatory compliance, and operational security — a model directly implemented in this system's three-tier role architecture.

## 2.2 Related Study

### 2.2.1 Local

**"Development of a Web-Based Dental Clinic Management System"** — A study by Santos et al. (2023), conducted at Polytechnic University of the Philippines, developed a web-based clinic management system using PHP and MySQL. The system featured patient records management and appointment scheduling but lacked real-time notifications, role-based dashboards, and modern UI/UX design. The M.C Dental Clinic system extends this work by implementing a modern tech stack (React, Next.js, Supabase), comprehensive audit logging, and a premium design system.

**"Automated Appointment and Patient Records System for Local Health Centers"** — Reyes and Cruz (2022) at Technological University of the Philippines implemented an automated records system for barangay health centers. Their study demonstrated the feasibility of digital health systems in local Philippine settings but identified usability and responsiveness as key challenges. The current project addresses these concerns through responsive web design, dark mode, and a carefully engineered design system.

### 2.2.2 Foreign

**"Cloud-Based Dental Practice Management System Using Microservices Architecture"** — Kim and Park (2022) developed a cloud-based dental management system deployed on AWS using a microservices approach. Their system demonstrated the scalability benefits of cloud infrastructure for healthcare applications. The M.C Dental Clinic system similarly leverages cloud services through Supabase (hosted PostgreSQL) but adopts a monolithic API approach using Next.js API routes for simplified deployment and maintenance.

**"Patient-Centered Design in Healthcare Appointment Systems"** — Johnson et al. (2021), published in *BMC Medical Informatics and Decision Making*, studied patient preferences in appointment booking interfaces. Their findings emphasized the importance of calendar-based date selection, clear time slot visualization, and minimal-step booking flows — design principles that directly influenced the M.C Dental Clinic booking module's user experience.

## 2.3 Synthesis of the Reviewed Literatures and Studies

The reviewed literature and studies collectively establish several key insights that inform the development of the M.C Dental Clinic Appointment Management System:

1. **Digital transformation is necessary but underserved** — Both local and foreign sources confirm that dental clinics benefit significantly from digital management systems, yet many Philippine clinics still rely on manual processes. The gap between recognized need and actual adoption creates a clear opportunity for practical, affordable solutions.

2. **Modern web technologies enable rapid development** — Cloud-native databases (Supabase/PostgreSQL), component-based frontend frameworks (React), and API-first backend architectures (Next.js) allow small teams to build comprehensive systems that were previously available only as expensive enterprise products.

3. **Patient self-service is essential** — Online booking, real-time availability, self-service rescheduling, and digital health screening are no longer premium features but baseline expectations, particularly in the post-pandemic landscape.

4. **Role-based access control is the standard** — Implementing distinct dashboards and permissions for administrators, staff, and patients ensures data security, operational clarity, and a tailored user experience for each role.

5. **UI/UX quality directly impacts adoption** — Studies consistently show that professional, responsive, and aesthetically pleasing interfaces drive user adoption and satisfaction. The premium design system (gold, white, black theme) with dark mode and micro-animations addresses this directly.

6. **Audit and compliance capabilities are critical** — Comprehensive activity logging and reporting are essential for healthcare systems to maintain accountability, support clinical decision-making, and comply with data privacy regulations.

The M.C Dental Clinic system synthesizes these insights into a cohesive platform that combines modern technology, patient-centered design, and comprehensive clinic management functionality.

---

# PART III. METHODS, APPROACH AND PROCEDURE

## 3.1 Project Development Model — Agile-Iterative Methodology

### 3.1.1 Overview and Justification

The M.C Dental Clinic Appointment Management System was developed using the Agile-Iterative Development Model. This methodology was chosen specifically to handle the continuous evolution of clinic requirements by breaking the entire project lifecycle down into small, manageable, time-boxed increments known as sprints. By prioritizing iterative delivery over rigid, linear planning, the development team could continuously integrate stakeholder feedback and ensure the expanding feature set—from patient profiles to scheduling logistics—remained fully aligned with the clinic's operational needs.

The agile-iterative approach provided unmatched adaptability. The modular nature of the system meant that core components, such as user authentication and foundational patient records, could be deployed in early iterations. Once these primary features established a functional baseline, subsequent iterations incrementally added more complex capabilities, such as service catalogs, doctor schedules, comprehensive reporting, and real-time notifications. This incremental rollout mitigated deployment risks, as technical integrations with cloud infrastructure, like Supabase and Vercel, were verified sprint by sprint rather than deferred to a final release phase.

### 3.1.2 The Iterative Sprint Framework

The project's execution was driven by a continuous cycle of two-week iterations. Each sprint functioned as a self-contained mini-project, containing phases for planning, execution, review, and reflection.

At the beginning of each iteration, a sprint planning session established clear deliverables based on the current priorities in the product backlog. User requirements were broken down into actionable stories, with specific focus on how they contributed to the appointment scheduling workflow and the clinic's administrative efficiency. Effort was estimated, and tasks across the frontend and backend architectures were assigned to developers for parallel execution.

Daily synchronization ensured the team remained aligned on immediate priorities, identified potential bottlenecks, and facilitated rapid course correction. This continuous communication was essential for maintaining momentum, especially when integrating the API boundaries between the Next.js backend and the React interfaces.

At the close of each sprint, the development team presented a functioning product increment to stakeholders. These sprint reviews were critical touchpoints for demonstrating tangible progress—such as a working booking calendar or an active notification feed—and gathering immediate, actionable feedback. Based on these demonstrations, the project backlog was dynamically adjusted to accommodate necessary changes or enhancements identified by the clinic. Finally, each iteration concluded with a retrospective to analyze workflows, improve development strategies, and refine the execution plan for the subsequent sprint.

### 3.1.3 Iterative Development Phases

The agile-iterative process naturally segmented the project's evolution into cohesive development phases, each spanning multiple sprints to construct distinct layers of the system.

The project initiated with a foundational planning and analysis phase. Initial iterations were dedicated to gathering requirements, conducting stakeholder interviews, establishing the technology stack, and designing the core architecture. The output of these early sprints formed the database schema and the initial API contracts, laying the necessary groundwork for future development. 

Following the planning iterations, the design phase focused on establishing the system's aesthetic and structural identity. These sprints resulted in comprehensive wireframes, the definition of a premium gold, white, and black design system, and the setup of the base component library to ensure visual consistency across all modules.

With the foundation established, the core development iterations commenced. These highly focused sprints systematically built the system's most crucial functionalities. Early iterations delivered the authentication module, including secure login, registration, and session management. Subsequent sprints sequentially deployed the appointment booking engine, integrating calendar pickers and health questionnaires, followed by the patient management features that enabled digital record-keeping and medical history tracking.

As the core system stabilized, the iterative cycle transitioned to extended development. Sprints in this phase expanded the system's administrative capabilities. Developers iteratively rolled out comprehensive role-based dashboards for administrators and staff, integrated service and promotion catalogs, and established robust doctor and clinic schedule management to ensure the online availability accurately reflected clinic realities.

The enhancement iterations further enriched the operational workflow. Sprints during this phase introduced a real-time notification system to keep patients and staff informed of appointment changes, implemented an exhaustive audit logging system to track user activities for accountability, and added a visual smile gallery to showcase dental transformations.

The final iterations were dedicated exclusively to polish and testing. These sprints focused on rigorous quality assurance, executing cross-viewport responsive design testing, finalizing dark mode support, and refining the user interface aesthetics. Feedback from final usability evaluations was incrementally addressed, ensuring the ultimate delivery was a production-ready, highly dependable appointment management platform.

### 3.1.4 Definition of Done Across Iterations

To guarantee the quality of each iterative release, strict acceptance criteria were enforced before any feature was classified as complete within a sprint. 

For an iteration task to be marked complete, the underlying code had to be fully written, typed using TypeScript, and committed to the repository without compilation errors. All backend API endpoints required rigorous runtime data validation using Zod schemas to ensure structural integrity. Furthermore, the API had to be practically functional, delivering correct responses and gracefully handling operational errors.

On the frontend, the feature needed complete integration with the backend architecture, seamlessly managing state and providing accurate data representation to the user. The implemented feature was required to strictly adhere to the role-based security models, enforcing access restrictions based on the active user profile. Additionally, the interface had to rigidly conform to the established design system, utilizing the defined color tokens, functioning seamlessly across mobile and desktop breakpoints, and rendering accurately in both light and dark themes. When all these strict criteria, alongside comprehensive peer code reviews and stakeholder acceptance, were met, the iteration's increment was considered finalized and ready for integration.

## 3.2 Flowchart

### System Architecture Flowchart

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              React 19 + Vite Frontend                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │   │
│  │  │ Public   │ │ Auth     │ │ Booking  │ │ Dashboard     │   │   │
│  │  │ Pages    │ │ Module   │ │ Module   │ │ Module        │   │   │
│  │  │ (Home,   │ │ (Login,  │ │ (Calendar│ │ (Admin/Staff/ │   │   │
│  │  │ Services,│ │ Register,│ │ Slots,   │ │  Patient)     │   │   │
│  │  │ About,   │ │ Verify)  │ │ Health   │ │               │   │   │
│  │  │ Contact, │ │          │ │ Screen)  │ │               │   │   │
│  │  │ Gallery) │ │          │ │          │ │               │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────┘   │   │
│  │            Zustand (State) │ React Router (Navigation)       │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ HTTP/REST API Calls
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Next.js 16 API Backend                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    API Routes (/api/*)                        │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐               │   │
│  │  │ /auth      │ │/appointments│ │ /patients  │               │   │
│  │  │ /doctors   │ │ /services  │ │ /schedules │               │   │
│  │  │ /gallery   │ │ /promotions│ │/notifications│              │   │
│  │  │/audit-logs │ │ /staff     │ │ /settings  │               │   │
│  │  │ /medical-  │ │ /patient-  │ │ /clinic-   │               │   │
│  │  │  history   │ │  images    │ │  schedule  │               │   │
│  │  └────────────┘ └────────────┘ └────────────┘               │   │
│  │          JWT Authentication │ Zod Validation                 │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ Supabase Client SDK
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  users │ patients │ doctors │ services │ appointments        │   │
│  │  schedules │ medical_history │ patient_images │ promotions   │   │
│  │  notifications │ audit_logs │ gallery_cases │ site_settings  │   │
│  │  appointment_services (junction table)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                    Supabase Storage (Images)                         │
│                    Supabase Auth (Email Verification)                │
└─────────────────────────────────────────────────────────────────────┘
```

### Appointment Booking Flowchart

```
  ┌─────────────┐
  │   Patient    │
  │ Visits Site  │
  └──────┬──────┘
         ▼
  ┌──────────────┐    No    ┌──────────────┐
  │  Logged In?  ├────────► │ Guest Booking │
  └──────┬───────┘          │   (Name,     │
         │ Yes              │  Email, Phone)│
         ▼                  └──────┬───────┘
  ┌──────────────┐                 │
  │ Select Date  │◄────────────────┘
  │ (Calendar)   │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Select Time  │
  │   Slot       │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   Select     │
  │  Service(s)  │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   Select     │
  │  Doctor      │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Health       │
  │ Screening    │
  │ Questionnaire│
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   Confirm    │
  │  Booking     │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Appointment  │
  │ Created      │
  │ (Pending)    │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │ Notification │
  │ Sent to      │
  │ Staff/Admin  │
  └──────────────┘
```

### User Role Authentication Flowchart

```
  ┌─────────────┐
  │   User       │
  │  Accesses    │
  │   System     │
  └──────┬──────┘
         ▼
  ┌──────────────┐
  │   Login /    │
  │  Register    │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │   JWT Token  │
  │  Generated   │
  └──────┬───────┘
         ▼
  ┌──────────────┐
  │  Check User  │
  │    Role      │
  └──────┬───────┘
         ├──── Admin ────► Admin Dashboard
         │                 (Full System Access)
         ├──── Staff ────► Staff Dashboard
         │                 (Appointments, Patients)
         └──── Patient ──► Patient Dashboard
                           (My Appointments, History)
```

## 3.3 Technical Feasibility

### Hardware Requirements

**Development Environment:**

| Component | Minimum Requirement | Recommended |
|-----------|-------------------|-------------|
| Processor | Intel Core i3 / AMD Ryzen 3 | Intel Core i5 / AMD Ryzen 5 or higher |
| RAM | 4 GB | 8 GB or higher |
| Storage | 10 GB free space | 20 GB SSD |
| Display | 1366 × 768 resolution | 1920 × 1080 or higher |
| Network | Broadband Internet connection | Stable broadband (10+ Mbps) |

**Client (End User):**

| Component | Minimum Requirement |
|-----------|-------------------|
| Device | Any device with a modern web browser (PC, Laptop, Tablet, Smartphone) |
| Browser | Google Chrome 90+, Mozilla Firefox 88+, Safari 14+, Microsoft Edge 90+ |
| Network | Internet connection (3G or higher for mobile) |
| Display | 320px minimum width (mobile responsive) |

**Server/Hosting:**

| Component | Specification |
|-----------|--------------|
| Frontend Hosting | Netlify (Static site hosting with CDN) |
| Backend Hosting | Vercel (Serverless functions for Next.js API routes) |
| Database | Supabase Free/Pro tier (Managed PostgreSQL) |
| File Storage | Supabase Storage (Image uploads) |

### Software Requirements

**Frontend Technology Stack:**

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | ≥ 24.0.0 | JavaScript runtime |
| React | 19.2.0 | UI component library |
| TypeScript | ~5.9.3 | Type-safe JavaScript |
| Vite | 7.2.2 | Frontend build tool and dev server |
| React Router DOM | 7.9.6 | Client-side routing and navigation |
| Zustand | 5.0.8 | Lightweight state management |
| Tailwind CSS | 3.4.13 | Utility-first CSS framework |
| shadcn-ui / Radix UI | Latest | Accessible component library |
| Chart.js | 4.5.1 | Chart and graph visualization |
| Recharts | 3.4.1 | React-based chart components |
| Lucide React | 0.554.0 | Icon library |
| Axios | Latest | HTTP client for API calls |
| React Hot Toast | 2.6.0 | Toast notifications |

**Backend Technology Stack:**

| Software | Version | Purpose |
|----------|---------|---------|
| Next.js | 16.1.6 | API routing framework (serverless) |
| TypeScript | ^5 | Type-safe development |
| Supabase JS | 2.84.0 | Database client SDK |
| JSON Web Token | 9.0.2 | Authentication tokens |
| Resend | 6.5.2 | Transactional email service |
| Zod | 4.1.13 | Schema validation for API inputs |

**Database & Infrastructure:**

| Software | Purpose |
|----------|---------|
| Supabase | Managed PostgreSQL database, authentication, and file storage |
| PostgreSQL | Relational database (via Supabase) |
| Git | Version control |
| npm | Package management |

**Development Tools:**

| Tool | Purpose |
|------|---------|
| Visual Studio Code | Primary code editor / IDE |
| ESLint | JavaScript/TypeScript linting |
| PostCSS + Autoprefixer | CSS processing |
| Terser | JavaScript minification (production builds) |

## 3.4 User Interface Design (Module by Module)

The system employs a premium **Gold, White, and Black** design system across all modules, ensuring visual consistency, professionalism, and brand identity.

**Design System Foundation:**
- **Primary Accent**: Gold (#D4AF37) — interactive elements, buttons, highlights
- **Text/Dark Backgrounds**: Black (#1A1A1A) — text, sidebars, footers
- **Content Backgrounds**: White (#FFFFFF) — cards, content areas, main backgrounds
- **Dark Mode**: Full dark mode support with automatic theme toggling

---

### Module 1: Public-Facing Pages

**Homepage**
- Hero section with gold call-to-action buttons ("Book Appointment")
- Features showcase with premium cards and gold accent lines
- "How It Works" three-step section with gold step numbers
- Gold CTA section for conversion

**Services Page**
- Service listing cards with gold hover effects
- Active promotions display with premium promo cards
- Gold section titles with decorative accent lines

**About Page**
- Mission section with gold headings
- Value cards with gold icon accents
- Team member cards with gold highlights
- Statistics section with gold gradient background

**Contact Page**
- Contact form with gold accent line and focus states
- Info items with gold icons
- Embedded map section with gold borders
- Action cards with gold hover effects

**Gallery Page (Smile Gallery)**
- Before/after dental case slider with smooth drag animations
- Treatment type filtering and categorization
- Case descriptions with gold accents

---

### Module 2: Authentication Interface

**Login Page**
- Clean white card with gold accent border
- Email and password input fields with gold focus states
- Gold primary login button with gradient
- "Forgot Password" link
- Registration link for new patients

**Registration Page**
- Multi-field registration form (name, email, phone, address, date of birth, gender)
- Philippine address selector (Region → Province → City → Barangay cascade)
- Password strength indicator
- Gold "Create Account" button
- Email verification flow

---

### Module 3: Appointment Booking Interface

- Calendar-based date picker with disabled past dates (grayed out)
- Available time slot grid based on doctor and clinic schedules
- Service selection with checkboxes and pricing display
- Doctor selection dropdown
- Health screening questionnaire (multi-question form, required)
- Promotion code/selection integration
- Booking confirmation summary with gold "Confirm" button

---

### Module 4: Admin Dashboard

**Sidebar Navigation** — Black sidebar with gold active state indicators and gold hover effects.

| Tab | Functionality |
|-----|--------------|
| **Dashboard** | Overview statistics, charts (appointments, revenue, patients), quick actions |
| **Appointments** | Full appointment list, status filtering, approve/reject/complete workflows, payment tracking |
| **Patients** | Patient list with search/filter, detailed profiles, medical history viewer, image management |
| **Services** | Service CRUD, pricing management, active/inactive toggle |
| **Reports** | Revenue analytics, appointment statistics, patient reports, exportable charts |
| **Doctors** | Doctor profile management, specialization, active status |
| **Staff** | Staff member CRUD, job titles, role assignment |
| **Schedules** | Doctor-specific schedule management (day/time slots) |
| **Clinic Schedule** | Clinic-wide hours, break times, holiday management |
| **Promotions** | Promotion CRUD, discount percentages, validity dates |
| **Gallery** | Before/after case management, treatment categorization |
| **Audit Logs** | Activity log viewer with filtering, user tracking, export |
| **Settings** | Site configuration, email templates, display preferences |

---

### Module 5: Staff Dashboard

Same sidebar structure as Admin with restricted access:

| Tab | Functionality |
|-----|--------------|
| **Appointments** | View and manage appointments, process requests |
| **Patients** | Patient management, record updates |
| **Services** | View and manage services |
| **Doctors** | View doctor information |
| **Schedules** | Manage schedules |
| **Clinic Schedule** | View/manage clinic hours |
| **Promotions** | Manage promotions |
| **Gallery** | Manage gallery cases |
| **Settings** | Personal settings |

---

### Module 6: Patient Dashboard

Simplified, patient-focused interface with a reassuring design:

| Tab | Functionality |
|-----|--------------|
| **My Appointments** | View upcoming/past appointments, request cancellation/reschedule |
| **Medical History** | View treatment records, visit history, uploaded images |
| **Profile** | Edit personal information, profile image, Philippine address |
| **Clinic Hours** | View clinic operating hours and schedule |

---

## 3.5 Testing and Evaluation

### Usability Testing — System Usability Scale (SUS)

The System Usability Scale (SUS) will be used to evaluate the overall usability of the M.C Dental Clinic system. SUS is a ten-item Likert scale questionnaire that provides a reliable, standardized measure of perceived usability.

**SUS Questionnaire Items:**
1. I think I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think I would need the support of a technical person to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

**SUS Scoring:** Each item is scored from 1 (Strongly Disagree) to 5 (Strongly Agree). The SUS score is calculated on a 0–100 scale, where a score above 68 is considered above average usability.

**Test Participants:** A minimum of 10 respondents representing the three user roles (Admin, Staff, Patient) will participate in usability testing.

**Survey Administration:** The SUS survey will be administered via an online form to the sample group of end-users (patients and clinic staff) following a guided usability testing session.

---

### ISO 25010 Software Quality Model

The system will be evaluated against the **ISO/IEC 25010:2011** software product quality model across the following characteristics:

| Quality Characteristic | Sub-Characteristic | Evaluation Criteria |
|----------------------|-------------------|-------------------|
| **Functional Suitability** | Functional Completeness | All specified modules and features are implemented and operational |
| | Functional Correctness | Appointment booking, patient records, and scheduling produce correct and expected results |
| | Functional Appropriateness | System functions align with M.C Dental Clinic's operational needs |
| **Performance Efficiency** | Time Behavior | Page load times under 3 seconds; API responses under 500ms |
| | Resource Utilization | Efficient use of browser memory and network bandwidth |
| **Compatibility** | Co-existence | System operates alongside other clinic tools without interference |
| | Interoperability | RESTful API design allows future integration with third-party systems |
| **Usability** | Appropriateness Recognizability | Users can immediately identify system purpose and navigation |
| | Learnability | New users can perform core tasks within 10 minutes of first use |
| | Operability | Consistent UI patterns, responsive design, keyboard accessibility |
| | User Interface Aesthetics | Premium gold/white/black design system with dark mode support |
| | Accessibility | High contrast ratios, semantic HTML, clear typography |
| **Reliability** | Maturity | System operates without critical failures during normal use |
| | Availability | 99.9% uptime target through Supabase/Vercel infrastructure |
| | Fault Tolerance | Graceful error handling with user-friendly error messages |
| **Security** | Confidentiality | JWT authentication, role-based access control, encrypted data transmission |
| | Integrity | Zod schema validation prevents malformed data entry |
| | Accountability | Comprehensive audit logging with user identity and IP tracking |
| **Maintainability** | Modularity | Feature-based folder structure, reusable components, separated concerns |
| | Reusability | Shared design system CSS, utility functions, TypeScript types |
| | Analysability | Clear code organization, TypeScript types, ESLint enforcement |
| | Modifiability | Component-based React architecture enables isolated updates |
| | Testability | API routes independently testable; modular frontend components |
| **Portability** | Adaptability | Responsive design adapts to desktop, tablet, and mobile viewports |
| | Installability | Cloud-hosted (Netlify/Vercel/Supabase) — no local server installation required |

---

### Testing Methodology

**Functional Testing:**
- Verify all CRUD operations across modules (appointments, patients, services, doctors, staff, promotions, gallery)
- Test appointment workflow: booking → confirmation → completion/cancellation
- Validate role-based access control (Admin, Staff, Patient permissions)
- Test health screening questionnaire flow
- Verify notification delivery for all event types
- Test payment status tracking and updates

**Responsive Design Testing:**
- Test across viewports: 320px (mobile), 768px (tablet), 1024px (small desktop), 1920px (full desktop)
- Validate touch interactions on mobile devices
- Verify dark mode rendering on all pages and dashboards

**Cross-Browser Testing:**
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest, macOS/iOS)

**Performance Testing:**
- Measure initial page load time (target: < 3 seconds)
- Measure API response times (target: < 500ms)
- Test with concurrent users to evaluate Supabase connection pool behavior

**Security Testing:**
- Verify JWT token expiration and refresh mechanisms
- Test role-based route protection (unauthorized access attempts)
- Validate API input sanitization via Zod schemas
- Test CORS configuration for API security

---

*Document prepared for M.C Dental Clinic — Appointment Management System*
*SOFE312 Project Documentation — April 2026*
