CheckInBuddy Development Documentation
Last Updated: June 6, 2025

Guiding Principle for AI-Assisted Development: This project leverages Cursor.ai for accelerated development. To ensure speed does not lead to unmanageable technical debt, this document serves as the primary Product Requirements Document (PRD) and technical specification. All AI-generated code must be guided by, and validated against, the principles, structures, and checklists herein. Real-time, per-commit code reviews are critical.

1. Project Overview
1.1 App Idea: CheckInBuddy
CheckInBuddy is a mobile application that solves a regulatory pain point for Airbnb hosts in Italy, where hosts must physically check in guests and verify their documents due to local laws. The app connects individual Airbnb hosts with local agents (similar to gig economy workers) who can perform these check-ins for a fee. Hosts create check-in requests specifying the property address, guest details, and time, and nearby agents accept and complete the task, including document verification. The app ensures secure, temporary document storage (48 hours), processes payments, and sends notifications. The MVP focuses on core functionality, with a fixed fee per check-in and potential for dynamic pricing and geographic expansion later.

Key Features (MVP):

User authentication (hosts and agents).
Check-in request creation and assignment.
Secure document upload and 48-hour deletion.
Fixed-fee payments and agent payouts.
Push and email notifications.
Basic geospatial queries for nearby requests.
Cross-platform mobile app (iOS/Android).
Target Audience: Individual Airbnb hosts in Italy initially, with agents as gig workers.
Geographic Scope: Italy for MVP, designed for multi-country support (e.g., multi-currency, translatable UI).
Pricing: Fixed fee per check-in (e.g., €20, with 20% platform fee), with hooks for dynamic pricing later.

1.2 Goals
Scalability: Use a modular monolith architecture to ensure maintainability and future extraction to microservices.
Cost-Effectiveness: Leverage free/low-cost tools (e.g., Firebase free tier, DigitalOcean) and minimize infrastructure costs (~€30/month).
Speed (AI-Enhanced): Deliver MVP in 3-4 weeks using Cursor.ai for code generation and debugging, augmented by rigorous review processes.
Reliability & Quality: Prevent AI "hallucinations" and maintain code quality by providing clear specifications (this document), detailed dependency lists, checklists, and implementing real-time code reviews.
Performance: Optimize database queries, cache frequent data, and use lightweight frameworks.
2. Development Plan
2.1 Tech Stack
To ensure clarity and prevent Cursor.ai from suggesting incompatible tools or deviating from project requirements, the tech stack is fixed.

Important Note on AI-Optimized Stacks: While guides on AI-assisted coding may showcase specific stacks (e.g., Supabase/Vercel) optimized for certain AI workflows, this CheckInBuddy project utilizes a distinct, pre-defined backend and deployment stack (NestJS/PostgreSQL/DigitalOcean) tailored to its specific requirements. The principles of structured AI-assisted development, clear prompting, and quality assurance tools (like CodeRabbit) are universally applicable and will be adopted here.

Development Environment Note: Initial mobile app development for both Android and iOS can be performed on Windows (e.g., Surface Pro 7), Linux, or macOS.

For Android: Development, testing (emulator/physical device), and builds can be done directly on Windows.
For iOS on Windows:
JavaScript/UI development can be tested live on a physical iPhone using the Expo Go app or a custom development build.
Native iOS application builds (.ipa files for testing and App Store) will be generated using a cloud service like Expo Application Services (EAS) Build.
A macOS machine becomes more critical for local iOS simulator testing, deep native iOS debugging (Swift/Objective-C), and certain advanced App Store submission/configuration steps if not fully automated by cloud services.
Design & Theming Note:

Color Palette: The frontend application will use a pastel color palette. The theme should feel modern, clean, and friendly. Primary colors could be a soft blue, mint green, or light coral, with neutral grays and off-whites for backgrounds and text. NativeBase's theming capabilities will be used to implement this.
Dependencies (to be explicitly included in package.json or equivalent):

Backend (NestJS v10.x):

