export function Footer() {
  return (
    <footer className="bg-black-950 dark:bg-black-900 text-white border-t-4 border-gold-500 dark:border-gold-400">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/images/logo.png" 
                alt="M.C DENTAL CLINIC Logo" 
                className="h-10 w-10 object-contain" 
              />
              <span className="text-xl font-bold text-gold-500 dark:text-gold-400">M.C DENTAL CLINIC</span>
            </div>
            <p className="text-gray-400 dark:text-gray-300 text-sm leading-relaxed">
              Quality dental care for your perfect smile. Trusted by thousands of patients.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gold-500 dark:text-gold-400">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <a href="/" className="text-gray-400 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 transition-colors text-sm">
                Home
              </a>
              <a href="/services" className="text-gray-400 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 transition-colors text-sm">
                Services
              </a>
              <a href="/about" className="text-gray-400 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 transition-colors text-sm">
                About Us
              </a>
              <a href="/contact" className="text-gray-400 dark:text-gray-300 hover:text-gold-500 dark:hover:text-gold-400 transition-colors text-sm">
                Contact
              </a>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gold-500 dark:text-gold-400">Contact Us</h3>
            <div className="space-y-2 text-sm text-gray-400 dark:text-gray-300">
              <p>Email: info@mcdentalclinic.com</p>
              <p>Phone: (02) 1234-5678</p>
              <p>Hours: Mon-Sat 9AM-6PM</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} M.C DENTAL CLINIC. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gold-500 dark:hover:text-gold-400 transition-colors text-sm">
              Privacy Policy
            </a>
            <span className="text-gray-600 dark:text-gray-500">|</span>
            <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gold-500 dark:hover:text-gold-400 transition-colors text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
