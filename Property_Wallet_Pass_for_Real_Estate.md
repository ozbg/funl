Scope of Works: Property Wallet Pass for Real Estate
Executive Summary
Develop a revolutionary property marketing system that transforms real estate listings into dynamic Apple Wallet passes, enabling agents to push notifications directly to interested buyers' lock screens about price changes, open homes, and property updates.
Business Opportunity

Problem: Buyers lose track of properties across multiple platforms, miss open homes, and don't hear about price changes
Solution: Properties saved directly to Apple Wallet with push notifications
Revenue Model: Premium feature for agents at $49-299/month per agency
Market: 50,000+ real estate agents in Australia


Core Features
1. Property Pass Generation

Convert any Funl.au property listing into an Apple Wallet pass
Include property photos, price, features (beds/bath/car)
Embedded video tour links and agent contact
QR code for instant sharing at open homes
Automatic updates when property details change

2. Smart Notifications
Agents can push targeted notifications to all buyers who saved the property:

Price reductions
Open home reminders (day before, 2 hours before)
New comparable listings
Auction date announcements
Just listed alerts for similar properties
Custom messages from agent

3. Agent Dashboard
Web interface for agents to:

Track how many buyers saved each property
Send instant or scheduled notifications
View engagement analytics
Export interested buyer lists
Manage multiple properties
A/B test notification strategies

4. Buyer Experience

One-tap save from property page
QR codes at physical properties
Notifications appear on lock screen
Pass updates automatically with new information
Easy sharing between buyers
Direct link to video tours and agent contact


Technical Architecture
Stack Integration

Frontend: Next.js components on existing Vercel deployment
Backend: Supabase for data, Edge Functions for pass generation
Notifications: Apple Push Notification Service (APNS)
Storage: Supabase Storage for pass assets
Analytics: Existing analytics pipeline + new events

Database Schema
property_passes
├── property_id (reference)
├── agent_id (reference)  
├── pass_data (JSON)
├── push_tokens (array)
└── analytics (saves, opens, notifications)

property_pass_saves
├── pass_id (reference)
├── device_id
├── saved_at
└── buyer_info (optional)

property_notifications  
├── pass_id (reference)
├── type (price_change, open_home, etc)
├── sent_at
└── engagement_metrics

Implementation Phases
Phase 1: MVP (Week 1)
Deliverables:

Basic property pass generation
Apple Wallet integration
Save to wallet from property pages
Database schema implementation

Success Criteria:

Generate passes for 10 test properties
Successfully save and display in Apple Wallet
QR code scanning works

Phase 2: Notifications (Week 2)
Deliverables:

APNS integration
Notification templates (price, open home, etc)
Agent notification interface
Automated reminder system

Success Criteria:

Send test notifications to saved passes
80% notification delivery rate
Agent can send custom notification

Phase 3: Analytics & Polish (Week 3)
Deliverables:

Analytics dashboard for agents
Buyer engagement tracking
Performance optimization
Documentation and training materials

Success Criteria:

Track all key metrics
Dashboard loads <2 seconds
Agent training video completed


Pricing Strategy
Starter (Free during beta)

1 property pass
10 notifications/month
Basic analytics

Professional ($49/month)

Unlimited properties
500 notifications/month
Advanced analytics
Custom branding

Agency ($299/month)

All Professional features
Unlimited notifications
White-label passes
API access
Priority support


Success Metrics
Technical KPIs

Pass generation time: <3 seconds
Notification delivery rate: >95%
System uptime: 99.9%
Error rate: <1%

Business KPIs (3 months)

100+ active agents
5,000+ passes saved
20% notification engagement rate
$5,000+ MRR
3+ agency partnerships

User Satisfaction

Agent NPS: >40
Buyer app ratings: >4.5 stars
Support tickets: <5/week
Feature adoption: >60%


Resource Requirements
Development Team

1 Full-stack developer (3 weeks)
1 UI/UX designer (1 week)
1 QA tester (3 days)

Infrastructure

Apple Developer Account (existing)
Push Notification certificates
Supabase (existing)
Vercel (existing)

Estimated Costs

Development: 120 hours @ $150/hr = $18,000
Infrastructure: $50/month ongoing
Marketing: $2,000 initial
Total: $20,000 setup + $50/month


