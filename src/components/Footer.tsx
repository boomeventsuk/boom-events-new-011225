import { Mail, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="contact" className="bg-card border-t border-border py-lg">
      <div className="container mx-auto px-4">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <img 
              src="https://boombastic-events.b-cdn.net/The2PMCLUB-Website/57926c83-5a73-43e4-b501-9f9c758534fd_fs7hwi.png"
              alt="Boombastic Events Logo"
              className="h-16 w-auto"
              loading="lazy"
              decoding="async"
            />
          </div>
          
          {/* Contact Info */}
          <div className="flex items-center justify-center mb-8">
            <a 
              href="mailto:hello@boomevents.co.uk"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span className="font-poppins">hello@boomevents.co.uk</span>
            </a>
          </div>
          
          {/* Social Icons */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <a 
              href="https://www.facebook.com/boombastic.eventsuk"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a 
              href="https://www.instagram.com/boombastic.eventsuk"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="w-6 h-6" />
            </a>
          </div>
          
          {/* Legal Links */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <Link 
              to="/privacy"
              className="font-poppins text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link 
              to="/terms"
              className="font-poppins text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
          
          {/* Copyright */}
          <p className="font-poppins text-sm text-muted-foreground">
            © {new Date().getFullYear()} Boombastic Events Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;