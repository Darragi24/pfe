# PetStay – Changelog

## [Unreleased] – Bug-Fix Release

### Summary
This release fixes the root cause of payment statuses not transitioning from **"accepted"** to
**"completed"** after a successful Stripe checkout, along with several additional bugs covering
security, real-time updates, UI correctness, and error handling.

---

## Bugs Fixed

---

### 🔴 BUG-01 – Notification Field Mismatch Crashes Webhook (CRITICAL)
**File:** `server/server.js` (Stripe webhook handler)  
**Root Cause:** The `Notification` model schema requires a field named `user` (marked as
`required: true`). The webhook handler was creating Notification documents using a field named
`recipient` instead. Every call to `senderNote.save()` / `receiverNote.save()` threw a Mongoose
`ValidationError` because the required `user` field was missing.  
**Effect:** The async webhook handler crashed before `res.json({ received: true })` was sent,
causing Stripe to continuously retry the webhook. While `booking.status` was saved to `"completed"`
(it happens before the notification saves), no Socket.IO events were emitted and no notifications
were persisted.  
**Fix:** Changed `recipient:` → `user:` in both Notification constructors inside the webhook.

---

### 🔴 BUG-02 – No try/catch Around Webhook Processing Logic (CRITICAL)
**File:** `server/server.js` (Stripe webhook handler)  
**Root Cause:** Only the `stripe.webhooks.constructEvent()` call was wrapped in a try/catch. All
subsequent async operations (`Booking.findById`, `booking.save`, notification saves) had no error
handling. In Express 4, unhandled promise rejections in async route handlers do not automatically
send an error response.  
**Effect:** Any database or validation error after signature verification would leave the HTTP
response hanging, preventing Stripe from receiving the required `200 OK` and triggering infinite
retries.  
**Fix:** Wrapped the entire booking-processing block in a dedicated `try/catch`. On success the
handler returns `{ received: true }`; on failure it returns HTTP 500 so Stripe knows to retry.

---

### 🟠 BUG-03 – `booking.host.fullName` / `booking.requester.fullName` Always Undefined (HIGH)
**File:** `client/pages/bookings.js` (`BookingCard` component, line 117)  
**Root Cause:** The User Mongoose model stores the display name in a field called `name`. The
`getMyBookings` and `getHostBookings` controllers explicitly populate `"name email …"`. The
`BookingCard` component was reading `.fullName`, a field that does not exist, so both the host and
requester names always rendered as blank.  
**Fix:** Changed `booking.host.fullName` → `booking.host?.name` and
`booking.requester.fullName` → `booking.requester?.name`.

---

### 🟠 BUG-04 – `join-admin` Socket Event Never Handled Server-Side (HIGH)
**File:** `server/server.js` (Socket.IO connection handler)  
**Root Cause:** `client/context/SocketContext.js` emits a `join-admin` event for every user whose
roles include `"admin"`. The server's `io.on("connection", …)` block only handled `join-user`; the
`join-admin` event was silently discarded, so admin users never joined the `"admin"` room.  
**Effect:** Any admin-targeted broadcasts using `io.to("admin")` would not reach admin users.  
**Fix:** Added a `socket.on("join-admin", …)` handler that joins both the `"admin"` room and the
user's personal `user-${userId}` room.

---

### 🟠 BUG-05 – Payments Page Had No Real-Time Socket.IO Updates (HIGH)
**File:** `client/pages/payments.js`  
**Root Cause:** The Payments page never subscribed to any Socket.IO events. It relied entirely on a
fragile 3-second `setTimeout` fallback after redirect from Stripe, which could miss the webhook if
it was slow, or poll unnecessarily when the webhook was fast.  
**Fix:** Added a `useEffect` that subscribes to `new-notification` (filtering for
`payment_success` / `payment_received` types) and `booking-updated` (filtering for
`status === "completed"`). The list now refreshes instantly when the webhook fires. Both listeners
are properly cleaned up in the effect's return function to prevent memory leaks.

---

### 🟠 BUG-06 – `handleCheckout` Silently Ignored HTTP Error Responses (HIGH)
**File:** `client/pages/payments.js` (`handleCheckout` function)  
**Root Cause:** The `fetch` call was not checking `res.ok`. If the server returned a 4xx or 5xx
response (e.g., "booking already completed"), `data.url` would simply be `undefined` and the
function would exit silently with no user feedback.  
**Fix:** Added an `if (!res.ok)` check immediately after `await res.json()`. The server's error
message (`data.error`) is now shown to the user via `alert()`.

