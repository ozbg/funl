# Production Security Requirements

**Status**: Post-MVP Implementation (After market validation)

## Overview

These security enhancements should be implemented after the MVP is validated and before scaling beyond 1000 users. The MVP security in CODING_STANDARDS.md is sufficient for initial launch.

---

## 🚨 Priority 1: Pre-Scale Requirements (Before 1000+ users)

### Rate Limiting
```typescript
// Implement before public launch to prevent abuse
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
}
```

### File Upload Security
```typescript
// Critical for QR/image uploads
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function validateUpload(file: File) {
  // Size check
  if (file.size > MAX_SIZE) throw new Error('File too large');
  
  // Type validation
  const buffer = await file.arrayBuffer();
  const fileType = await fileTypeFromBuffer(Buffer.from(buffer));
  
  if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
    throw new Error('Invalid file type');
  }
  
  // Virus scan (integrate with ClamAV or similar)
  await scanForVirus(buffer);
  
  return buffer;
}
```

### Session Management
```typescript
// Implement session timeouts and rotation
interface SessionConfig {
  maxAge: 7 * 24 * 60 * 60, // 7 days
  rotateAfter: 24 * 60 * 60, // Rotate daily
  absoluteTimeout: 30 * 24 * 60 * 60, // 30 days max
}

export async function validateSession(sessionId: string) {
  const session = await getSession(sessionId);
  
  // Check expiry
  if (Date.now() > session.expiresAt) {
    await invalidateSession(sessionId);
    throw new AuthError('Session expired');
  }
  
  // Rotate if needed
  if (Date.now() > session.rotateAt) {
    return await rotateSession(sessionId);
  }
  
  return session;
}
```

---

## 🔒 Priority 2: Enterprise Features (5000+ users)

### Advanced Audit Logging
```typescript
// Comprehensive activity tracking
interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
}

class AuditLogger {
  async log(event: Partial<AuditLog>) {
    // Store in separate audit database
    await auditDb.insert({
      ...event,
      timestamp: new Date(),
      id: crypto.randomUUID(),
    });
    
    // Alert on suspicious patterns
    if (await this.detectSuspiciousActivity(event)) {
      await this.sendSecurityAlert(event);
    }
  }
  
  private async detectSuspiciousActivity(event: Partial<AuditLog>) {
    // Check for patterns like:
    // - Multiple failed logins
    // - Unusual access patterns
    // - Bulk data exports
    // - Permission escalation attempts
  }
}
```

### PII Encryption
```typescript
// Encrypt sensitive data at rest
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class PIIEncryption {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  
  encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }
  
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### CSRF Protection
```typescript
// Double-submit cookie pattern
import { SignJWT, jwtVerify } from 'jose';

export async function generateCSRFToken(sessionId: string): Promise<string> {
  const secret = new TextEncoder().encode(process.env.CSRF_SECRET!);
  
  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret);
    
  return token;
}

export async function validateCSRFToken(
  token: string, 
  sessionId: string
): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.CSRF_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    
    return payload.sessionId === sessionId;
  } catch {
    return false;
  }
}

// Middleware
export async function csrfProtection(req: NextRequest) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers.get('x-csrf-token');
    const session = await getSession(req);
    
    if (!token || !await validateCSRFToken(token, session.id)) {
      return new NextResponse('Invalid CSRF token', { status: 403 });
    }
  }
}
```

---

## 🛡️ Priority 3: Compliance & Advanced Security

### GDPR Compliance
```typescript
// Data portability and right to deletion
export class GDPRCompliance {
  async exportUserData(userId: string): Promise<Buffer> {
    const data = await this.collectAllUserData(userId);
    return Buffer.from(JSON.stringify(data, null, 2));
  }
  
  async deleteUserData(userId: string): Promise<void> {
    // Soft delete first
    await this.anonymizeUser(userId);
    
    // Schedule hard delete after legal retention period
    await this.scheduleHardDelete(userId, 30); // 30 days
  }
  
  private async anonymizeUser(userId: string) {
    await supabase.from('users').update({
      email: `deleted-${userId}@example.com`,
      name: 'Deleted User',
      phone: null,
      // Keep audit logs but anonymize
    }).eq('id', userId);
  }
}
```

### Security Headers (Production)
```javascript
// next.config.js - Full production headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.supabase.co;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co;
      media-src 'self';
      object-src 'none';
      frame-src https://js.stripe.com https://hooks.stripe.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  }
];
```

### WAF Configuration
```yaml
# Cloudflare WAF Rules
rules:
  - name: Block SQL Injection
    expression: (http.request.uri.query contains "union" and http.request.uri.query contains "select")
    action: block
    
  - name: Rate Limit API
    expression: (http.request.uri.path contains "/api/")
    action: rate_limit
    threshold: 100/minute
    
  - name: Geo-blocking (if needed)
    expression: (ip.geoip.country in {"CN" "RU" "KP"})
    action: challenge
