import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Moon, Sun, ArrowUpRight, Mail, MapPin, 
  Phone, Globe, Linkedin, Github, Instagram, Twitter, 
  Sparkles, CheckCircle2, AlertCircle, Loader2, Send, 
  ExternalLink, Briefcase, GraduationCap, Award, Layers,
  MessageSquare, User, ShieldCheck, RefreshCw, ChevronRight
} from 'lucide-react';

/**
 * KONFIGURASI SKEMA JSON UNTUK EKSTRAKSI CV YANG KETAT (STRICT NO-HALLUCINATION)
 * Memastikan model hanya mengekstrak fakta yang ada di dokumen dan mengembalikan null/array kosong jika tidak ada.
 */
const CV_EXTRACTION_SCHEMA = {
  type: "OBJECT",
  properties: {
    fullName: { type: "STRING", description: "Nama lengkap kandidat sesuai CV. Kosongkan jika tidak ada." },
    headline: { type: "STRING", description: "Jabatan utama atau peran profesional sesuai CV (misal: Senior Frontend Engineer, Arsitek, Fotografer). Jangan mengarang." },
    professionalDomain: { type: "STRING", description: "Kategori bidang profesi (misal: Teknologi, Desain, Kreatif, Bisnis, Akademik)." },
    heroTagline: { type: "STRING", description: "Ringkasan singkat 1 kalimat yang diambil langsung atau disarikan ketat dari profil CV tanpa menambah klaim palsu." },
    aboutSummary: { type: "STRING", description: "Deskripsi 'Tentang Saya' berdasarkan ringkasan/objektif di CV. Jika tidak ada, kosongkan." },
    location: {
      type: "OBJECT",
      properties: {
        cityCountry: { type: "STRING", description: "Kota dan negara sesuai CV. Kosongkan jika tidak tercantum." },
        fullAddress: { type: "STRING", description: "Alamat lengkap jika tersedia di CV. Kosongkan jika tidak ada." },
        googleMapsEmbedUrl: { type: "STRING", description: "HANYA isi jika ada URL Google Maps eksplisit di dalam teks CV. Jika tidak ada, WAJIB string kosong." }
      }
    },
    contact: {
      type: "OBJECT",
      properties: {
        email: { type: "STRING", description: "Alamat email valid dari CV." },
        phone: { type: "STRING", description: "Nomor telepon dari CV." },
        whatsappNumber: { type: "STRING", description: "Nomor WhatsApp bersih (hanya angka dengan kode negara, misal 62812...) jika nomor HP tercantum di CV. Kosongkan jika tidak ada." },
        website: { type: "STRING", description: "URL website pribadi jika tercantum." },
        linkedin: { type: "STRING", description: "URL atau username LinkedIn jika tercantum." },
        github: { type: "STRING", description: "URL atau username GitHub jika tercantum." },
        instagram: { type: "STRING", description: "URL atau username Instagram jika tercantum." },
        behanceOrDribbble: { type: "STRING", description: "URL portofolio kreatif lain jika tercantum." }
      }
    },
    skillsAndServices: {
      type: "ARRAY",
      description: "Daftar keahlian teknis, soft skills, atau layanan yang eksplisit disebutkan di CV.",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          category: { type: "STRING" },
          details: { type: "STRING", description: "Penjelasan singkat berdasarkan konteks di CV, atau kosongkan jika hanya berupa daftar kata kunci." }
        }
      }
    },
    experiences: {
      type: "ARRAY",
      description: "Riwayat pengalaman kerja, magang, atau organisasi yang tercatat di CV.",
      items: {
        type: "OBJECT",
        properties: {
          role: { type: "STRING" },
          company: { type: "STRING" },
          period: { type: "STRING" },
          location: { type: "STRING" },
          highlights: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        }
      }
    },
    projects: {
      type: "ARRAY",
      description: "Daftar proyek, karya, publikasi, atau portofolio yang tertulis di CV.",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          roleOrCategory: { type: "STRING" },
          year: { type: "STRING" },
          description: { type: "STRING" },
          technologiesOrTools: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          link: { type: "STRING", description: "URL proyek jika ada di CV, kosongkan jika tidak ada." }
        }
      }
    },
    education: {
      type: "ARRAY",
      description: "Riwayat pendidikan formal dari CV.",
      items: {
        type: "OBJECT",
        properties: {
          degree: { type: "STRING" },
          institution: { type: "STRING" },
          period: { type: "STRING" },
          notes: { type: "STRING" }
        }
      }
    },
    testimonialsOrReferences: {
      type: "ARRAY",
      description: "HANYA isi jika di CV benar-benar terdapat kutipan testimoni, rekomendasi, atau kontak referensi. JANGAN MENGARANG.",
      items: {
        type: "OBJECT",
        properties: {
          author: { type: "STRING" },
          roleOrCompany: { type: "STRING" },
          quoteOrContact: { type: "STRING" }
        }
      }
    },
    marqueeKeywords: {
      type: "ARRAY",
      description: "6 hingga 10 kata kunci keahlian/peran yang diambil murni dari CV untuk teks berjalan.",
      items: { type: "STRING" }
    }
  },
  required: ["fullName", "headline", "skillsAndServices", "experiences", "projects", "education", "testimonialsOrReferences"]
};

/**
 * KOMPONEN CUSTOM CURSOR (HALUS & RESPONSIF PADA PERANGKAT POINTER)
 */
