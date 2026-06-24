# Razorpay payments setup

PatienceAI uses **per-tenant Razorpay credentials**: each workspace adds its
own keys in *Admin → Account → Payments*, so collections settle directly to
the firm's linked bank account. The platform never touches the money.

## Render environment variables (one-time, platform-level)

Add **only this single** env var on Render — it secures the shared webhook
endpoint that Razorpay calls when a payment changes state:

| Var | Value |
| --- | --- |
| `RAZORPAY_WEBHOOK_SECRET` | A long random string. Generate with `openssl rand -hex 32`. |

That's it. No global key id / key secret — those are tenant-scoped.

## Per-tenant setup (each firm does this once)

The firm's admin opens **Admin → Account → Payments** and fills:

| Field | Where it comes from |
| --- | --- |
| Razorpay Key ID | Razorpay Dashboard → Account & Settings → API Keys → "Generate Live Keys" |
| Razorpay Key Secret | Same screen as above (shown once) |
| UPI ID (VPA) | The UPI handle the firm wants on receipts (e.g. `harshlaw@oksbi`) |
| Payee name | What appears in the client's UPI app |
| Bank account details | Optional; printed on NEFT/RTGS receipts |

Toggle **Accept online payments** to enable the gateway for that workspace.

## Razorpay dashboard configuration (one-time per firm)

In each firm's Razorpay dashboard:

1. **Settings → Webhooks → Add new webhook**
   - URL: `https://<your-domain>/api/payments/webhook`
   - Secret: paste the same `RAZORPAY_WEBHOOK_SECRET` you set on Render.
   - Active events: `payment.authorized`, `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`
2. (Optional) **Settings → Bank Accounts** — verify the bank account that
   will receive payouts. Money lands here, not in any platform account.

## Database migration

The new `Payment` table is added in this push. Run:

```
pnpm prisma migrate dev --name add_payments
# or, on production via Render shell:
pnpm prisma migrate deploy
```

Schemas are forward-safe — old tenants that haven't run the migration yet
still render receipts; the payment history block just shows "No payments
here yet" until the migration finishes.

## Receipt flow with payments enabled

1. Admin/lawyer creates a receipt and selects **UPI** or **NEFT** payment method.
2. The receipt PDF is generated with:
   - **UPI** → a scannable QR (any UPI app reads it) + the firm's VPA + the receipt number as the transaction reference.
   - **NEFT** → the firm's bank name, account holder, account number, IFSC.
3. The client pays. Razorpay sends a webhook to `/api/payments/webhook`.
4. The signature is verified using `RAZORPAY_WEBHOOK_SECRET`. The matching
   `Payment` row is updated to `COMPLETED` (or `FAILED`).
5. Only AFTER signature verification does the success email go out to the client.
6. The payment appears in **Admin → Receipts → Payment history** with a click-to-open modal that supports full or partial refunds.

## Strict isolation guarantee

- The `Payment` model is keyed by `tenantId`.
- Every read / write query in `src/lib/payments.ts`, `/api/payments/*`,
  and `payments-history.tsx` filters on `tenantId`.
- Razorpay keys are stored in the tenant's `payments_config`
  `SiteSetting` row — never global.
- The refund endpoint re-verifies that the payment's `tenantId` matches
  the authenticated admin's `tenantId` before calling Razorpay.

Net effect: **harsh's** receipts can only collect into **harsh's** linked
bank account. There is no path in the code where another workspace's
keys could be used to charge or refund.