```

### Dependency Scanning
```json
// package.json
{
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:scan": "snyk test",
    "security:monitor": "snyk monitor",
    "security:update": "npm-check-updates -u && npm install && npm audit fix"
  },
  "devDependencies": {
    "snyk": "^1.1064.0",
    "@types/dompurify": "^3.0.5"
  }
}
```

### Secrets Rotation
```typescript
// Automated secret rotation
class SecretRotation {
  async rotateAPIKeys() {
    // Generate new keys
    const newKeys = await this.generateNewKeys();
    
    // Update in secure vault (e.g., Vercel env vars)
    await this.updateSecureVault(newKeys);
    
    // Grace period for old keys
    setTimeout(() => this.invalidateOldKeys(), 24 * 60 * 60 * 1000);
    
    // Notify team
    await this.notifyTeam('API keys rotated successfully');
  }
  
  // Run monthly
  scheduleRotation() {
    cron.schedule('0 0 1 * *', () => this.rotateAPIKeys());
  }
}
```

---

## 🔍 Security Monitoring

### Real-time Threat Detection
```typescript
// Integrate with monitoring service
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Sanitize sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});

// Custom security monitoring
export class SecurityMonitor {
  async detectAnomalies(userId: string) {
    const recentActivity = await this.getUserActivity(userId, '1h');
    
    // Check for suspicious patterns
    if (recentActivity.apiCalls > 1000) {
      await this.flagAccount(userId, 'SUSPICIOUS_API_USAGE');
    }
    
    if (recentActivity.failedLogins > 5) {
      await this.temporaryBlock(userId, '15m');
    }
    
    if (recentActivity.dataExports > 10) {
      await this.requireReAuthentication(userId);
    }
  }
}
```

### Penetration Testing Checklist
```markdown
## Quarterly Security Audit

### Application Security
- [ ] SQL Injection testing
- [ ] XSS vulnerability scan
- [ ] CSRF token validation
- [ ] Authentication bypass attempts
- [ ] Session hijacking tests
- [ ] File upload exploits
- [ ] API rate limit testing

### Infrastructure Security
- [ ] SSL/TLS configuration
- [ ] Security headers audit
- [ ] Dependency vulnerability scan
- [ ] Docker image scanning
- [ ] Cloud configuration review
- [ ] Backup security verification

### Compliance
- [ ] GDPR compliance check
- [ ] PCI compliance (if processing cards)
- [ ] Data retention policy review
- [ ] Access control audit
- [ ] Third-party service review
```

---

## 📊 Security Metrics

### KPIs to Track
- Failed login attempts per hour
- API error rates
- Average response time under load
- Time to detect security incidents
- Time to patch vulnerabilities
- Percentage of encrypted data
- Security training completion rate

### Alert Thresholds
```typescript
const SECURITY_THRESHOLDS = {
  failedLogins: 10, // per user per hour
  apiErrors: 100, // per minute globally
  responseTime: 5000, // ms
  memoryUsage: 0.9, // 90% of available
  diskUsage: 0.85, // 85% of available
  suspiciousIPs: 5, // unique IPs per pattern
};
```

---

## 🚀 Implementation Timeline

### Phase 1: MVP Launch (Current)
- Basic auth with Supabase ✅
- Input validation with Zod ✅
- Environment variables ✅
- HTTPS only ✅

### Phase 2: Growth (Month 2-3)
- Rate limiting
- File upload security
- Session management
- Basic audit logging

### Phase 3: Scale (Month 4-6)
- Advanced monitoring
- PII encryption
- CSRF protection
- Security headers

### Phase 4: Enterprise (Month 6+)
- Full audit trail
- GDPR compliance
- WAF implementation
- Penetration testing
- SOC 2 preparation

---

## 📚 Security Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

### Tools
- [Snyk](https://snyk.io/) - Dependency scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing
- [Mozilla Observatory](https://observatory.mozilla.org/) - Security headers
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL/TLS testing

### Incident Response Plan
1. **Detect** - Monitoring alerts
2. **Contain** - Isolate affected systems
3. **Investigate** - Determine scope
4. **Remediate** - Fix vulnerability
5. **Recover** - Restore services
6. **Document** - Post-mortem analysis
7. **Improve** - Update procedures

---

## ⚠️ Important Notes

1. **Don't implement all at once** - Security is iterative
2. **Cost considerations** - Each layer adds complexity and cost
3. **User experience** - Balance security with usability
4. **Team training** - Security is everyone's responsibility
5. **Regular updates** - Security landscape changes constantly

Remember: The goal is to match security investment with business risk. Start with the basics, then layer on additional security as you grow.