const CustomCursor = ({ isDark }) => {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Nonaktifkan custom cursor pada perangkat layar sentuh
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;
    let animationFrameId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) setVisible(true);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
      }

      const target = e.target;
      const isInteractive = target.closest('a, button, input, textarea, [data-cursor="hover"]');
      setHovered(Boolean(isInteractive));
    };

    const onMouseLeave = () => setVisible(false);

    const animateFollower = () => {
      followerX += (mouseX - followerX) * 0.14;
      followerY += (mouseY - followerY) * 0.14;

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${followerX - (hovered ? 24 : 16)}px, ${followerY - (hovered ? 24 : 16)}px, 0)`;
      }
      animationFrameId = requestAnimationFrame(animateFollower);
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    animationFrameId = requestAnimationFrame(animateFollower);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hovered, visible]);

  if (!visible) return null;

  return (
    <>
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999] transition-opacity duration-300 ${
          isDark ? 'bg-amber-400' : 'bg-zinc-900'
        }`}
      />
      <div
        ref={followerRef}
        className={`fixed top-0 left-0 rounded-full pointer-events-none z-[9998] transition-all duration-300 ease-out border ${
          hovered ? 'w-12 h-12 scale-110' : 'w-8 h-8 scale-100'
        } ${
          isDark 
            ? 'border-amber-400/50 bg-amber-400/5' 
            : 'border-zinc-900/40 bg-zinc-900/5'
        }`}
      />
    </>
  );
};

/**
 * KOMPONEN SCROLL REVEAL (INTERSECTION OBSERVER UNTUK ANIMASI SINEMATIK HALUS)
 */