@nestjs/core: ^10.0.0
@nestjs/typeorm: ^10.0.0
typeorm: ^0.3.17
pg: ^8.11.3
@nestjs/schedule: ^4.0.0
aws-sdk: ^2.1500.0 (or @aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
stripe: ^14.0.0
firebase-admin: ^12.0.0
@mapbox/mapbox-sdk: ^0.15.3
class-validator: ^0.14.0, class-transformer: ^0.5.1
@nestjs/config: ^3.0.0, @nestjs/throttler: ^5.0.0
passport: ^0.7.0, @nestjs/passport: ^10.0.0, passport-firebase-jwt: ^1.2.1
Frontend (React Native 0.74.x, React 18.x, Expo ~51.x):

react: 18.2.0, react-native: 0.74.0
native-base: ^3.4.28
@react-navigation/native: ^6.1.9, @react-navigation/stack: ^6.3.20
firebase: ^10.7.0 (client SDK)
@rnmapbox/maps: ^10.1.15
axios: ^1.6.0
react-native-document-picker: ^9.1.0, react-native-fs: ^2.20.0
@stripe/stripe-react-native: ^0.35.0
expo: ~51.0.0 (or latest stable compatible with RN 0.74.x)
expo-dev-client: ~4.0.0
Dev Tools:

jest: ^29.7.0, @nestjs/testing: ^10.0.0
@testing-library/react-native: ^12.4.3
eslint: ^8.50.0, prettier: ^3.0.0
typescript: ^5.2.2
ts-node: ^10.9.1
eas-cli: (globally installed, latest version)
CodeRabbit IDE Extension (Highly Recommended): For real-time, per-commit AI-powered code reviews directly in Cursor/VS Code.
2.2 Modular Monolith Architecture
The backend will be a modular monolith to ensure scalability and ease of development. Each module is isolated and can be extracted to a microservice later if needed.

Modules:

Auth: User signup, login, and role management (host/agent).
User: User profile management, agent location updates.
CheckIn: Check-in request creation, assignment, status updates, geospatial matching.
Document: Document upload, storage, and scheduled deletion (48 hours).
Payment: Payment processing and agent payouts.
Notification: Push and email notifications.
Directory Structure Suggestion (backend src/):

src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── dto/
│   ├── guards/
│   └── strategies/
├── user/
│   ├── user.module.ts
│   ├── user.service.ts
│   ├── user.controller.ts
│   └── entities/
│       └── user.entity.ts
├── check-in/
│   ├── check-in.module.ts
│   ├── check-in.service.ts
│   ├── check-in.controller.ts
│   ├── dto/
│   └── entities/
│       └── check-in-request.entity.ts
├── document/
│   ├── document.module.ts
│   ├── document.service.ts
│   ├── document.controller.ts
│   ├── dto/
│   └── entities/
│       └── document.entity.ts
├── payment/
│   ├── payment.module.ts
│   ├── payment.service.ts
│   ├── payment.controller.ts
│   └── dto/
├── notification/
│   ├── notification.module.ts
│   ├── notification.service.ts
├── core/ (or shared/)
│   └── core.module.ts (for common services, configs)
├── main.ts
└── app.module.ts
2.3 Database Schema
To prevent Cursor.ai from generating incorrect schemas, the following PostgreSQL schema is fixed. Ensure extensions are enabled first: CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; and CREATE EXTENSION IF NOT EXISTS postgis;.

SQL

-- Users (hosts and agents)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('host', 'agent') NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- Agent location, 4326 is WGS84
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  stripe_account_id VARCHAR(255) NULL, -- For Stripe Connect payouts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Check-In Requests
CREATE TABLE check_in_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL NULL,
  property_address TEXT NOT NULL,
  property_location GEOGRAPHY(POINT, 4326) NULL, -- Geocoded address
  guest_name VARCHAR(255) NOT NULL,
  guest_count INT DEFAULT 1,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled_host', 'cancelled_agent', 'expired') DEFAULT 'pending',
  fee DECIMAL(10,2) DEFAULT 20.00, -- EUR
  platform_fee DECIMAL(10,2) GENERATED ALWAYS AS (fee * 0.20) STORED,
  agent_payout DECIMAL(10,2) GENERATED ALWAYS AS (fee * 0.80) STORED,
  payment_intent_id VARCHAR(255) NULL,
  cancellation_reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_request_id UUID REFERENCES check_in_requests(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_key VARCHAR(1024) NOT NULL, -- S3 object key
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- For cron job
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Geospatial indexes
CREATE INDEX users_location_idx ON users USING GIST (location);
CREATE INDEX check_in_requests_property_location_idx ON check_in_requests USING GIST (property_location);

-- Other useful indexes
CREATE INDEX users_firebase_uid_idx ON users (firebase_uid);
CREATE INDEX check_in_requests_status_idx ON check_in_requests (status);
CREATE INDEX documents_expires_at_idx ON documents (expires_at);

-- Function and Triggers for auto-updating timestamp columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_check_in_requests BEFORE UPDATE ON check_in_requests FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
2.4 Performance Considerations
Database:
Index key columns for fast lookups: users.email, users.firebase_uid, check_in_requests.status, etc.
Use geospatial indexes (GIST) on users.location and check_in_requests.property_location for efficient nearby queries.
Limit document uploads to 5MB and validate file types (JPEG, PNG, PDF) on both client and server.
Backend:
Cache nearby agent queries with Redis (optional for v2).
Use connection pooling in TypeORM.
Implement rate limiting on APIs (e.g., 100 requests/minute per user) using @nestjs/throttler.
Use DTOs with class-validator for robust input validation.
Frontend:
Lazy-load Mapbox maps and other non-critical components.
Use React Native’s FlatList or SectionList for rendering long lists.
Optimize image loading and caching.
Storage:
Use AWS S3 pre-signed URLs for secure, time-limited document uploads/downloads.
Schedule document deletion hourly to minimize storage costs.
Notifications:
Batch FCM notifications where applicable to reduce API calls.
Fallback to email for critical alerts.
2.5 Development Workflow with Cursor.ai (Enhanced with "Vibe Coding" Best Practices)
Cursor.ai, with its "vibe coding" capabilities, allows for rapid code generation. However, to prevent technical debt, a structured approach is mandatory. Treat Cursor.ai as a "supercharged junior developer" – fast and capable, but requires clear guidance, guardrails, and diligent review.

This Document as the "Single Source of Truth": This DEVELOPMENT.md serves as your detailed Product Requirements Document (PRD) and technical specification. All prompts to Cursor.ai must align with the requirements, schemas, and architectural decisions outlined here.
Scoped Task Breakdown: Break down features from the "Development Checklist" (Section 3) into smaller, well-defined tasks suitable for clear prompting.
Clear and Precise Prompts: Avoid vague descriptions. Be explicit about expected inputs, outputs, error handling, validation logic, and adherence to established patterns within the project.
CRITICAL - Real-Time, Per-Commit Code Reviews:
Tooling: Utilize an AI-powered code review tool like CodeRabbit (IDE extension compatible with Cursor/VS Code) for every commit.
Process: Before committing code generated or modified with Cursor.ai:
Stage changes.
Trigger CodeRabbit review within the IDE.
Address flagged issues (code smells, potential bugs, security gaps, duplicate logic).
Commit clean, reviewed code.
Benefit: This catches issues immediately, reducing rework and preventing the accumulation of technical debt often associated with unmonitored AI code generation.
Manual Validation: Always manually review generated code for logical correctness and adherence to project conventions.
Testing Prompts: Prompt Cursor.ai to generate unit and integration tests for the code it produces.
3. Development Checklist
Core Principle for this Checklist: For each task, especially when using Cursor.ai for code generation, ensure real-time code review (e.g., with CodeRabbit) is performed per commit to maintain code quality and address potential AI-generated issues promptly. All generated code must align with this DEVELOPMENT.md.

3.1 Week 1: Setup and Core Backend (Auth, User, Basic CheckIn)
Project Setup: Initialize NestJS project, set up PostgreSQL with PostGIS, configure TypeORM and environment variables.
Auth Module: Implement Firebase Authentication verification, create /auth/login endpoint to issue app JWT.
User Module: Create UserEntity and UserService, endpoints for /users/me (profile) and /users/me/location (update agent location).
CheckIn Module (Initial): Create CheckInRequestEntity, CheckInService, and endpoint for POST /check-in with DTO validation.
3.2 Week 1-2: Core Backend (CheckIn Geospatial, Document, Payments Setup)
CheckIn Module (Geospatial): Implement /check-in/nearby endpoint with PostGIS query.
Document Module: Implement S3 pre-signed URL generation and a cron job for document deletion.
Payment Module: Integrate Stripe to create PaymentIntents and a webhook for payment confirmation.
3.3 Week 2-3: Frontend Development & Backend Integration
React Native Setup (Expo):
Initialize Expo project: npx create-expo-app CheckInBuddy --template.
Install all dependencies from Section 2.1.
Set up basic navigation (Auth stack, App stack).
Configure project for EAS Build (eas.json).
Implement Custom Theme: Configure NativeBase with a custom theme file using the pastel color palette defined in Section 2.1.
Prompt: "Configure a custom theme for NativeBase using a pastel color palette (e.g., primary soft blue, secondary mint green, neutral grays). Apply this theme to the root of the application."
Frontend Screens (Auth & Host Flow): Create Login/Signup, Host Dashboard, Create Request Form, and Payment screens.
Frontend Screens (Agent Flow): Create screens for viewing nearby requests on a map, accepting requests, and uploading documents.
3.4 Week 3: Notifications and Testing
Notification Module: Implement FCM push notifications and email fallbacks.
Testing: Write Jest tests for backend and React Testing Library tests for frontend screens.
3.5 Week 4: Deployment, Polish, E2E Testing
Deployment (Backend): Deploy NestJS to DigitalOcean via Docker.
Deployment (Mobile Apps): Build Android .aab and iOS .ipa (via EAS Build). Distribute via TestFlight/Firebase App Distribution.
Monitoring: Set up Sentry for error tracking.
End-to-End Testing: Test full user flows on physical Android and iOS devices.
3.6 Integration Notes
Auth: Frontend gets Firebase ID Token, sends to backend /auth/login, backend verifies and issues app-specific JWT for subsequent API calls.
Data Linking: Use foreign keys (host_id, agent_id, check_in_request_id) to link entities as defined in the schema.
API Communication: Frontend uses REST APIs (Axios/fetch) with the app JWT in the Authorization: Bearer <token> header.
4. Edge Cases and Mitigations
Edge Case	Description	Mitigation Strategy
User Management	Agent provides a false location to get more desirable requests.	For MVP, trust. Post-MVP: cross-verify with device GPS during key actions.
Check-In Process	Agent accepts but doesn't show up or cancels last minute.	Implement cancellation window, notify host, allow re-listing. For MVP, manual support.
Document Handling	Invalid file type/size uploaded by bypassing client validation.	Server-side validation of Content-Type and Content-Length via S3 pre-signed URL constraints or Lambda trigger.
Payments	Network issue leads to double payment or missed confirmation.	Use idempotency keys with Stripe. Rely on Stripe webhooks as the source of truth for payment success.
AI-Generated Code	Cursor produces code with subtle bugs, unused variables, duplicate logic, or missing validations.	Proactive: Strict adherence to prompting guidelines. Reactive: Mandatory real-time per-commit reviews with tools like CodeRabbit. Rigorous manual review against this document. Targeted unit tests.
Platform Dev	Local iOS build/debug limitations on non-macOS machine.	Utilize Expo Go for live testing on physical device. Leverage EAS Build for all native compilations. Plan for macOS access (cloud/physical) for deep native debugging if necessary.

Export to Sheets
5. Success Criteria
The MVP is complete when hosts can create and pay for requests, agents can accept and fulfill them by uploading documents, documents are deleted after 48 hours, notifications are sent, and the app is deployable to both platforms (iOS via EAS Build/TestFlight) with no critical bugs in the end-to-end flow.

6. Constraints and Assumptions
Constraints: 3-4 week timeline (ambitious), ~€30/month budget, limited agent verification for MVP.
Assumptions: Fixed €20 fee is viable, geospatial tools are accurate enough, Firebase free tier is sufficient, no complex dispute automation, initial iOS dev can be done on Windows with EAS.
7. Troubleshooting Guide
AI-Generated Code Issues: Use CodeRabbit to flag issues in real-time. Manually cross-verify logic against this document. Re-prompt Cursor.ai with more specific constraints.
Schema Mismatches: Ensure TypeORM entities exactly match the schema in Section 2.3.
Dependency Conflicts: Use versions specified in Section 2.1 or package.json as the source of truth.
iOS Issues on Non-macOS: Test meticulously on a physical device. For deep native issues, access to a macOS environment may be required.
8. Future Enhancements (Post-MVP)
Not in MVP: Real-time agent tracking, ratings/reviews, dynamic pricing, in-app chat, complex multi-guest flows.
Planned for v2: Implement Redis caching, full Stripe Connect automation, KYC for agents, multi-currency/language support, admin panel.
9. Final Notes
This DEVELOPMENT.md is the non-negotiable single source of truth for CheckInBuddy’s MVP. Cursor.ai must be guided by its specifications.

Embrace AI-Assisted Development Strategically:

Adhere strictly to this document for scope, schema, and architecture.
Break down tasks into small, clear prompts.
Implement rigorous real-time (per-commit) reviews (e.g., with CodeRabbit) and traditional PR reviews.
Build fast, but with intention and a constant focus on quality.
Start Development:

Save as DEVELOPMENT.md in project root. Commit to VCS.
Install recommended Dev Tools, including CodeRabbit extension in Cursor/VS Code.
Initialize project per Week 1 checklist.
Use Cursor.ai with specific prompts aligned to tasks, providing this document as context.
Track progress, review every commit, and verify integrations.