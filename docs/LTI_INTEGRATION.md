# LTI 1.3 Integration Guide

**THE GEAR** supports the LTI 1.3 (Learning Tools Interoperability) standard, enabling seamless integration with major Learning Management Systems (LMS) like **Moodle**, **Canvas**, **Blackboard**, and **Sakai**.

## Features

- **Single Sign-On (SSO)**: Users launch the application directly from the LMS without entering credentials.
- **Role Mapping**:
    - LMS `Instructor` -> GEAR `Teacher`
    - LMS `Learner` -> GEAR `Student`
- **Auto-Provisioning**: User accounts are created automatically upon the first launch.

---

## Configuration for Administrators

To connect your LMS, you need to register **THE GEAR** as an "External Tool" (LTI 1.3 Tool).

### 1. Tool Configuration Details

Use the following URLs when configuring the tool in your LMS. Replace `https://gear.tsp.edu.rs` with your actual domain.

| Field                      | Value                                | Description                        |
| :------------------------- | :----------------------------------- | :--------------------------------- |
| **Tool URL (Launch URL)**  | `https://gear.tsp.edu.rs/lti/launch` | The main entry point for the tool. |
| **Initiate Login URL**     | `https://gear.tsp.edu.rs/lti/login`  | Where the OIDC flow starts.        |
| **Public Keys URL (JWKS)** | `https://gear.tsp.edu.rs/lti/keys`   | For verifying signatures.          |
| **Deep Linking URL**       | `https://gear.tsp.edu.rs/lti/launch` | (Optional) Same as launch URL.     |

### 2. Moodle Setup Example

1.  Go to **Site administration** > **Plugins** > **Activity modules** > **External tool** > **Manage tools**.
2.  Click **"Configure a tool manually"**.
3.  **Tool Settings**:
    - **Tool Name**: THE GEAR
    - **Tool URL**: `https://gear.tsp.edu.rs/lti/launch`
    - **LTI Version**: LTI 1.3
    - **Public key type**: Keyset URL
    - **Public keyset**: `https://gear.tsp.edu.rs/lti/keys`
    - **Initiate login URL**: `https://gear.tsp.edu.rs/lti/login`
    - **Redirection URI(s)**: `https://gear.tsp.edu.rs/lti/launch`
4.  **Services**:
    - IMS LTI Assignment and Grade Services: _Use this service for grade sync and column management_ (Future support).
    - IMS LTI Names and Role Provisioning: _Use this service to retrieve members' information as per privacy settings_.
5.  **Save changes**.

### 3. Canvas Setup Example

1.  Go to **Admin** > **Developer Keys**.
2.  Click **+ Developer Key** > **LTI Key**.
3.  **Method**: Manual Entry.
4.  **Redirect URIs**: `https://gear.tsp.edu.rs/lti/launch`
5.  **Title**: THE GEAR
6.  **Target Link URI**: `https://gear.tsp.edu.rs/lti/launch`
7.  **OpenID Connect Initiation Url**: `https://gear.tsp.edu.rs/lti/login`
8.  **JWK Method**: Public JWK URL.
9.  **Public JWK URL**: `https://gear.tsp.edu.rs/lti/keys`
10. **Save** and turn the key **ON**.
11. Copy the **Client ID**.
12. Go to a Course > **Settings** > **Apps** > **View App Configurations** > **+ App**.
13. Configuration Type: **By Client ID**. Paste the ID.

---

## Platform Registration (Backend)

_Currently, new platforms must be registered via the database or a custom admin script. In production, this process will be automated via dynamic registration._

If using the manual script (contact support):

```javascript
lti.registerPlatform({
    url: 'https://school.moodle.com',
    name: 'School Moodle',
    clientId: '...',
    authenticationEndpoint: '...',
    accesstokenEndpoint: '...',
    authConfig: { method: 'JWK_SET', key: '...' },
});
```
