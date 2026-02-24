import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Droplets, 
  Users, 
  Heart, 
  Shield, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react'

function Home() {
  const { isAuthenticated, user } = useAuth()

  const features = [
    {
      icon: <Droplets className="home-feature-icon-svg" />,
      title: "Easy Registration",
      description: "Quick and simple donor registration with comprehensive health screening"
    },
    {
      icon: <Users className="home-feature-icon-svg" />,
      title: "Community Network",
      description: "Connect with students, faculty, and alumni in your college community"
    },
    {
      icon: <Heart className="home-feature-icon-svg" />,
      title: "Save Lives",
      description: "Make a real difference by donating blood when someone needs it most"
    },
    {
      icon: <Shield className="home-feature-icon-svg" />,
      title: "Safe & Secure",
      description: "Your data is protected with industry-standard security measures"
    }
  ]

  const stats = [
    { number: "500+", label: "Active Donors" },
    { number: "1000+", label: "Lives Saved" },
    { number: "50+", label: "Donation Camps" },
    { number: "99%", label: "Success Rate" }
  ]

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="container">
          <div className="home-hero-content">
            <h1 className="home-hero-title">
              Save Lives Through
              <span className="home-hero-title-accent">Blood Donation</span>
            </h1>
            <p className="home-hero-description">
              Join our college community of blood donors and make a difference in someone's life today.
            </p>
            <div className="home-hero-actions">
              {!isAuthenticated && (
                <>
                  <Link to="/register" className="btn btn-lg home-hero-btn-primary">
                    Become a Donor
                    <ArrowRight className="home-hero-btn-icon" />
                  </Link>
                  <Link to="/login" className="btn btn-lg home-hero-btn-secondary">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="home-stats">
        <div className="container">
          <div className="home-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="home-stat-item">
                <div className="home-stat-number">
                  {stat.number}
                </div>
                <div className="home-stat-label">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="container">
          <div className="home-features-header">
            <h2 className="home-features-title">
              Why Choose EDUDONOR?
            </h2>
            <p className="home-features-description">
              We make blood donation simple, safe, and impactful for the college community.
            </p>
          </div>

          <div className="home-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="card home-feature-card">
                <div className="card-body">
                  <div className="home-feature-icon">
                    {feature.icon}
                  </div>
                  <h3 className="home-feature-title">
                    {feature.title}
                  </h3>
                  <p className="home-feature-description">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-how-it-works">
        <div className="container">
          <div className="home-how-it-works-header">
            <h2 className="home-how-it-works-title">
              How It Works
            </h2>
            <p className="home-how-it-works-description">
              Simple steps to become a lifesaver in your community.
            </p>
          </div>

          <div className="home-how-it-works-grid">
            <div className="home-step">
              <div className="home-step-icon">
                <span className="home-step-number">1</span>
              </div>
              <h3 className="home-step-title">
                Register as Donor
              </h3>
              <p className="home-step-description">
                Create your profile with basic information and health details.
              </p>
            </div>

            <div className="home-step">
              <div className="home-step-icon">
                <span className="home-step-number">2</span>
              </div>
              <h3 className="home-step-title">
                Get Matched
              </h3>
              <p className="home-step-description">
                Receive notifications when someone needs your blood type.
              </p>
            </div>

            <div className="home-step">
              <div className="home-step-icon">
                <span className="home-step-number">3</span>
              </div>
              <h3 className="home-step-title">
                Save a Life
              </h3>
              <p className="home-step-description">
                Donate blood and make a real difference in someone's life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta">
        <div className="container">
          <h2 className="home-cta-title">
            Ready to Make a Difference?
          </h2>
          <p className="home-cta-description">
            Join thousands of students, faculty, and alumni who are already saving lives through blood donation.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn btn-lg home-cta-btn">
              Get Started Today
              <ArrowRight className="home-cta-btn-icon" />
            </Link>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="home-testimonials">
        <div className="container">
          <div className="home-testimonials-header">
            <h2 className="home-testimonials-title">
              What Our Community Says
            </h2>
          </div>

          <div className="home-testimonials-grid">
            <div className="card home-testimonial-card">
              <div className="card-body">
                <div className="home-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="home-testimonial-star" />
                  ))}
                </div>
                <p className="home-testimonial-text">
                  "EDUDONOR made it so easy to help someone in need. The platform is user-friendly and the community is amazing."
                </p>
                <div className="home-testimonial-author">Sarah Johnson</div>
                <div className="home-testimonial-role">Computer Science Student</div>
              </div>
            </div>

            <div className="card home-testimonial-card">
              <div className="card-body">
                <div className="home-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="home-testimonial-star" />
                  ))}
                </div>
                <p className="home-testimonial-text">
                  "As a faculty member, I appreciate how this platform brings our college community together for a noble cause."
                </p>
                <div className="home-testimonial-author">Dr. Michael Chen</div>
                <div className="home-testimonial-role">Biology Professor</div>
              </div>
            </div>

            <div className="card home-testimonial-card">
              <div className="card-body">
                <div className="home-testimonial-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="home-testimonial-star" />
                  ))}
                </div>
                <p className="home-testimonial-text">
                  "The notification system is excellent. I was able to respond quickly when someone needed my blood type."
                </p>
                <div className="home-testimonial-author">Alex Rodriguez</div>
                <div className="home-testimonial-role">Alumni</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
