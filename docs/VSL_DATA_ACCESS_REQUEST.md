# VSL dataset access request preparation

Prepared 2026-10-11 for SmartGlove data qualification. **Not sent.** No identity,
institution, approval, signature or acceptance of terms has been supplied or inferred.

## VSL400: structured access route

Dataset: https://zenodo.org/records/17943574

Publisher's agreement: https://zenodo.org/records/21366957

The publisher requires applicants to review, complete and submit its agreement via
the access-request procedure. The applicant must supply their own identity and any
required affiliation/signature fields in the actual form. The public agreement is
also cached unchanged at `.design-cache/realtime-data-20261011/sources/VSL400_Data_Usage_Agreement.pdf`
(SHA-256 `ecb2a8f604520bcce3eea653997693c3306c1be4fbaae41ea5f285b32e491989`).
This note does not replace the publisher's form or grant dataset access.

### Form inspection, 2026-10-12

Read all three pages of the cached Version 1.0 PDF; its hash above is unchanged.
The actual form asks for requester name, supervisor (if applicable), organization,
organization postal address, contact email and intended purpose. It includes an
acceptance checkbox and user signature/date, plus a separate provider signature/date.
Those fields are **not supplied**, and no box or signature has been completed.

The [publisher's agreement](https://zenodo.org/records/21366957) requires controlled
storage under the user's organization, restricts dataset sharing and public video
illustrations, and makes derived-model release conditional on participant protection.
Default permission lasts 12 months after approval. Confirm the proposed local-device
storage arrangement with the provider when applying; this document does not establish
that a personal laptop satisfies the agreement. Review the full form before signing.

The user asked whether publicly available data could be used. Public VSL-GH feature
preparation continues; no applicant details were supplied. VSL400 is an additional
access route, not the only possible source or a reason to pause independent data work.
The existing project description below is ready for the intended-purpose field. No
email, repository request or legal acceptance has been submitted.

Proposed project description, ready to adapt to the form:

> SmartGlove is a local desktop Vietnamese Sign Language recognition research
> project. The initial task is recognition of 20–30 commonly used isolated signs
> from a single frontal laptop camera. We are qualifying datasets before training,
> with signer-separated training, validation and testing, and explicit checks for
> duplicate recordings, label correctness, missing landmarks and out-of-vocabulary
> behavior. We request access to frontal RGB videos, gloss labels, signer IDs,
> recording IDs and any official split definitions. A smaller subset is suitable if
> it retains multiple signers and representative classes. We would also like to
> confirm the terms for local landmark extraction and use of trained model weights
> in a desktop research prototype before proceeding.

Information to obtain from the publisher with access:

- Exact gloss inventory and regional/linguistic variants represented.
- Consistent IDs joining synchronized views to the same original recording.
- Signer/session metadata and recommended independent split.
- Known annotation errors, quality exclusions and preprocessing details.
- Applicable terms for derived landmarks and trained weights.

## Multi-VSL: request complete source and mapping

Repository: https://github.com/Etdihatthoc/Multi-VSL_WACV_2025

Existing public access discussion: https://github.com/Etdihatthoc/Multi-VSL_WACV_2025/issues/1

The same project description can be used with this additional factual paragraph:

> The public Videos_demo listing available to us contains 1000 videos, including
> 352 center-view files. Joining those files to the official center-view CSVs gives
> 248 training, 40 validation and 64 test files; no center-view class is represented
> in all three splits in that listing. Could you provide the full center-view data,
> or a multi-signer 20–30-gloss subset, together with the authoritative mapping from
> numeric class IDs to Vietnamese glosses and the dataset's usage terms? We found
> a separate AAGCN table using document IDs 1–1000 and would need confirmation before
> assuming it corresponds to Multi-VSL's 0–999 class indices.

These are local draft paragraphs only. No email, GitHub comment or access request
has been posted. The dataset owner must grant access; a successful technical download
of public demo files is not an authorization for the complete dataset.
