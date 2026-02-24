import { Link } from 'react-router-dom'
import { Droplets, Mail, Phone, MapPin } from 'lucide-react'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Logo and Description */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <Droplets className="footer-logo-svg" />
              </div>
              <span className="footer-logo-text">EDUDONOR</span>
            </div>
            <p className="footer-description">
              A comprehensive blood donation platform connecting students, faculty, and alumni 
              to save lives through voluntary blood donation. Join our community of lifesavers.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link">
                <Mail className="footer-social-icon" />
              </a>
              <a href="#" className="footer-social-link">
                <Phone className="footer-social-icon" />
              </a>
              <a href="#" className="footer-social-link">
                <MapPin className="footer-social-icon" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h3 className="footer-links-title">Quick Links</h3>
            <ul className="footer-links-list">
              <li>
                <Link to="/home" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/camps" className="footer-link">
                  Donation Camps
                </Link>
              </li>
              <li>
                <Link to="/login" className="footer-link">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="footer-link">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-contact">
            <h3 className="footer-contact-title">Contact Us</h3>
            <div className="footer-contact-info">
              <div className="footer-contact-item">
                <Mail className="footer-contact-icon" />
                <span>info@edudonor.com</span>
              </div>
              <div className="footer-contact-item">
                <Phone className="footer-contact-icon" />
                <span>+91 98765 43210</span>
              </div>
              <div className="footer-contact-item">
                <MapPin className="footer-contact-icon" />
                <span>College Campus, City</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">&copy; 2024 EDUDONOR. All rights reserved. Made with ❤️ for saving lives.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