Risk Analysis
RiskImpactMitigationLow agent adoptionHighFree beta, training, success storiesAndroid users excludedMediumPWA alternative, clear iOS messagingNotification fatigueMediumSmart defaults, rate limitingTechnical complexityLowPhased rollout, thorough testingApple policy changesLowStay compliant, monitor updates

Competitive Advantage
Why Funl.au Wins

Already have the infrastructure: Property pages, agent accounts, QR system
Lower cost: No need for separate CRM or marketing platform
Australian focus: Local support, AUD pricing, local examples
Integrated solution: Not another tool to learn
First mover: No Australian competitor doing this

Competitor Analysis

realestate.com.au: No wallet integration
Domain: Email alerts only
CRM tools: Complex, expensive, no buyer-facing features
Generic wallet tools: Not property-specific


Timeline
Week 1: Foundation

Mon-Tue: Database and API setup
Wed-Thu: Pass generation system
Fri: Testing and refinement

Week 2: Engagement

Mon-Tue: Push notification system
Wed-Thu: Agent dashboard
Fri: Integration testing

Week 3: Launch

Mon-Tue: Final polish and optimization
Wed: Soft launch with 5 agents
Thu-Fri: Gather feedback and iterate

Week 4+: Scale

Onboard 10 agents/week
Iterate based on feedback
Build Android solution
Add premium features


Expected Outcomes
For Agents

30% more buyer engagement
50% reduction in missed open homes
Direct communication channel to interested buyers
Premium, tech-forward image

For Buyers

Never miss price drops or open homes
Property details always accessible
Professional, modern experience
Reduced email clutter

For Funl.au

New revenue stream: $5-30K MRR within 6 months
Competitive moat: Hard to replicate
Agency partnerships: Enterprise deals
Platform stickiness: Agents won't leave


Next Steps

Approve scope and budget
Assign development resources
Create Apple certificates
Build MVP (Week 1)
Recruit 5 beta agents
Launch and iterate


Conclusion
This positions Funl.au as the most innovative proptech platform in Australia. While competitors focus on listings, we're revolutionizing how agents nurture and convert buyer interest. The technical requirements are modest, the revenue potential is significant, and the competitive advantage is substantial.
Recommended Action: Proceed with MVP immediately to capture first-mover advantage in the Australian market.

---

## Implementation Summary

### Phase 1 MVP - COMPLETED ✅

**What We Built:**
- Basic Apple Wallet pass generation for property listings
- Integration with existing Funl property funnels
- Pass generation API endpoint at `/api/passkit/generate`
- Property pass template with customizable fields
- Certificate-based pass signing using passkit-generator library

**Technical Stack Implemented:**
- **Pass Generation Library:** passkit-generator (npm)
- **Certificate Chain:** Apple Pass Type ID Certificate + WWDR G4 Certificate
- **Template System:** Property listing pass template with icon assets
- **API Integration:** Next.js API route with Supabase data fetching
- **Pass Structure:** Generic pass with header, primary, secondary, auxiliary, and back fields

**Files Created/Modified:**
- `/funl-app/lib/passkit/service.ts` - Core pass generation service using passkit-generator
- `/funl-app/lib/passkit/mapper.ts` - Maps property data to pass fields
- `/funl-app/lib/passkit/templates/property-listing.pass/` - Pass template directory
- `/funl-app/app/api/passkit/generate/route.ts` - Pass generation API endpoint
- `/funl-app/certificates/` - Apple certificates (Pass Type ID, Private Key, WWDR G4)

### Critical Issues Discovered & Resolved

#### Issue 1: WWDR Certificate Generation Mismatch
**Problem:** Initial implementation used expired WWDR G3 certificate (expired Feb 2023), but the Pass Type ID certificate was issued by G4 WWDR authority.

**Symptoms:**
- Passes downloaded but wouldn't open on Mac or iPhone
- No error message, pass just failed silently
- Cryptographic signature validation failing

**Root Cause:** Certificate chain mismatch - signing with G3 when pass certificate required G4.

**Solution:**
1. Downloaded Apple WWDR G4 certificate from https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
2. Converted from DER to PEM format using openssl
3. Replaced `/funl-app/certificates/wwdr_certificate.pem` with G4 version
4. Verified certificate validity (expires 2030)