---

### 🟠 BUG-07 – Payment Session Missing Authorization & Status Validation (HIGH)
**File:** `server/server.js` (`POST /api/payments/create-session`)  
**Root Cause:** The route had no authentication middleware (`protect`) and no checks on:
1. Whether the caller is the booking's actual requester (authorization bypass).
2. Whether the booking status is `"accepted"` (allowing double-payment or payment for
   pending/rejected bookings).  
**Fix:** Added the `protect` middleware to the route. Added checks that reject the request with
HTTP 403 if the caller is not the requester, and HTTP 400 if the booking status is not
`"accepted"`.

---

### 🟠 BUG-08 – `booking-updated` Socket Event Never Emitted (HIGH)
**Files:** `client/pages/bookings.js`, `client/pages/history.js` (consumers);
`server/server.js` / `server/controllers/bookingController.js` (producers)  
**Root Cause:** Both the Bookings and History pages registered a `socket.on("booking-updated", …)`
listener expecting real-time status refreshes, but the server never emitted this event anywhere.  
**Fix:** The webhook handler now emits `booking-updated` (with `{ bookingId, status: "completed" }`)
to both the requester's and host's personal rooms after a successful payment. The existing listeners
in `bookings.js` and `history.js` now receive these events correctly.

---

### 🟡 BUG-09 – Dead Code: Redundant `if (booking)` After Early Return Guard (LOW)
**File:** `server/server.js` (Stripe webhook handler)  
**Root Cause:** The code had `if (!booking) return …` followed immediately by `if (booking) { … }`.
The second condition is always `true` and constitutes unreachable/dead code that made the logic
harder to read and maintain.  
**Fix:** Removed the redundant `if (booking)` wrapper; the update logic now runs directly after the
early-return guard.

---

### 🟡 BUG-10 – No `paidAt` Timestamp Stored on Payment Confirmation (LOW)
**File:** `server/models/Booking.js`  
**Root Cause:** The Booking schema stored `acceptedAt` and `rejectedAt` timestamps but had no
equivalent for when payment was confirmed, leaving no audit trail for the payment event.  
**Fix:** Added a `paidAt: { type: Date }` field to the Booking schema. The webhook handler now sets
`booking.paidAt = new Date()` alongside `booking.status = "completed"`.

---

## Files Modified

| File | Changes |
|---|---|
| `server/server.js` | Fixed `recipient`→`user` in notifications; added try/catch to webhook; removed dead code; added `protect` to `create-session`; added requester auth + status validation; added `join-admin` handler; emits `booking-updated` after payment |
| `server/models/Booking.js` | Added `paidAt` timestamp field |
| `client/pages/payments.js` | Integrated Socket.IO (`new-notification`, `booking-updated`); fixed `handleCheckout` to check `res.ok` and display server error messages; added event listener cleanup |
| `client/pages/bookings.js` | Fixed `booking.host.fullName` → `booking.host?.name` and `booking.requester.fullName` → `booking.requester?.name` |

---

## Testing Recommendations

1. **Payment flow (end-to-end):** Accept a booking, navigate to /payments, click "Pay Now", complete
   the Stripe test checkout with card `4242 4242 4242 4242`. Verify the booking card switches to
   "Paid" status **without a page refresh** (Socket.IO update). Verify notifications appear in the
   Notifications page for both the owner and host.

2. **Webhook error resilience:** Temporarily remove the `STRIPE_WEBHOOK_SECRET` env var and confirm
   the webhook returns HTTP 400 without crashing the server.

3. **Authorization on create-session:** Use a different user's token to call
   `POST /api/payments/create-session` with another user's booking ID. Expect HTTP 403.

4. **Double-payment prevention:** After a booking is "completed", click "Pay Now" again (if the
   button is somehow visible). Expect HTTP 400 with `"Cannot pay for a booking with status:
   completed"`.

5. **Bookings page names:** Navigate to /bookings and confirm host/requester names render correctly.

6. **Admin socket room:** Log in as an admin user, open the browser console, and confirm the server
   logs `"Socket … joined admin room"`.

7. **History page real-time update:** After payment completes, navigate to /history and confirm the
   booking status shows "completed" without a manual refresh.

