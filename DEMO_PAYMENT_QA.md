# Payment QA using the existing demo database

Use `demo.rapidstylers.ca` and `api-demo.rapidstylers.ca` with the existing
`rapid_stylers` database. No third database is needed. These changes are prepared
in source; publishing the frontend and changing the VPS environment activate them.

## Enable

1. Back up the demo database before allowing QA writes. On the VPS, use the
   existing backup procedure or create a private dump:

   ```sh
   cd /opt/rapidstylers/backend
   umask 077
   mkdir -p backups
   docker exec rapidstylers-mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers --databases rapid_stylers' > "backups/demo-before-qa-$(date +%Y%m%d-%H%M%S).sql"
   ```

2. Deploy the backend compose changes. In the VPS `.env`, keep
   `DB_NAME=rapidstylers_live` and `DEMO_DB_NAME=rapid_stylers` and set
   `DEMO_READ_ONLY=false`. Confirm these names match the running databases;
   never point both app containers at the same database. The switch affects
   only `app-demo`; its Stripe mode stays `test` and its live keys stay empty.

3. In the same Stripe test account used by `STRIPE_TEST_SECRET_KEY`, configure
   platform and connected-account event destinations at:
   `https://api-demo.rapidstylers.ca/rapid_stylers/stripe/webhook`.
   Store their signing secrets privately as `DEMO_STRIPE_TEST_WEBHOOK_SECRET`
   and `DEMO_STRIPE_TEST_CONNECT_WEBHOOK_SECRET` in the VPS `.env`.
   Subscribe the platform destination to `payment_intent.succeeded`,
   `payment_intent.payment_failed`, `payment_intent.canceled`,
   `charge.dispute.created`, and `charge.dispute.closed`; subscribe the
   connected-account destination to `account.updated`.
   The server accepts either signing secret on the same route.
   Existing live-API destinations are separate and should stay in place.
   When sharing a Stripe test account, each API may receive events for the
   other database; unmatched events are not proof of a successful QA booking.

4. Restart only the demo service:

   ```sh
   docker compose -f docker-compose.prod.yml --profile demo up -d --no-deps app-demo
   ```

5. On the existing **demo** Vercel project, set the Build Command to
   `npm run build:demo-qa`, supply `REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY`
   from the same test account, and redeploy the updated source.
   Keep the project's normal `REACT_APP_DEMO_MODE=true` setting for rollback.
   QA builds explicitly override it, pin the demo API and Stripe test mode,
   omit live publishable keys, and retain `noindex` HTML. The normal live
   project's build command stays `npm run build`.

## Verify before handing to QA

- Confirm demo and live containers still use different databases.
- Open sign-up and sign-in on the demo: they must remain on the demo domain.
- Confirm browser booking requests go to `api-demo.rapidstylers.ca`.
- Create a QA customer and a new stylist account; approve the stylist and
  complete Stripe test Connect onboarding through the Payouts UI. Showroom
  seed accounts cannot sign in. Add a service, valid address, and availability.
- Check a genuine Stripe delivery returns 2xx and updates the matching QA row.
  An unsigned webhook must fail signature verification, not the demo write guard.
- Complete booking/payment, cancellation/refund, decline/retry, and payout
  scenarios through the UI. Record appointment IDs and corresponding Stripe
  test payment IDs. Book within the authorization window for an immediate
  authorization; future bookings may defer it. Verify capture separately.
- Payouts normally have a 24-hour hold after completion; exercise the existing
  customer confirmation/admin release flow or wait for the scheduled release.
- Email and uploads use the existing configured providers. Use QA-owned inboxes
  and test files. Demo newsletter links now point back to the demo environment.

## Close after QA

1. Finish outstanding capture, refund, and payout checks and allow webhook
   deliveries to settle. A closed demo rejects payment webhooks too.
2. Set `DEMO_READ_ONLY=true` in the VPS `.env` and restart only `app-demo`
   using the command above. Persist the value in `.env` so CI restarts retain it.
3. Restore the demo Vercel Build Command to `npm run build`, keep
   `REACT_APP_DEMO_MODE=true` and `REACT_APP_DEMO_BOOKING_OPEN=false`, and
   redeploy. Confirm the disabled “Booking opens at launch” button returns.
4. QA data remains in the demo database. Do not restore the backup or delete
   records automatically; review what should be kept first.

Opening the live site for launch is a separate operation with its own keys,
accounts, webhook destinations, and booking checks.