**Key Learning:** Always verify WWDR certificate generation matches Pass Type ID certificate issuer.

#### Issue 2: Custom node-forge Implementation Broken
**Problem:** After fixing WWDR certificate, passes still wouldn't open despite appearing valid.

**Symptoms:**
- Pass structure correct
- All fields populated
- Valid cryptographic signature
- File size appropriate (~7KB)
- Still fails to open on both Mac and iPhone

**Root Cause:** Custom PKCS#7 signing implementation using node-forge had subtle bugs in signature generation.

**Solution:**
1. Researched Apple Wallet pass generation best practices
2. Found passkit-generator as battle-tested, community-maintained library
3. Completely replaced custom node-forge implementation
4. Created template directory structure required by passkit-generator
5. Rewrote service.ts to use PKPass.from() API

**Migration Steps:**
```typescript
// OLD: Custom node-forge implementation
const signature = forge.pkcs7.createSignedData()
signature.content = forge.util.createBuffer(manifestJson)
// ... complex manual signing logic

// NEW: passkit-generator
const pass = await PKPass.from({
  model: templatePath,
  certificates
}, passData)
const buffer = pass.getAsBuffer()
```

**Key Learning:** Use proven libraries for complex cryptographic operations. Custom implementations are error-prone.

#### Issue 3: authenticationToken/webServiceURL Causing Rejection
**Problem:** After switching to passkit-generator, passes STILL wouldn't open despite test passes working perfectly.

**Symptoms:**
- Test pass (test-pass.js) opened successfully
- Server-generated pass failed
- Both appeared identical in structure
- Both had valid signatures

