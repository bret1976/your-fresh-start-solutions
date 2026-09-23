# Your Fresh Start Solutions — preview checklist

This is a public-page copy of https://www.yourfreshstartsolutions.com/.
The live domain, email, client accounts, and payment accounts were not changed.

## Completed public pages

Homepage, About, Our Values, 2026 ranking, Services and the individual, tax, business, QuickBooks, tax relief, and industry pages, Resources (newsletter, eight archived issues, guides, calculators index and categories, links, refund policy), Tax Center pages, Ebooks, 2025–26 tax updates, Contact, Reviews, Pay My Fee, Client Portal, SecureSend, Search, Site Map, Privacy, Disclaimer, and Security Measures.

Wording, service names, address, phone, and email were copied from the live pages. Paths ending in `.php` were kept.

## Still using the current outside services

These are linked, not rebuilt:

- Client portal login: https://www.securefirmportal.com/Account/Login/69667
- Portal registration: https://www.securefirmportal.com/Account/Register/69667
- Portal payment button on Pay My Fee: same login with `returnURL=/Launch/Payment`
- Hero “Pay My Fee” button: Bluefin/PayConex page `aid=120615818311` `id=204271` at secure.payconex.net
- Cash App: https://cash.app/$Yourfreshstart43
- Venmo: the QR and link already on the Pay My Fee page
- Newsletter signup: https://www.cpaemailmarketing.com/client/campsub.php (`un=yourfres`)
- Calculators: CalcXML, opened from `/calcloader.php?calc=...` the same way the current site does
- Search: Google, limited to `site:yourfreshstartsolutions.com` (the live domain, not this preview)
- Newsletter RSS: https://www.yourfreshstartsolutions.com/rssfeed.php
- Map on the contact page: the existing Google Maps embed
- SecureSend video: the existing YouTube embed. Uploading a file is done in the portal, not on a form on that page.

## Needs your decision before the old site can be turned off

1. Email forms. Contact, consultation, sidebar, and several service pages post to `feedbackmail.php` on the current host. In this preview those forms do not send, and they do not show a success message. A new mailbox or form address is needed.
2. CAPTCHA. The images still load from the live site’s `securimage` script. They cannot be checked without that server.
3. Client portal and payments. Accounts stay at CPA Site Solutions / Secure Firm Portal, and card payments stay at Bluefin/PayConex. Canceling CPA Site Solutions would break login, registration, and the portal payment path.
4. Newsletter list. Signups still go to CPA email marketing. That list has to move or stay before that account is closed.
5. Tax Center widgets. Tax Rates, IRS forms, state forms, and the record retention guide are filled in by scripts on acctsite.com. Those addresses answered with a security challenge when they were fetched, so the lists can render blank. Tax due dates are the same kind of outside script (a rolling 12-month loader). None of those lists were rewritten or invented.
6. Homepage “Tax Problems” goes to `taxproblems.php`. That address is a 404 on the live site. The Tax Relief section that does exist is `irs-problemshome.php`. The broken link was kept.
7. Pay My Fee credit-card image. On the live page the first card image is wrapped in a link whose address is a broken PHP snippet (`<?php echo $config[`). The image is on the preview. The dead link is not.
8. One gallery image 404s on the live site as well: a doubled path ending in `calculator02_sxc.png`.
9. Analytics (Matomo at analytics.prosites.com, site 18531) was not copied.

## Not a cutover

This copy is for review. It is not a replacement of the live domain, and CPA Site Solutions has not been canceled.
