# Audit Logging

## Overview

MetaMCP provides a robust Audit Logging system to track critical administrative actions and security events. This system helps administrators monitor changes to policies, configurations, and server installations, ensuring accountability and compliance.

## Features

*   **Immutable Logs**: Records are stored in a dedicated `audit_logs` table.
*   **Comprehensive Tracking**: Captures action type, user ID, resource type, resource ID, IP address, and detailed metadata.
*   **UI Dashboard**: View and filter logs via the `/audit` page.

## Audited Actions

The following actions are automatically logged:

*   **Policy Management**: `CREATE_POLICY`, `UPDATE_POLICY`, `DELETE_POLICY`
*   **Server Management**: `INSTALL_SERVER`, `UPDATE_SERVER`, `DELETE_SERVER`
*   **Configuration**: `UPDATE_CONFIG`
*   **Authentication**: `LOGIN`, `LOGOUT` (via Auth hooks)

## Usage

### Viewing Logs

1.  Navigate to **Audit Logs** in the sidebar.
2.  Review the table of events, sorted by most recent.
3.  Expand the **Details** column to see specific changes (e.g., policy rules diff).

### Integration

To log an event from a custom service:

```typescript
import { auditService } from "@/lib/audit/audit.service";

await auditService.log(
  "CUSTOM_ACTION",
  "resource_type",
  "resource_id",
  { some: "detail" },
  userId,
  ipAddress
);
```