**Root Cause Discovery Process:**
1. Created standalone test script that generated working pass
2. User instructed: "remember your test worked fine, compare them"
3. Extracted both .pkpass files (they're ZIP archives)
4. Compared pass.json files side-by-side
5. Found difference: Test pass had NO authenticationToken/webServiceURL, broken pass had both

**Technical Explanation:**
```json
// BROKEN pass.json (wouldn't open)
{
  "authenticationToken": "2cb7252cc6c6214bc3f5e26da1dbf721",
  "webServiceURL": "http://192.168.4.167:37542/api/passkit"
}

// WORKING pass.json (opened successfully)
{
  // No authenticationToken
  // No webServiceURL
}
```

When iOS/macOS encounters a pass with `webServiceURL`, it validates that the web service is accessible and responds correctly to PassKit protocol. If the service at `http://192.168.4.167:37542/api/passkit` doesn't respond with proper PassKit web service endpoints, the pass is rejected.

**Solution:** Removed authenticationToken and webServiceURL from pass generation in service.ts:

```typescript
const pass = await PKPass.from({
  model: templatePath,
  certificates
}, {
  serialNumber,
  description: request.passData?.description || 'Property Information Pass',
  organizationName: request.passData?.organizationName || this.config.organizationName
  // NOTE: Removed authenticationToken and webServiceURL
  // They require a working web service or iOS rejects the pass
})
```

**Key Learning:**
- A pass can be cryptographically valid, have correct structure, all fields populated, but STILL fail to open
- webServiceURL requires actual working PassKit web service implementation
- For static passes without update functionality, omit these fields entirely
- Always compare working vs broken examples byte-by-byte when debugging

#### Issue 4: Icon Size Requirements
**Problem:** Initial placeholder icons were 1x1 pixels, causing pass validation errors.

**Solution:**
- Created proper icons: 29x29 (icon.png), 58x58 (icon@2x.png), 87x87 (icon@3x.png)
- Used sharp library to generate properly sized PNG files
- Apple Wallet requires minimum 29x29 pixel icons

#### Issue 5: Template Path Resolution in Next.js
**Problem:** `__dirname` doesn't resolve correctly in Next.js compiled code.

**Solution:** Use `process.cwd()` for absolute path resolution:
```typescript
const templatePath = path.join(process.cwd(), 'lib', 'passkit', 'templates', 'property-listing.pass')
```

### Current Implementation Status

**Working Features:**
- ✅ Generate Apple Wallet passes for property listings
- ✅ Include property name, price, status, agent info in pass
- ✅ QR code linking back to property funnel page
- ✅ Proper cryptographic signing with valid certificate chain
- ✅ Passes open successfully on Mac and iPhone
- ✅ Pass fields display correctly with proper formatting

**API Endpoint:**
```
GET /api/passkit/generate?funnelId={uuid}
```

**Pass Structure:**
- **Header:** Property name
- **Primary Fields:** Price, Status
- **Secondary Fields:** Agent name
- **Auxiliary Fields:** Agent phone
- **Back Fields:** Custom message
- **Barcode:** QR code with funnel URL

### Production Readiness Requirements

**Still Needed for Production:**

1. **Web Service Implementation (for pass updates)**
   - Implement PassKit web service protocol endpoints
   - Support device registration for updates
   - Enable push notification delivery
   - Database schema for tracking devices and registrations
   - Endpoints: /devices/{deviceID}/registrations/{passTypeID}, /passes/{passTypeID}/{serialNumber}, /log

2. **Push Notifications**
   - APNS integration for sending pass updates
   - Notification triggers (price changes, open house reminders)
   - Agent dashboard for managing notifications
   - Rate limiting and notification scheduling

3. **Pass Updates**
   - Detect property data changes (price, status, details)
   - Automatically regenerate and push updated passes
   - Version tracking for passes
   - Update notification logic

4. **Analytics & Tracking**
   - Track pass downloads and saves
   - Monitor pass update deliveries
   - Agent dashboard showing engagement metrics
   - Buyer interest tracking

5. **Production Infrastructure**
   - Proper certificate management and rotation
   - CDN for pass distribution
   - Caching strategy for generated passes
   - Error monitoring and alerting
   - Load testing for high volume

6. **Security Enhancements**
   - Rate limiting on pass generation
   - Authentication for pass access
   - Audit logging for pass operations
   - Certificate storage in secrets manager

7. **Testing**
   - Unit tests for pass generation
   - Integration tests for API endpoints
   - E2E tests for complete user flow
   - Cross-device testing (various iOS versions)

8. **Documentation**
   - Agent setup guide
   - API documentation
   - Troubleshooting guide
   - Certificate renewal procedures

**Estimated Additional Work:**
- Web Service Implementation: 2-3 days
- Push Notifications: 2-3 days
- Analytics Dashboard: 2-3 days
- Production Infrastructure: 1-2 days
- Testing & Documentation: 2-3 days
- **Total: 9-14 days additional development**

### Key Technical Decisions Made

1. **Library Choice:** passkit-generator over custom implementation
   - Rationale: Battle-tested, handles edge cases, active maintenance
   - Trade-off: Additional dependency vs. implementation reliability

2. **Pass Type:** Generic pass over Event/Coupon/Store Card
   - Rationale: Maximum flexibility for property data
   - Allows custom field layout and branding

3. **Certificate Storage:** File system vs. Database
   - Current: File system with .gitignore
   - Production: Should move to secrets manager (AWS Secrets Manager, Supabase Vault)

4. **Pass Generation:** On-demand vs. Pre-generated
   - Current: On-demand generation per request
   - Future: Cache generated passes, invalidate on property updates

5. **Web Service:** Deferred to Phase 2
   - Rationale: Static passes work for MVP, updates come later
   - Allows faster initial launch and iteration

### Lessons Learned

1. **Follow Proven Patterns:** Use established libraries for complex crypto operations
2. **Compare Working Examples:** When debugging, find a working version and diff everything
3. **Read Apple Documentation:** Certificate generation, pass structure, web service protocol all well-documented
4. **Test on Real Devices:** Simulator behavior differs from actual iPhone/Mac
5. **Start Simple:** Static passes before dynamic updates; basic fields before advanced features
6. **Certificate Chain Matters:** WWDR generation must match Pass Type ID issuer (G3 vs G4)
7. **Web Service Optional:** For static passes, omit authenticationToken/webServiceURL entirely

### Next Phase: Push Notifications & Updates

**Priority Implementation Order:**
1. PassKit web service endpoints (device registration, pass delivery)
2. Database schema for device tracking and pass instances
3. APNS integration for push notifications
4. Property change detection and automatic updates
5. Agent notification interface
6. Analytics dashboard

This will unlock the full vision: agents pushing real-time updates about price changes, open houses, and property status directly to interested buyers' lock screens.