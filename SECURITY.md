# Security Policy

## Scope

Sajjad's Engineering Academy is a static educational website and browser-local learning experience published from this repository. Security fixes are applied to the current production site on the `main` branch; the project does not use the placeholder semantic-version support matrix that previously appeared in this file.

## Reporting a Security Issue

If you believe you have found a security or privacy issue affecting Sajjad's Engineering Academy, please report it privately rather than opening a public GitHub issue when the report could expose a vulnerability, credential, personal data, or a practical abuse method.

Contact: **contact@sajjadengineeringacademy.com**

Please include, where possible:

- the affected page, file, or URL;
- a concise description of the issue and its potential impact;
- safe reproduction steps that do not access or alter another person's data;
- browser/device details when relevant; and
- screenshots or other non-sensitive evidence if useful.

Do not include passwords, API keys, authentication tokens, private employer information, or personal data that is not necessary to understand the report.

## Responsible Testing

Please avoid destructive testing, denial-of-service activity, automated traffic that could disrupt the site, social engineering, credential attacks, or attempts to access data that does not belong to you. Stop testing if you encounter private information or credentials and report the issue without retaining or redistributing that information.

## Educational Content and Local Learning Data

The academy provides educational engineering material. Site/OEM procedures, approved PTW/LOTO, risk assessments, applicable requirements, and competent-person controls take priority for real work.

Some LMS learning records are stored locally in the learner's browser. Learners should not enter employer-confidential information, passwords, restricted drawings, proprietary equipment settings, personal data, or other sensitive operational information into browser-local notes or learning records.

## Public Repository

This is a public website repository. Credentials, private keys, confidential documents, personal records, and other secrets must never be committed to it. If a secret is accidentally exposed, removing it in a later commit is not sufficient on its own; the affected credential should be revoked or rotated promptly and the exposure assessed.
