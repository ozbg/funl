# Apple Wallet PassKit Certificates Setup

This directory contains the Apple Developer certificates required for generating Apple Wallet passes.

## Required Files

You need to place the following files in this directory:

1. **pass_certificate.pem** - Your Pass Type ID certificate from Apple Developer Portal
2. **pass_private_key.pem** - The private key associated with your Pass Type ID certificate
3. **wwdr_certificate.pem** - Apple Worldwide Developer Relations certificate

## Setup Instructions

### 1. Apple Developer Account Setup

1. Log in to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Create a new Pass Type ID identifier (if not already created)
4. Create a Pass Type ID certificate for your identifier

### 2. Certificate Export

1. Download your Pass Type ID certificate (.cer file)
2. Import it into Keychain Access
3. Export the certificate and private key as separate files:
   - Right-click on the certificate → Export → Choose .pem format
   - Right-click on the private key → Export → Choose .pem format

### 3. WWDR Certificate

1. Download the Apple Worldwide Developer Relations certificate from:
   https://developer.apple.com/certificationauthority/AppleWWDRCA.cer
2. Convert to PEM format if needed

### 4. Environment Variables

Set the following environment variables in your deployment:

```bash
# Required
APPLE_TEAM_IDENTIFIER=YOUR_10_CHAR_TEAM_ID
APPLE_PASS_TYPE_IDENTIFIER=pass.com.yourcompany.passtype
APPLE_ORGANIZATION_NAME="Your Organization Name"

# Certificate paths (if different from defaults)
PASSKIT_CERTIFICATE_PATH=lib/passkit/certificates/pass_certificate.pem
PASSKIT_PRIVATE_KEY_PATH=lib/passkit/certificates/pass_private_key.pem
PASSKIT_WWDR_CERTIFICATE_PATH=lib/passkit/certificates/wwdr_certificate.pem

# Optional: If private key is password protected
PASSKIT_PRIVATE_KEY_PASSPHRASE=your_private_key_password

# Web service URL for pass updates
PASSKIT_WEB_SERVICE_URL=https://yourdomain.com/api/passkit
```

## Security Notes

- **NEVER** commit these certificate files to version control
- Ensure certificate files have appropriate file permissions (600)
- Store private key passphrases securely using environment variables
- Regularly rotate certificates before expiry

## File Structure

```
lib/passkit/certificates/
├── README.md (this file)
├── pass_certificate.pem (your certificate)
├── pass_private_key.pem (your private key)
├── wwdr_certificate.pem (Apple WWDR certificate)
└── .gitignore (excludes certificate files)
```

## Validation

Use the certificate validation utilities to check your setup:

```typescript
import { checkCertificateSetup } from '../certificates'

const setup = await checkCertificateSetup()
if (!setup.configured) {
  console.log('Issues:', setup.issues)
  console.log('Recommendations:', setup.recommendations)
}
```

## Development vs Production

- Development: Use development certificates and test pass type identifiers
- Production: Use production certificates with proper domain validation
- Never use development certificates in production environments