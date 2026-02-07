import { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import api from '@/lib/api';

interface GalleryCase {
  id: string;
  title: string;
  description?: string;
  treatment: string;
  beforeImage: string;
  afterImage: string;
  createdAt?: string;
}

// Before/After Slider Component
function BeforeAfterSlider({ beforeImage, afterImage, title }: { beforeImage: string; afterImage: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-ew-resize select-none group"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) */}
      <img
        src={afterImage}
        alt={`${title} - After`}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={`${title} - Before`}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 text-white text-sm font-semibold rounded-full backdrop-blur-sm">
        Before
      </div>
      <div className="absolute top-3 right-3 px-3 py-1 bg-gold-500 text-black text-sm font-semibold rounded-full">
        After
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-gold-500 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </div>
      </div>

      {/* Instruction overlay */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
        Drag to compare
      </div>
    </div>
  );
}

export function GalleryPage() {
  const [cases, setCases] = useState<GalleryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTreatment, setSelectedTreatment] = useState<string>('all');

  useEffect(() => {
    const loadGallery = async () => {
      try {
        setLoading(true);
        const response = await api.getGalleryCases();
        const data = Array.isArray(response) ? response : (response as any)?.data ?? [];
        // Normalize the data
        const normalizedCases = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          treatment: c.treatment || c.treatment_type || 'General',
          beforeImage: c.before_image_url || c.beforeImage,
          afterImage: c.after_image_url || c.afterImage,
          createdAt: c.created_at || c.createdAt,
        }));
        setCases(normalizedCases);
      } catch (error) {
        console.error('Error loading gallery:', error);
        setCases([]);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, []);

  // Get unique treatments for filter
  const treatments = ['all', ...new Set(cases.map(c => c.treatment))];
  
  // Filter cases
  const filteredCases = selectedTreatment === 'all' 
    ? cases 
    : cases.filter(c => c.treatment === selectedTreatment);

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-gold-50 via-white to-blue-50 dark:from-black-950 dark:via-black-900 dark:to-black-950 overflow-hidden">
          <div className="absolute inset-0 opacity-20 dark:opacity-10">
            <span className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gold-400 blur-3xl"></span>
            <span className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl"></span>
          </div>
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">
              Smile Gallery
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See the amazing transformations we've achieved for our patients. 
              Drag the slider to compare before and after results.
            </p>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-20 bg-white dark:bg-black-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Treatment Filter */}
            {cases.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                {treatments.map((treatment) => (
                  <button
                    key={treatment}
                    onClick={() => setSelectedTreatment(treatment)}
                    className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all ${
                      selectedTreatment === treatment
                        ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-black shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {treatment === 'all' ? 'All Treatments' : treatment}
                  </button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
              </div>
            )}

            {/* Empty State */}
            {!loading && cases.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gold-600 dark:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Gallery Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  We're preparing our smile transformations gallery. Check back soon to see amazing before and after results!
                </p>
              </div>
            )}

            {/* Gallery Grid */}
            {!loading && filteredCases.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-black-900 dark:to-black-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-gold-300 dark:hover:border-gold-600 overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Before/After Slider */}
                    <BeforeAfterSlider
                      beforeImage={caseItem.beforeImage}
                      afterImage={caseItem.afterImage}
                      title={caseItem.title}
                    />

                    {/* Case Info */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-gradient-to-r from-gold-500 to-gold-400 text-black text-xs font-bold rounded-full">
                          {caseItem.treatment}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {caseItem.title}
                      </h3>
                      {caseItem.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {caseItem.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No results for filter */}
            {!loading && cases.length > 0 && filteredCases.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  No cases found for "{selectedTreatment}". Try selecting a different treatment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-gold-500 to-gold-400 dark:from-gold-600 dark:to-gold-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-black mb-4">
              Ready for Your Transformation?
            </h2>
            <p className="text-lg text-black/80 mb-8 max-w-2xl mx-auto">
              Book a consultation today and let us help you achieve the smile you've always wanted.
            </p>
            <a
              href="/book"
              className="inline-flex items-center justify-center px-8 py-4 bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Book Your Consultation
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default GalleryPage;