const RevealSection = ({ children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * KOMPONEN PRELOADER ELEGAN
 */
const Preloader = ({ onFinish, isDark }) => {
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setClosing(true), 200);
          setTimeout(() => onFinish(), 850);
          return 100;
        }
        return prev + Math.floor(Math.random() * 18) + 8;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        closing ? '-translate-y-full' : 'translate-y-0'
      } ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-[#FAF9F6] text-zinc-900'}`}
    >
      <div className="w-64 sm:w-80 space-y-4">
        <div className="flex justify-between items-end font-mono text-xs tracking-widest uppercase opacity-70">
          <span>Memuat Studio Portfolio</span>
          <span>{Math.min(progress, 100)}%</span>
        </div>
        <div className={`h-[2px] w-full overflow-hidden rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
          <div
            className={`h-full transition-all duration-200 ease-out ${isDark ? 'bg-amber-400' : 'bg-zinc-900'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * APLIKASI UTAMA PORTFOLIO DINAMIS BERBASIS CV
 */
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [loadingPreloader, setLoadingPreloader] = useState(true);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [rawCvText, setRawCvText] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);

  // State untuk Form Kontak
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState('idle'); // idle | sent

  const fileInputRef = useRef(null);

  // Fungsi Helper Exponential Backoff untuk Gemini API
  const fetchWithRetry = async (url, options, maxRetries = 4) => {
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url, options);
        if (res.ok) return await res.json();
        if (res.status === 429 || res.status >= 500) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
        const errData = await res.json();
        throw new Error(errData?.error?.message || 'Gagal memproses permintaan API.');
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  };

  // Konversi File ke Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * PARSER LOKAL DETERMINISTIK (TANPA API / ZERO-HALLUCINATION)
   * Digunakan otomatis sebagai fallback jika izin layanan API ditolak oleh sandbox pratinjau,
   * atau saat pengguna menempel teks CV / mengunggah file .txt secara offline.
   */
  const parseCvTextLocally = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Ekstraksi Kontak Faktual dengan Regex
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(\+?\d[\d\s\-()]{8,16}\d)/);
    const urlMatches = text.match(/https?:\/\/[^\s)]+|(?:www\.|linkedin\.com\/in\/|github\.com\/|instagram\.com\/)[^\s)]+/gi) || [];

    const linkedin = urlMatches.find((u) => u.toLowerCase().includes('linkedin.com')) || '';
    const github = urlMatches.find((u) => u.toLowerCase().includes('github.com')) || '';
    const instagram = urlMatches.find((u) => u.toLowerCase().includes('instagram.com')) || '';
    const googleMapsEmbedUrl = urlMatches.find((u) => u.toLowerCase().includes('google.com/maps') || u.toLowerCase().includes('goo.gl/maps')) || '';
    const website = urlMatches.find(
      (u) =>
        !u.toLowerCase().includes('linkedin.com') &&
        !u.toLowerCase().includes('github.com') &&
        !u.toLowerCase().includes('instagram.com') &&
        !u.toLowerCase().includes('google.com/maps')
    ) || '';

    const rawPhone = phoneMatch ? phoneMatch[0].trim() : '';
    const cleanWa = rawPhone ? rawPhone.replace(/[^0-9]/g, '').replace(/^0/, '62') : '';

    // Identifikasi Nama & Headline dari baris awal CV
    const fullName = lines[0] && lines[0].length < 60 ? lines[0] : 'Kandidat Profesional';
    const headline =
      lines[1] && !lines[1].includes('@') && lines[1].length < 80
        ? lines[1]
        : '';

    // Pemisahan Bagian berdasarkan Header Umum CV (ID / EN)
    const sectionPatterns = {
      about: /^(tentang|profil|ringkasan|summary|about|profile|objective|objektif)/i,
      skills: /^(keahlian|skill|skills|kemampuan|layanan|services|kompetensi|technical skills|tools)/i,
      experience: /^(pengalaman|experience|work experience|riwayat pekerjaan|karir|organisasi)/i,
      projects: /^(proyek|project|projects|portofolio|portfolio|karya|publikasi)/i,
      education: /^(pendidikan|education|akademik|riwayat pendidikan)/i,
      testimonials: /^(testimoni|testimonial|referensi|references|rekomendasi)/i,
    };

    const buckets = {
      about: [],
      skills: [],
      experience: [],
      projects: [],
      education: [],
      testimonials: [],
    };

    let currentBucket = 'about';
    for (let i = headline ? 2 : 1; i < lines.length; i++) {
      const line = lines[i];
      // Lewati baris yang murni informasi kontak
      if (line.includes('@') || (rawPhone && line.includes(rawPhone))) continue;

      let matchedHeader = false;
      for (const [key, regex] of Object.entries(sectionPatterns)) {
        if (regex.test(line) && line.length < 45) {
          currentBucket = key;
          matchedHeader = true;
          break;
        }
      }
      if (!matchedHeader) {
        buckets[currentBucket].push(line);
      }
    }

    // Susun Keahlian dari teks CV
    const skillsAndServices = buckets.skills
      .join(', ')
      .split(/[,•|·]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 60)
      .slice(0, 18)
      .map((title) => ({
        title,
        category: '',
        details: '',
      }));

    // Susun Pengalaman dari baris CV
    const experiences = buckets.experience.length
      ? [
          {
            role: buckets.experience[0],
            company: buckets.experience[1] || '',
            period: '',
            location: '',
            highlights: buckets.experience.slice(2),
          },
        ]
      : [];

    // Susun Proyek dari baris CV
    const projects = buckets.projects.length
      ? [
          {
            title: buckets.projects[0],
            roleOrCategory: '',
            year: '',
            description: buckets.projects.slice(1).join(' '),
            technologiesOrTools: [],
            link: '',
          },
        ]
      : [];

    // Susun Pendidikan dari baris CV
    const education = buckets.education.length
      ? [
          {
            degree: buckets.education[0],
            institution: buckets.education[1] || '',
            period: '',
            notes: buckets.education.slice(2).join(' '),
          },
        ]
      : [];

    // Susun Referensi/Testimoni HANYA jika bagian tersebut memang ada di CV
    const testimonialsOrReferences = buckets.testimonials.length
      ? [
          {
            author: buckets.testimonials[0],
            roleOrCompany: buckets.testimonials[1] || '',
            quoteOrContact: buckets.testimonials.slice(2).join(' ') || buckets.testimonials[0],
          },
        ]
      : [];

    return {
      fullName,
      headline,
      professionalDomain: '',
      heroTagline: buckets.about[0] || '',
      aboutSummary: buckets.about.join(' '),
      location: {
        cityCountry: '',
        fullAddress: '',
        googleMapsEmbedUrl,
      },
      contact: {
        email: emailMatch ? emailMatch[0] : '',
        phone: rawPhone,
        whatsappNumber: cleanWa,
        website,
        linkedin,
        github,
        instagram,
        behanceOrDribbble: '',
      },
      skillsAndServices,
      experiences,
      projects,
      education,
      testimonialsOrReferences,
      marqueeKeywords: skillsAndServices.slice(0, 8).map((s) => s.title),
    };
  };

  // Ekstraksi Data CV menggunakan Gemini API dengan Fallback Parser Lokal jika layanan ditolak
  const processCvContent = async ({ file = null, plainText = '' }) => {
    setIsExtracting(true);
    setExtractionError('');

    const systemInstruction = `
Anda adalah parser data CV berpresisi tinggi. Tugas Anda adalah mengekstrak informasi dari CV yang diberikan ke dalam format JSON terstruktur.
ATURAN MUTLAK:
1. HANYA ekstrak informasi yang benar-benar tertulis di dalam CV.
2. DILARANG KERAS mengarang, menebak, menambahkan proyek fiktif, membuat testimoni palsu, atau membuat tautan Google Maps/sosial media yang tidak ada di CV.
3. Jika sebuah bagian (misalnya testimoni, proyek, alamat lengkap, atau Google Maps URL) tidak tercantum di dalam CV, kembalikan string kosong ("") atau array kosong ([]).
4. Pertahankan bahasa asli dari fakta tersebut atau gunakan Bahasa Indonesia yang rapi dan akurat sesuai isi CV.
5. Jangan menambahkan klaim pencapaian atau angka metrik yang tidak disebutkan secara eksplisit.
    `.trim();

    try {
      const parts = [];
      if (file) {
        const base64Data = await fileToBase64(file);
        parts.push({
          text: "Ekstrak seluruh informasi faktual dari dokumen CV terlampir ke dalam skema JSON yang ditentukan. Jangan menambah informasi apa pun di luar dokumen."
        });
        parts.push({
          inlineData: {
            mimeType: file.type || 'application/pdf',
            data: base64Data
          }
        });
      } else if (plainText.trim()) {
        parts.push({
          text: `Ekstrak seluruh informasi faktual dari teks CV berikut ke dalam skema JSON yang ditentukan. Jangan menambah informasi apa pun di luar teks ini:\n\n${plainText}`
        });
      } else {
        throw new Error('Tidak ada konten CV yang diberikan.');
      }

      const apiKey = customApiKey.trim();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ role: "user", parts }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: CV_EXTRACTION_SCHEMA,
          temperature: 0.1
        }
      };

      const result = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const rawJsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJsonText) {
        throw new Error('Model tidak mengembalikan data terstruktur yang valid.');
      }

      const parsedData = JSON.parse(rawJsonText);
      setPortfolioData(parsedData);
      setShowPasteModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      // Jika input berupa teks (dari Tempah Teks CV atau file .txt) dan layanan API ditolak izinnya,
      // jalankan Parser Lokal secara otomatis agar portfolio tetap terbangun tanpa mengarang data!
      if (plainText && plainText.trim()) {
        const localParsed = parseCvTextLocally(plainText);
        setPortfolioData(localParsed);
        setShowPasteModal(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setExtractionError(
          'Layanan pembacaan dokumen otomatis (PDF/Gambar) dibatasi oleh izin browser/sandbox pratinjau ("Permission denied on the service"). Silakan klik tombol "TEMPEL TEKS CV" di atas atau unggah file .TXT agar portfolio tetap dibangun langsung dari data CV Anda secara lokal.'
        );
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // Handler Unggah File
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileName(selectedFile.name);

    // Jika file teks murni (.txt / .md)
    if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt') || selectedFile.name.endsWith('.md')) {
      const textContent = await selectedFile.text();
      await processCvContent({ plainText: textContent });
    } else {
      // Mendukung PDF dan Gambar CV (PNG, JPEG, WEBP) secara native di Gemini Multimodal
      await processCvContent({ file: selectedFile });
    }
  };

  // Handler Kirim Form Kontak (Membuka mailto: dengan email asli dari CV)
  const handleContactSubmit = (e) => {
    e.preventDefault();
    const targetEmail = portfolioData?.contact?.email;
    if (targetEmail) {
      const subject = encodeURIComponent(contactForm.subject || `Pesan Portfolio dari ${contactForm.name}`);
      const body = encodeURIComponent(
        `Halo ${portfolioData?.fullName || ''},\n\nNama: ${contactForm.name}\nEmail: ${contactForm.email}\n\nPesan:\n${contactForm.message}`
      );
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    }
    setFormStatus('sent');
    setTimeout(() => setFormStatus('idle'), 5000);
  };

  // Helper Validasi URL Maps (Hanya render iframe jika benar-benar URL embed/maps yang valid dari CV)
  const isValidMapsUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith('https://www.google.com/maps/embed') ||
      trimmed.startsWith('https://maps.google.com/') ||
      trimmed.startsWith('https://goo.gl/maps/')
    );
  };

  // Menu Navigasi Dinamis (Hanya tampilkan menu yang datanya ada di CV)
  const navItems = portfolioData
    ? [
        { id: 'tentang', label: 'Tentang', show: Boolean(portfolioData.aboutSummary || portfolioData.education?.length) },
        { id: 'keahlian', label: 'Keahlian', show: Boolean(portfolioData.skillsAndServices?.length) },
        { id: 'pengalaman', label: 'Pengalaman', show: Boolean(portfolioData.experiences?.length) },
        { id: 'proyek', label: 'Karya & Proyek', show: Boolean(portfolioData.projects?.length) },
        { id: 'testimoni', label: 'Referensi', show: Boolean(portfolioData.testimonialsOrReferences?.length) },
        { id: 'kontak', label: 'Kontak', show: true }
      ].filter((item) => item.show)
    : [];

  return (
    <div
      className={`min-h-screen transition-colors duration-500 selection:bg-amber-400 selection:text-zinc-950 ${
        isDark ? 'bg-[#09090B] text-[#F4F4F5]' : 'bg-[#FAF9F6] text-[#18181B]'
      }`}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Preloader */}
      {loadingPreloader && <Preloader isDark={isDark} onFinish={() => setLoadingPreloader(false)} />}

      {/* Custom Cursor */}
      <CustomCursor isDark={isDark} />

      {/* Style Global untuk Marquee & Tipografi Editorial */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        .font-display {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .font-sans-modern {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marqueeScroll 28s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* =====================================================================
          STICKY NAVBAR PREMIUM
      ====================================================================== */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-500 ${
          isDark
            ? 'bg-[#09090B]/80 border-zinc-800/80'
            : 'bg-[#FAF9F6]/85 border-zinc-200/80'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-4">
          {/* Logo / Nama di Kiri */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-lg font-bold transition-transform duration-300 group-hover:scale-105 ${
                isDark ? 'bg-amber-400 text-zinc-950' : 'bg-zinc-900 text-amber-300'
              }`}
            >
              {portfolioData?.fullName ? portfolioData.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div className="flex flex-col">
              <span className="font-sans-modern font-semibold text-sm sm:text-base tracking-tight leading-none">
                {portfolioData?.fullName || 'Studio Portfolio'}
              </span>
              {portfolioData?.professionalDomain && (
                <span className={`text-[11px] uppercase tracking-widest mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {portfolioData.professionalDomain}
                </span>
              )}
            </div>
          </a>

          {/* Navigasi di Tengah (Hanya muncul saat data CV tersedia) */}
          {portfolioData && (
            <nav className="hidden md:flex items-center gap-7">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`text-xs uppercase tracking-[0.16em] font-medium transition-colors duration-200 ${
                    isDark
                      ? 'text-zinc-400 hover:text-amber-400'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Kontrol Aksi di Kanan: Unggah CV Baru & Toggle Dark/Light Mode */}
          <div className="flex items-center gap-2 sm:gap-3">
            {portfolioData && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium border transition-all duration-300 ${
                  isDark
                    ? 'border-zinc-700 hover:border-amber-400/70 bg-zinc-900/70 text-zinc-200'
                    : 'border-zinc-300 hover:border-zinc-900 bg-white text-zinc-800'
                }`}
                title="Ganti CV"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ganti CV</span>
              </button>
            )}

            <button
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle Mode Gelap/Terang"
              className={`p-2.5 rounded-full border transition-all duration-300 ${
                isDark
                  ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800'
                  : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Input File Tersembunyi */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* =====================================================================
          MODE 1: BELUM ADA CV DIUNGGAH (ONBOARDING STUDIO ZERO-HALLUCINATION)
      ====================================================================== */}
      {!portfolioData && (
        <main className="font-sans-modern max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase border ${
                isDark
                  ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Akurat Berdasarkan Data CV Anda</span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08]">
              Ubah CV Anda Menjadi{' '}
              <span className="italic font-normal text-amber-500">Portfolio Eksekutif</span>{' '}
              Otomatis.
            </h1>

            <p className={`text-base sm:text-lg leading-relaxed max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Unggah file CV Anda (PDF, Gambar, atau Teks) atau tempel isi CV. Sistem akan menyusun website portfolio interaktif untuk profesi apa pun—tanpa mengarang data atau menambah informasi palsu.
            </p>
          </div>

          {/* Kartu Dropzone Unggah CV */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div
              onClick={() => !isExtracting && fileInputRef.current?.click()}
              className={`relative group cursor-pointer rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-500 ${
                isExtracting
                  ? 'opacity-70 pointer-events-none'
                  : isDark
                  ? 'border-zinc-800 hover:border-amber-400/70 bg-zinc-900/40 hover:bg-zinc-900/80'
                  : 'border-zinc-300 hover:border-zinc-900 bg-white hover:bg-zinc-50/80 shadow-sm'
              }`}
            >
              {isExtracting ? (
                <div className="space-y-4 py-4">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-400" />
                  <h3 className="text-lg font-semibold">Mengekstrak Fakta dari CV Anda...</h3>
                  <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Membaca pengalaman, keahlian, proyek, pendidikan, dan kontak tanpa rekayasa data.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-1 ${
                      isDark ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-100 text-zinc-900'
                    }`}
                  >
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Pilih atau Jatuhkan File CV di Sini</h3>
                    <p className={`text-sm mt-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Mendukung format PDF, JPG, PNG, WEBP, atau TXT
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <span
                      className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${
                        isDark
                          ? 'bg-amber-400 text-zinc-950 group-hover:bg-amber-300'
                          : 'bg-zinc-900 text-white group-hover:bg-zinc-800'
                      }`}
                    >
                      Unggah Dokumen CV
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPasteModal(true);
                      }}
                      className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase border transition-all ${
                        isDark
                          ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                          : 'border-zinc-300 text-zinc-700 hover:border-zinc-900'
                      }`}
                    >
                      Tempel Teks CV
                    </button>
                  </div>
                </div>
              )}
            </div>

            {extractionError && (
              <div className="mt-4 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{extractionError}</span>
                </div>
                <div className="pl-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    className="px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors"
                  >
                    Gunakan Tempel Teks CV (Tanpa API)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApiConfig(!showApiConfig)}
                    className="text-xs underline opacity-80 hover:opacity-100"
                  >
                    {showApiConfig ? 'Sembunyikan Pengaturan API Key' : 'Masukkan Gemini API Key Sendiri'}
                  </button>
                </div>
                {showApiConfig && (
                  <div className="pl-8 pt-1">
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="Tempel AIzaSy... API Key Anda lalu unggah ulang PDF/Gambar"
                      className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${
                        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Lencana Profesi yang Didukung */}
            <div className="mt-10 pt-8 border-t border-zinc-800/40 text-center">
              <p className={`text-xs uppercase tracking-widest mb-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Beradaptasi Otomatis Untuk Semua Profesi
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Software Developer', 'UI/UX Designer', 'Fotografer', 'Videografer',
                  'Digital Marketer', 'Arsitek', 'Penulis & Editor', 'Freelancer', 'Mahasiswa'
                ].map((role) => (
                  <span
                    key={role}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      isDark
                        ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                        : 'border-zinc-200 bg-white text-zinc-600'
                    }`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* MODAL TEMPEL TEKS CV */}
      {showPasteModal && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl rounded-3xl p-6 sm:p-8 border shadow-2xl ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Tempel Isi Teks CV Anda</span>
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-sm opacity-60 hover:opacity-100 px-2 py-1"
              >
                Tutup
              </button>
            </div>
            <textarea
              rows={9}
              value={rawCvText}
              onChange={(e) => setRawCvText(e.target.value)}
              placeholder="Salin dan tempel seluruh isi CV Anda di sini (Nama, Ringkasan, Pengalaman, Keahlian, Proyek, Pendidikan, Kontak)..."
              className={`w-full rounded-2xl p-4 text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-600'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
              }`}
            />
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2.5 rounded-full text-xs font-medium opacity-70 hover:opacity-100"
              >
                Batal
              </button>
              <button
                disabled={!rawCvText.trim() || isExtracting}
                onClick={() => processCvContent({ plainText: rawCvText })}
                className={`px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 ${
                  isDark ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                {isExtracting ? 'Memproses...' : 'Bangun Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 2: HALAMAN PORTFOLIO DINAMIS (DIRENDER MURNI DARI DATA CV)
      ====================================================================== */}
      {portfolioData && (
        <main className="font-sans-modern">
          {/* 1. HERO SECTION */}
          <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-32 border-b border-zinc-800/30">
            {/* Efek Cahaya Ambient Sinematik */}
            <div
              className={`pointer-events-none absolute -top-32 right-0 w-[480px] h-[480px] rounded-full blur-[130px] opacity-20 ${
                isDark ? 'bg-amber-500' : 'bg-amber-300'
              }`}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
              <RevealSection>
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  {portfolioData.location?.cityCountry && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border ${
                        isDark ? 'border-zinc-800 bg-zinc-900/70 text-zinc-300' : 'border-zinc-200 bg-white text-zinc-700'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {portfolioData.location.cityCountry}
                    </span>
                  )}
                  {fileName && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs border ${
                        isDark ? 'border-zinc-800/80 text-zinc-500' : 'border-zinc-200 text-zinc-500'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Sumber: {fileName}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-semibold tracking-tight leading-[1.03] max-w-5xl">
                  {portfolioData.fullName || 'Profil Profesional'}
                </h1>

                {portfolioData.headline && (
                  <p className="mt-4 font-display italic text-2xl sm:text-4xl text-amber-500">
                    {portfolioData.headline}
                  </p>
                )}

                {portfolioData.heroTagline && (
                  <p
                    className={`mt-8 text-base sm:text-xl leading-relaxed max-w-2xl ${
                      isDark ? 'text-zinc-400' : 'text-zinc-600'
                    }`}
                  >
                    {portfolioData.heroTagline}
                  </p>
                )}

                {/* Tombol CTA Utama */}
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a
                    href="#kontak"
                    className={`inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] ${
                      isDark
                        ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>Hubungi Saya</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  {portfolioData.projects?.length > 0 && (
                    <a
                      href="#proyek"
                      className={`inline-flex items-center gap-2 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-widest border transition-all duration-300 ${
                        isDark
                          ? 'border-zinc-700 hover:border-zinc-500 text-zinc-200'
                          : 'border-zinc-300 hover:border-zinc-900 text-zinc-800'
                      }`}
                    >
                      <span>Lihat Karya & Proyek</span>
                    </a>
                  )}
                </div>
              </RevealSection>
            </div>
          </section>

          {/* 2. MARQUEE TEKS BERJALAN (HANYA DARI KATA KUNCI CV) */}
          {portfolioData.marqueeKeywords?.length > 0 && (
            <div
              className={`py-5 border-b overflow-hidden select-none ${
                isDark
                  ? 'border-zinc-800/80 bg-zinc-900/40 text-zinc-300'
                  : 'border-zinc-200 bg-zinc-100/70 text-zinc-700'
              }`}
            >
              <div className="animate-marquee flex items-center gap-10">
                {[...portfolioData.marqueeKeywords, ...portfolioData.marqueeKeywords].map((word, idx) => (
                  <div key={idx} className="flex items-center gap-10 whitespace-nowrap">
                    <span className="font-display italic text-2xl sm:text-3xl tracking-wide">{word}</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. TENTANG SAYA & PENDIDIKAN */}
          {(portfolioData.aboutSummary || portfolioData.education?.length > 0) && (
            <section id="tentang" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
              <RevealSection>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                  <div className="lg:col-span-4">
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500">
                      01 / Profil
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-semibold mt-3">
                      Tentang Saya
                    </h2>
                  </div>

                  <div className="lg:col-span-8 space-y-10">
                    {portfolioData.aboutSummary && (
                      <p
                        className={`text-lg sm:text-2xl leading-relaxed font-light ${
                          isDark ? 'text-zinc-200' : 'text-zinc-800'
                        }`}
                      >
                        {portfolioData.aboutSummary}
                      </p>
                    )}

                    {/* Riwayat Pendidikan jika tersedia di CV */}
                    {portfolioData.education?.length > 0 && (
                      <div className="pt-6 border-t border-zinc-800/30">
                        <h3 className="text-xs font-mono uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-amber-400" />
                          <span>Latar Belakang Pendidikan</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {portfolioData.education.map((edu, idx) => (
                            <div
                              key={idx}
                              className={`p-5 rounded-2xl border ${
                                isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white'
                              }`}
                            >
                              {edu.period && (
                                <span className="text-xs font-mono text-amber-500">{edu.period}</span>
                              )}
                              <h4 className="font-semibold text-base mt-1">{edu.degree}</h4>
                              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                {edu.institution}
                              </p>
                              {edu.notes && (
                                <p className={`text-xs mt-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                  {edu.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </RevealSection>
            </section>
          )}

          {/* 4. KEAHLIAN / LAYANAN */}
          {portfolioData.skillsAndServices?.length > 0 && (
            <section
              id="keahlian"
              className={`py-20 sm:py-28 border-t ${
                isDark ? 'border-zinc-800/60 bg-zinc-900/20' : 'border-zinc-200/80 bg-zinc-100/40'
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                <RevealSection>
                  <div className="mb-14">
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500">
                      02 / Kapabilitas
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-semibold mt-3">
                      Keahlian & Layanan
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolioData.skillsAndServices.map((skill, idx) => (
                      <div
                        key={idx}
                        className={`group p-7 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${
                          isDark
                            ? 'border-zinc-800 bg-[#09090B] hover:border-amber-400/50'
                            : 'border-zinc-200 bg-white hover:border-zinc-900 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-mono opacity-50">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          {skill.category && (
                            <span
                              className={`text-[11px] px-2.5 py-0.5 rounded-full ${
                                isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              {skill.category}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold group-hover:text-amber-500 transition-colors">
                          {skill.title}
                        </h3>
                        {skill.details && (
                          <p className={`text-sm mt-2.5 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {skill.details}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </RevealSection>
              </div>
            </section>
          )}

          {/* 5. PENGALAMAN PROFESIONAL */}
          {portfolioData.experiences?.length > 0 && (
            <section id="pengalaman" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
              <RevealSection>
                <div className="mb-14">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500">
                    03 / Rekam Jejak
                  </span>
                  <h2 className="font-display text-3xl sm:text-5xl font-semibold mt-3">
                    Pengalaman Kerja & Organisasi
                  </h2>
                </div>

                <div className="space-y-8">
                  {portfolioData.experiences.map((exp, idx) => (
                    <div
                      key={idx}
                      className={`p-7 sm:p-9 rounded-3xl border transition-all ${
                        isDark
                          ? 'border-zinc-800 bg-zinc-900/30'
                          : 'border-zinc-200 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-zinc-800/30">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-semibold">{exp.role}</h3>
                          <p className="text-amber-500 font-medium mt-1">
                            {exp.company}
                            {exp.location ? ` • ${exp.location}` : ''}
                          </p>
                        </div>
                        {exp.period && (
                          <span
                            className={`self-start sm:self-center px-3.5 py-1.5 rounded-full text-xs font-mono ${
                              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {exp.period}
                          </span>
                        )}
                      </div>

                      {exp.highlights?.length > 0 && (
                        <ul className="mt-5 space-y-2.5">
                          {exp.highlights.map((point, pIdx) => (
                            <li
                              key={pIdx}
                              className={`flex items-start gap-3 text-sm sm:text-base leading-relaxed ${
                                isDark ? 'text-zinc-300' : 'text-zinc-700'
                              }`}
                            >
                              <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </RevealSection>
            </section>
          )}

          {/* 6. PROYEK / KARYA TERPILIH (DENGAN HOVER HALUS) */}
          {portfolioData.projects?.length > 0 && (
            <section
              id="proyek"
              className={`py-20 sm:py-28 border-t ${
                isDark ? 'border-zinc-800/60 bg-zinc-900/20' : 'border-zinc-200/80 bg-zinc-100/40'
              }`}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                <RevealSection>
                  <div className="mb-14">
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500">
                      04 / Portofolio Karya
                    </span>
                    <h2 className="font-display text-3xl sm:text-5xl font-semibold mt-3">
                      Proyek & Pencapaian
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {portfolioData.projects.map((proj, idx) => (
                      <article
                        key={idx}
                        className={`group relative rounded-3xl p-8 border flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 ${
                          isDark
                            ? 'border-zinc-800 bg-[#09090B] hover:border-amber-400/60 hover:shadow-[0_20px_50px_rgba(251,191,36,0.06)]'
                            : 'border-zinc-200 bg-white hover:border-zinc-900 hover:shadow-xl'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-4 mb-5">
                            <span className="text-xs font-mono uppercase tracking-wider text-amber-500">
                              {proj.roleOrCategory || `Karya #${idx + 1}`}
                            </span>
                            {proj.year && (
                              <span className="text-xs font-mono opacity-60">{proj.year}</span>
                            )}
                          </div>

                          <h3 className="font-display text-2xl sm:text-3xl font-semibold group-hover:text-amber-500 transition-colors">
                            {proj.title}
                          </h3>

                          {proj.description && (
                            <p
                              className={`mt-4 text-sm sm:text-base leading-relaxed ${
                                isDark ? 'text-zinc-400' : 'text-zinc-600'
                              }`}
                            >
                              {proj.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-zinc-800/30 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap gap-2">
                            {proj.technologiesOrTools?.map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className={`px-3 py-1 rounded-full text-xs ${
                                  isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {tool}
                              </span>
                            ))}
                          </div>

                          {proj.link && (
                            <a
                              href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-500 hover:underline"
                            >
                              <span>Tinjau</span>
                              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </RevealSection>
              </div>
            </section>
          )}

          {/* 7. TESTIMONI / REFERENSI (HANYA TAMPIL JIKA ADA DI CV) */}
          {portfolioData.testimonialsOrReferences?.length > 0 && (
            <section id="testimoni" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
              <RevealSection>
                <div className="mb-14">
                  <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500">
                    05 / Validasi
                  </span>
                  <h2 className="font-display text-3xl sm:text-5xl font-semibold mt-3">
                    Testimoni & Referensi
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolioData.testimonialsOrReferences.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-8 rounded-3xl border ${
                        isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <p className="font-display italic text-xl sm:text-2xl leading-relaxed">
                        “{item.quoteOrContact}”
                      </p>
                      <div className="mt-6 pt-4 border-t border-zinc-800/30">
                        <p className="font-semibold text-sm">{item.author}</p>
                        {item.roleOrCompany && (
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {item.roleOrCompany}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RevealSection>
            </section>
          )}

          {/* 8. HUBUNGI SAYA (LENGKAP DENGAN VALIDASI MAPS & WHATSAPP) */}
          <section
            id="kontak"
            className={`py-24 sm:py-32 border-t ${
              isDark ? 'border-zinc-800 bg-[#070709]' : 'border-zinc-200 bg-[#F3F1EC]'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
              <RevealSection>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                  {/* Kolom Kiri: Ajakan & Detail Kontak Faktual dari CV */}
                  <div className="lg:col-span-5 space-y-8">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500">
                        Mari Berkolaborasi
                      </span>
                      <h2 className="font-display text-4xl sm:text-6xl font-semibold mt-3 leading-tight">
                        Hubungi Saya
                      </h2>
                      <p className={`mt-4 text-base leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        Tertarik untuk berdiskusi mengenai proyek, peluang kerja, atau kolaborasi profesional? Silakan hubungi melalui saluran resmi di bawah ini.
                      </p>
                    </div>

                    {/* Daftar Kontak yang Tersedia di CV */}
                    <div className="space-y-4">
                      {portfolioData.contact?.email && (
                        <a
                          href={`mailto:${portfolioData.contact.email}`}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
                            isDark
                              ? 'border-zinc-800 bg-zinc-900/50 hover:border-amber-400/50'
                              : 'border-zinc-200 bg-white hover:border-zinc-900'
                          }`}
                        >
                          <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                          <div className="overflow-hidden">
                            <span className="text-[11px] uppercase tracking-wider opacity-60 block">Email</span>
                            <span className="text-sm font-medium truncate block">{portfolioData.contact.email}</span>
                          </div>
                        </a>
                      )}

                      {portfolioData.contact?.phone && (
                        <div
                          className={`flex items-center gap-4 p-4 rounded-2xl border ${
                            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-[11px] uppercase tracking-wider opacity-60 block">Telepon</span>
                            <span className="text-sm font-medium">{portfolioData.contact.phone}</span>
                          </div>
                        </div>
                      )}

                      {(portfolioData.location?.fullAddress || portfolioData.location?.cityCountry) && (
                        <div
                          className={`flex items-start gap-4 p-4 rounded-2xl border ${
                            isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-white'
                          }`}
                        >
                          <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[11px] uppercase tracking-wider opacity-60 block">Lokasi</span>
                            <span className="text-sm font-medium">
                              {portfolioData.location.fullAddress || portfolioData.location.cityCountry}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tombol WhatsApp (HANYA jika nomor tersedia di CV) */}
                    {portfolioData.contact?.whatsappNumber && (
                      <div>
                        <a
                          href={`https://wa.me/${portfolioData.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat via WhatsApp</span>
                        </a>
                      </div>
                    )}

                    {/* Tautan Sosial Media (HANYA yang tercantum di CV) */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {portfolioData.contact?.linkedin && (
                        <a
                          href={portfolioData.contact.linkedin.startsWith('http') ? portfolioData.contact.linkedin : `https://${portfolioData.contact.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-full border transition-colors ${
                            isDark ? 'border-zinc-800 hover:border-amber-400 text-zinc-300' : 'border-zinc-300 hover:border-zinc-900 text-zinc-700'
                          }`}
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {portfolioData.contact?.github && (
                        <a
                          href={portfolioData.contact.github.startsWith('http') ? portfolioData.contact.github : `https://${portfolioData.contact.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-full border transition-colors ${
                            isDark ? 'border-zinc-800 hover:border-amber-400 text-zinc-300' : 'border-zinc-300 hover:border-zinc-900 text-zinc-700'
                          }`}
                          aria-label="GitHub"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {portfolioData.contact?.instagram && (
                        <a
                          href={portfolioData.contact.instagram.startsWith('http') ? portfolioData.contact.instagram : `https://${portfolioData.contact.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-full border transition-colors ${
                            isDark ? 'border-zinc-800 hover:border-amber-400 text-zinc-300' : 'border-zinc-300 hover:border-zinc-900 text-zinc-700'
                          }`}
                          aria-label="Instagram"
                        >
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {portfolioData.contact?.website && (
                        <a
                          href={portfolioData.contact.website.startsWith('http') ? portfolioData.contact.website : `https://${portfolioData.contact.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-full border transition-colors ${
                            isDark ? 'border-zinc-800 hover:border-amber-400 text-zinc-300' : 'border-zinc-300 hover:border-zinc-900 text-zinc-700'
                          }`}
                          aria-label="Website"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {/* Google Maps Embed (HANYA jika link valid benar-benar tersedia di CV) */}
                    {isValidMapsUrl(portfolioData.location?.googleMapsEmbedUrl) && (
                      <div className="pt-4">
                        <div className="rounded-2xl overflow-hidden border border-zinc-800 h-56 w-full">
                          <iframe
                            src={portfolioData.location.googleMapsEmbedUrl}
                            title="Lokasi Peta"
                            className="w-full h-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kolom Kanan: Form Kontak Profesional */}
                  <div className="lg:col-span-7">
                    <form
                      onSubmit={handleContactSubmit}
                      className={`p-8 sm:p-10 rounded-3xl border space-y-6 ${
                        isDark
                          ? 'border-zinc-800 bg-zinc-900/50'
                          : 'border-zinc-200 bg-white shadow-sm'
                      }`}
                    >
                      <h3 className="font-display text-2xl sm:text-3xl font-semibold">
                        Kirim Pesan Langsung
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-wider opacity-70">
                            Nama Lengkap
                          </label>
                          <input
                            type="text"
                            required
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            placeholder="Masukkan nama Anda"
                            className={`w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${
                              isDark
                                ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                                : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                            }`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-wider opacity-70">
                            Alamat Email
                          </label>
                          <input
                            type="email"
                            required
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="nama@domain.com"
                            className={`w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${
                              isDark
                                ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                                : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider opacity-70">
                          Subjek Diskusi
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          placeholder="Kolaborasi Proyek / Tawaran Kerja / Konsultasi"
                          className={`w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${
                            isDark
                              ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                              : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                          }`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-wider opacity-70">
                          Pesan
                        </label>
                        <textarea
                          rows={5}
                          required
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Tuliskan detail kebutuhan atau pesan Anda di sini..."
                          className={`w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all ${
                            isDark
                              ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                              : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                          }`}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <button
                          type="submit"
                          className={`inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-widest transition-all ${
                            isDark
                              ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                              : 'bg-zinc-900 text-white hover:bg-zinc-800'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          <span>Kirim Pesan</span>
                        </button>

                        {formStatus === 'sent' && (
                          <span className="text-xs text-emerald-500 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Pesan siap dikirim melalui klien email Anda.
                          </span>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </RevealSection>
            </div>
          </section>

          {/* FOOTER PENUTUP BERKESAN */}
          <footer
            className={`py-10 border-t text-xs ${
              isDark ? 'border-zinc-900 bg-[#050507] text-zinc-500' : 'border-zinc-200 bg-white text-zinc-500'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>
                © {new Date().getFullYear()} {portfolioData.fullName || 'Portfolio Pribadi'}. Seluruh konten bersumber langsung dari dokumen CV resmi.
              </p>
              <a
                href="#"
                className="uppercase tracking-widest hover:text-amber-500 transition-colors"
              >
                Kembali ke Atas ↑
              </a>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}