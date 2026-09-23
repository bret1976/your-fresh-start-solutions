import { useEffect } from "react";
import { PHONE, PHONE_TEL, site } from "@/lib/site";
import { TextLink } from "@/components/SiteShell";

const thumbs = {
  a: "/media/images/galleries/style/719/images/thumb-2.jpg",
  b: "/media/images/galleries/style/719/images/thumb-1.jpg",
  c: "/media/images/galleries/style/719/images/thumb-3.jpg",
};

export function HomePage() {
  useEffect(() => {
    document.title = "Your Fresh Start Solutions LLC | Home Page";
  }, []);

  return (
    <>
      <section className="hero home-hero" style={{ backgroundImage: `url(${site.heroImage})` }}>
        <div className="hero-card">
          <p className="hero-kicker">You don't have to be a tax expert.</p>
          <p className="hero-title">That's our job.</p>
          <a className="btn btn-green btn-lg" href="#modalConsult">
            Schedule a Consultation
          </a>
        </div>
      </section>

      <section className="award-bar">
        <p>
          <strong>
            Your Fresh Start Solutions LLC Ranked #1 in Camden Accountant Rankings for 2026&nbsp;&nbsp;
            <TextLink href="/award-recognition.php">{"Learn More >>"}</TextLink>
          </strong>
        </p>
      </section>

      <nav className="quick-links" aria-label="Highlights">
        <TextLink href="/about.php">
          <i className="fa fa-user-circle-o" aria-hidden="true" /> About
        </TextLink>
        <TextLink href="/newsletter.php">
          <i className="fa fa-newspaper-o" aria-hidden="true" /> Newsletter
        </TextLink>
        <TextLink href="/reports.php">
          <i className="fa fa-bar-chart-o" aria-hidden="true" /> Financial Guides
        </TextLink>
        <TextLink href="/taxcenter2.php">
          <i className="fa fa-calendar" aria-hidden="true" /> Tax Center
        </TextLink>
        <TextLink href="/resources.php">
          <i className="fa fa-gear" aria-hidden="true" /> Resources
        </TextLink>
        <TextLink href="/contact.php">
          <i className="fa fa-comments-o" aria-hidden="true" /> Contact
        </TextLink>
      </nav>

      <section className="band band-gray">
        <div className="wrap icon-grid">
          <article>
            <i className="fa fa-compass bubble" aria-hidden="true" />
            <div>
              <h2>Services For Individuals</h2>
              <p>
                You get one-on-one guidance that helps manage risk and improve performance.{" "}
                <TextLink href="/indservices.php">
                  Learn more <i className="fa fa-angle-double-right" aria-hidden="true" />
                </TextLink>
              </p>
            </div>
          </article>
          <article>
            <i className="fa fa-briefcase bubble" aria-hidden="true" />
            <div>
              <h2>Business Services</h2>
              <p>
                We take care of your business for you, so you can get back to the job of running your business.{" "}
                <TextLink href="/bizservices.php">
                  Learn more <i className="fa fa-angle-double-right" aria-hidden="true" />
                </TextLink>
              </p>
            </div>
          </article>
          <article>
            <i className="fa fa-calculator bubble" aria-hidden="true" />
            <div>
              <h2>Tax Services</h2>
              <p>
                We pride ourselves on being very efficient, affordable, and of course, extremely discreet.{" "}
                <TextLink href="/taxservices.php">
                  Learn more <i className="fa fa-angle-double-right" aria-hidden="true" />
                </TextLink>
              </p>
            </div>
          </article>
          <article>
            <i className="fa fa-book bubble" aria-hidden="true" />
            <div>
              <h2>QuickBooks Services</h2>
              <p>
                QuickBooks is the ideal business accounting software for small to mid-sized business owners.{" "}
                <TextLink href="/qbmain.php">
                  Learn more <i className="fa fa-angle-double-right" aria-hidden="true" />
                </TextLink>
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="band">
        <div className="wrap feature">
          <img src={thumbs.a} alt="" />
          <div>
            <h2>Your Fresh Start Solutions LLC specializes in Business and Taxes.</h2>
            <p>
              We are professional, experienced, and affordable. We offer a broad range of services for business owners,
              executives, and independent professionals.{" "}
              <TextLink href="/about.php">
                About Us <i className="fa fa-angle-double-right" aria-hidden="true" />
              </TextLink>
            </p>
          </div>
        </div>
        <div className="wrap feature flip">
          <img src={thumbs.b} alt="" />
          <div>
            <h2>Today's tax laws are complicated.</h2>
            <p>
              Filing a relatively simple return can be confusing. It is just too easy to overlook deductions and credits
              to which you are entitled. Even if you use a computer software program there's no substitute for the
              assistance of an experienced tax professional.{" "}
              <TextLink href="/taxservices.php">
                Tax Services <i className="fa fa-angle-double-right" aria-hidden="true" />
              </TextLink>
            </p>
          </div>
        </div>
        <div className="wrap feature">
          <img src={thumbs.c} alt="" />
          <div>
            <h2>
              Please call us at <a href={PHONE_TEL}>{PHONE}.</a>
            </h2>
            <p>
              We can also assist if you find yourself on the wrong side of the IRS. We're here to help you resolve your
              tax problems and put an end to the misery that the IRS can put you through.{" "}
              <TextLink href="/taxproblems.php">
                Tax Problems <i className="fa fa-angle-double-right" aria-hidden="true" />
              </TextLink>
            </p>
          </div>
        </div>
      </section>

      <HelpBand />
    </>
  );
}

export function HelpBand() {
  return (
    <section className="band band-gray">
      <div className="wrap icon-grid">
        <article>
          <i className="fa fa-comments-o bubble" aria-hidden="true" />
          <div>
            <h2>Ask a Question</h2>
            <p>
              Find comfort in knowing an expert in accounting is only an email or phone-call away.{" "}
              <a href={PHONE_TEL}>
                {PHONE} <i className="fa fa-angle-double-right" aria-hidden="true" />
              </a>
            </p>
          </div>
        </article>
        <article>
          <i className="fa fa-calendar-check-o bubble" aria-hidden="true" />
          <div>
            <h2>We Are Here to Help</h2>
            <p>
              We will happily offer you a free consultation to determine how we can best serve you.{" "}
              <TextLink href="/contact.php">
                Contact Us <i className="fa fa-angle-double-right" aria-hidden="true" />
              </TextLink>
            </p>
          </div>
        </article>
        <article>
          <i className="fa fa-copy bubble" aria-hidden="true" />
          <div>
            <h2>Send Us a File</h2>
            <p>
              Use our convenient SecureSend page to securely deliver a file directly to a member of our firm.{" "}
              <TextLink href="/quick-send.php">
                Secure Send <i className="fa fa-angle-double-right" aria-hidden="true" />
              </TextLink>
            </p>
          </div>
        </article>
        <article>
          <i className="fa fa-envelope-open-o bubble" aria-hidden="true" />
          <div>
            <h2>Subscribe to our Newsletter</h2>
            <p>
              Subscribe to our monthly emailed newsletter to receive news, updates, and valuable tips.{" "}
              <a href="#modalSubscribe">
                Subscribe <i className="fa fa-angle-double-right" aria-hidden="true" />
              </a>
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
