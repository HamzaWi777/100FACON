export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-950 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-purple-400">100 FAÇONS</h3>
            <p className="text-gray-400">
              Votre destination premium pour la mode et les accessoires tendance. Découvrez votre propre style.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-purple-400">Collections</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/products" className="hover:text-purple-300 transition">Tous les produits</a></li>
              <li><a href="/products?category=women" className="hover:text-purple-300 transition">Femmes</a></li>
              <li><a href="/products?category=men" className="hover:text-purple-300 transition">Hommes</a></li>
              <li><a href="/products?category=accessories" className="hover:text-purple-300 transition">Accessoires</a></li>
              <li><a href="/products?category=enfants" className="hover:text-purple-300 transition">Enfants</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-purple-400">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="tel:+21652254040"
                  className="hover:text-purple-300 transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.01 21 3 13.99 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z"/>
                  </svg>
                  52 254 040
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/21652254040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-300 transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.83L.057 23.486a.5.5 0 00.614.657l5.752-1.506A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 01-5.073-1.387l-.361-.214-3.747.981.999-3.648-.235-.374A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                  </svg>
                  WhatsApp
                </a>
              </li>
              <li><a href="#" className="hover:text-purple-300 transition">FAQ</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Retours & Échanges</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-purple-400">Légal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-purple-300 transition">À propos</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">CGV</a></li>
              <li><a href="#" className="hover:text-purple-300 transition">Mentions légales</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center md:text-left">
            <p className="text-gray-400">
              &copy; 2025 100 FAÇONS. Tous droits réservés.
            </p>
            <div className="flex justify-center md:justify-end gap-4 text-gray-400">
              <a href="#" className="hover:text-purple-300 transition">Instagram</a>
              <a href="https://www.facebook.com/profile.php?id=61565881585728" className="hover:text-purple-300 transition">Facebook</a>
              <a href="#" className="hover:text-purple-300 transition">TikTok</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}