import { Mail, Facebook, Instagram } from "lucide-react";

const partyLinks = [
  { label: "BOOMBASTIC 90s", href: "/boombastic-90s/" },
  { label: "Silent Disco Greatest Hits", href: "/silent-disco/" },
  { label: "FOOTLOOSE 80s", href: "/footloose-80s/" },
  { label: "GET READY", href: "/get-ready/" },
  { label: "Family Silent Disco", href: "/family-silent-disco/" },
  { label: "THE 2PM CLUB", href: "https://www.the2pmclub.co.uk", external: true },
];

const locationLinks = [
  { label: "Northampton", href: "/locations/northampton/" },
  { label: "Bedford", href: "/locations/bedford/" },
  { label: "Milton Keynes", href: "/locations/milton-keynes/" },
  { label: "Coventry", href: "/locations/coventry/" },
  { label: "Luton", href: "/locations/luton/" },
  { label: "Leicester", href: "/locations/leicester/" },
];

const companyLinks = [
  { label: "About", href: "/about/" },
  { label: "Work With Us", href: "/jobs" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

const Footer = () => {
  return (
    <footer id="contact" className="bg-card border-t border-border py-lg">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1: Logo + Contact + Social */}
          <div>
            <div className="mb-6">
              <img 
                src="https://boombastic-events.b-cdn.net/The2PMCLUB-Website/57926c83-5a73-43e4-b501-9f9c758534fd_fs7hwi.png"
                alt="Boombastic Events Logo"
                className="h-14 w-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
            <a 
              href="mailto:hello@boomevents.co.uk"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <Mail className="w-4 h-4" />
              <span className="font-poppins text-sm">hello@boomevents.co.uk</span>
            </a>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.facebook.com/boombastic.eventsuk"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/boombastic.eventsuk"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Our Parties */}
          <div>
            <h3 className="font-poppins font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Our Parties</h3>
            <ul className="space-y-2.5">
              {partyLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-poppins text-sm text-muted-foreground hover:text-primary transition-colors"
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Locations */}
          <div>
            <h3 className="font-poppins font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Locations</h3>
            <ul className="space-y-2.5">
              {locationLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-poppins text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="font-poppins font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-poppins text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="font-poppins text-sm text-muted-foreground">
            © {new Date().getFullYear()} Boombastic Events Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
