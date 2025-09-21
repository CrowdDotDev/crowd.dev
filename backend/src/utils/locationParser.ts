// Country code mapping for common location strings
// This is a basic implementation - in production you might want to use a more robust
// geocoding service like Google Maps API, Mapbox, or a location parsing library
const COUNTRY_MAPPINGS = {
  // USA variants
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'america': 'US',
  'united states of america': 'US',
  'california': 'US',
  'new york': 'US',
  'texas': 'US',
  'florida': 'US',
  'washington': 'US',
  'oregon': 'US',
  'colorado': 'US',
  'massachusetts': 'US',
  'georgia state': 'US',
  'georgia us': 'US',
  'illinois': 'US',
  'pennsylvania': 'US',
  'virginia': 'US',
  'north carolina': 'US',
  'ohio': 'US',
  'michigan': 'US',
  'arizona': 'US',
  'nevada': 'US',
  'utah': 'US',
  'minnesota': 'US',
  'wisconsin': 'US',
  'kansas': 'US',
  'missouri': 'US',
  'tennessee': 'US',
  'indiana': 'US',
  'louisiana': 'US',
  'alabama': 'US',
  'kentucky': 'US',
  'arkansas': 'US',
  'iowa': 'US',
  'connecticut': 'US',
  'maryland': 'US',
  'new jersey': 'US',
  'hawaii': 'US',
  'alaska': 'US',
  
  // UK variants
  'united kingdom': 'GB',
  'uk': 'GB',
  'britain': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  'london': 'GB',
  
  // Canada variants
  'canada': 'CA',
  'ontario': 'CA',
  'quebec': 'CA',
  'british columbia': 'CA',
  'alberta': 'CA',
  'manitoba': 'CA',
  'saskatchewan': 'CA',
  'nova scotia': 'CA',
  'new brunswick': 'CA',
  'newfoundland': 'CA',
  'toronto': 'CA',
  'vancouver': 'CA',
  'montreal': 'CA',
  'calgary': 'CA',
  'ottawa': 'CA',
  
  // Other countries
  'germany': 'DE',
  'france': 'FR',
  'italy': 'IT',
  'spain': 'ES',
  'netherlands': 'NL',
  'holland': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'poland': 'PL',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'iceland': 'IS',
  'portugal': 'PT',
  'ireland': 'IE',
  'czech republic': 'CZ',
  'slovakia': 'SK',
  'hungary': 'HU',
  'romania': 'RO',
  'bulgaria': 'BG',
  'croatia': 'HR',
  'slovenia': 'SI',
  'estonia': 'EE',
  'latvia': 'LV',
  'lithuania': 'LT',
  'malta': 'MT',
  'cyprus': 'CY',
  'luxembourg': 'LU',
  'greece': 'GR',
  
  // Asia
  'china': 'CN',
  'japan': 'JP',
  'south korea': 'KR',
  'korea': 'KR',
  'india': 'IN',
  'singapore': 'SG',
  'malaysia': 'MY',
  'thailand': 'TH',
  'indonesia': 'ID',
  'philippines': 'PH',
  'vietnam': 'VN',
  'taiwan': 'TW',
  'hong kong': 'HK',
  'australia': 'AU',
  'new zealand': 'NZ',
  
  // Middle East & Africa
  'israel': 'IL',
  'united arab emirates': 'AE',
  'uae': 'AE',
  'saudi arabia': 'SA',
  'south africa': 'ZA',
  'egypt': 'EG',
  'turkey': 'TR',
  
  // South America
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'venezuela': 'VE',
  'uruguay': 'UY',
  'ecuador': 'EC',
  'bolivia': 'BO',
  'paraguay': 'PY',
  
  // Mexico and Central America
  'mexico': 'MX',
  'costa rica': 'CR',
  'panama': 'PA',
  'guatemala': 'GT',
  'honduras': 'HN',
  'el salvador': 'SV',
  'nicaragua': 'NI',
  'belize': 'BZ',
  
  // Eastern Europe & Russia
  'russia': 'RU',
  'ukraine': 'UA',
  'belarus': 'BY',
  'moldova': 'MD',
  'georgia': 'GE',
  'armenia': 'AM',
  'azerbaijan': 'AZ',
  'kazakhstan': 'KZ',
  'uzbekistan': 'UZ',
  'kyrgyzstan': 'KG',
  'tajikistan': 'TJ',
  'turkmenistan': 'TM',
}

// Major cities to country mapping
const CITY_MAPPINGS = {
  // USA cities
  'san francisco': 'US',
  'los angeles': 'US',
  'chicago': 'US',
  'houston': 'US',
  'phoenix': 'US',
  'philadelphia': 'US',
  'san antonio': 'US',
  'san diego': 'US',
  'dallas': 'US',
  'san jose': 'US',
  'austin': 'US',
  'jacksonville': 'US',
  'fort worth': 'US',
  'columbus': 'US',
  'charlotte': 'US',
  'detroit': 'US',
  'el paso': 'US',
  'memphis': 'US',
  'seattle': 'US',
  'denver': 'US',
  'boston': 'US',
  'nashville': 'US',
  'baltimore': 'US',
  'oklahoma city': 'US',
  'portland': 'US',
  'las vegas': 'US',
  'milwaukee': 'US',
  'albuquerque': 'US',
  'atlanta': 'US',
  'miami': 'US',
  'tampa': 'US',
  'orlando': 'US',
  'minneapolis': 'US',
  'cleveland': 'US',
  'pittsburgh': 'US',
  
  // International cities
  'london': 'GB',
  'manchester': 'GB',
  'birmingham': 'GB',
  'glasgow': 'GB',
  'edinburgh': 'GB',
  'liverpool': 'GB',
  'bristol': 'GB',
  'leeds': 'GB',
  'sheffield': 'GB',
  'cardiff': 'GB',
  'belfast': 'GB',
  
  'berlin': 'DE',
  'munich': 'DE',
  'hamburg': 'DE',
  'cologne': 'DE',
  'frankfurt': 'DE',
  'stuttgart': 'DE',
  'düsseldorf': 'DE',
  'dortmund': 'DE',
  'essen': 'DE',
  'leipzig': 'DE',
  
  'paris': 'FR',
  'marseille': 'FR',
  'lyon': 'FR',
  'toulouse': 'FR',
  'nice': 'FR',
  'nantes': 'FR',
  'strasbourg': 'FR',
  'montpellier': 'FR',
  'bordeaux': 'FR',
  'lille': 'FR',
  
  'madrid': 'ES',
  'barcelona': 'ES',
  'valencia spain': 'ES',
  'valencia es': 'ES',
  'seville': 'ES',
  'zaragoza': 'ES',
  'málaga': 'ES',
  'murcia': 'ES',
  'palma': 'ES',
  'las palmas': 'ES',
  'bilbao': 'ES',
  
  'rome': 'IT',
  'milan': 'IT',
  'naples': 'IT',
  'turin': 'IT',
  'palermo': 'IT',
  'genoa': 'IT',
  'bologna': 'IT',
  'florence': 'IT',
  'bari': 'IT',
  'catania': 'IT',
  
  'amsterdam': 'NL',
  'rotterdam': 'NL',
  'the hague': 'NL',
  'utrecht': 'NL',
  'eindhoven': 'NL',
  'tilburg': 'NL',
  'groningen': 'NL',
  
  'zurich': 'CH',
  'geneva': 'CH',
  'basel': 'CH',
  'lausanne': 'CH',
  'bern': 'CH',
  
  'vienna': 'AT',
  'graz': 'AT',
  'linz': 'AT',
  'salzburg': 'AT',
  'innsbruck': 'AT',
  
  'stockholm': 'SE',
  'gothenburg': 'SE',
  'malmö': 'SE',
  
  'oslo': 'NO',
  'bergen': 'NO',
  'trondheim': 'NO',
  
  'copenhagen': 'DK',
  'aarhus': 'DK',
  'odense': 'DK',
  
  'helsinki': 'FI',
  'espoo': 'FI',
  'tampere': 'FI',
  
  'dublin': 'IE',
  'cork': 'IE',
  'limerick': 'IE',
  
  'prague': 'CZ',
  'brno': 'CZ',
  'ostrava': 'CZ',
  
  'warsaw': 'PL',
  'krakow': 'PL',
  'lodz': 'PL',
  'wroclaw': 'PL',
  'poznan': 'PL',
  'gdansk': 'PL',
  
  'moscow': 'RU',
  'saint petersburg': 'RU',
  'novosibirsk': 'RU',
  'yekaterinburg': 'RU',
  'nizhny novgorod': 'RU',
  'kazan': 'RU',
  
  'beijing': 'CN',
  'shanghai': 'CN',
  'guangzhou': 'CN',
  'shenzhen': 'CN',
  'chongqing': 'CN',
  'tianjin': 'CN',
  'wuhan': 'CN',
  'dongguan': 'CN',
  'chengdu': 'CN',
  'nanjing': 'CN',
  
  'tokyo': 'JP',
  'osaka': 'JP',
  'nagoya': 'JP',
  'sapporo': 'JP',
  'fukuoka': 'JP',
  'kobe': 'JP',
  'kyoto': 'JP',
  'yokohama': 'JP',
  
  'seoul': 'KR',
  'busan': 'KR',
  'daegu': 'KR',
  'incheon': 'KR',
  'gwangju': 'KR',
  'daejeon': 'KR',
  
  'mumbai': 'IN',
  'delhi': 'IN',
  'bangalore': 'IN',
  'kolkata': 'IN',
  'chennai': 'IN',
  'hyderabad': 'IN',
  'ahmedabad': 'IN',
  'pune': 'IN',
  'surat': 'IN',
  'jaipur': 'IN',
  
  'sydney': 'AU',
  'melbourne': 'AU',
  'brisbane': 'AU',
  'perth': 'AU',
  'adelaide': 'AU',
  'gold coast': 'AU',
  'newcastle': 'AU',
  'canberra': 'AU',
  
  'auckland': 'NZ',
  'wellington': 'NZ',
  'christchurch': 'NZ',
  'hamilton': 'NZ',
  'tauranga': 'NZ',
  'dunedin': 'NZ',
  
  'singapore': 'SG',
  'kuala lumpur': 'MY',
  'bangkok': 'TH',
  'jakarta': 'ID',
  'manila': 'PH',
  'ho chi minh city': 'VN',
  'hanoi': 'VN',
  'taipei': 'TW',
  'hong kong': 'HK',
  
  'tel aviv': 'IL',
  'jerusalem': 'IL',
  'haifa': 'IL',
  
  'dubai': 'AE',
  'abu dhabi': 'AE',
  'sharjah': 'AE',
  
  'riyadh': 'SA',
  'jeddah': 'SA',
  'mecca': 'SA',
  
  'cairo': 'EG',
  'alexandria': 'EG',
  'giza': 'EG',
  
  'istanbul': 'TR',
  'ankara': 'TR',
  'izmir': 'TR',
  
  'cape town': 'ZA',
  'johannesburg': 'ZA',
  'durban': 'ZA',
  'pretoria': 'ZA',
  
  'são paulo': 'BR',
  'rio de janeiro': 'BR',
  'salvador': 'BR',
  'brasília': 'BR',
  'fortaleza': 'BR',
  'belo horizonte': 'BR',
  'manaus': 'BR',
  'curitiba': 'BR',
  'recife': 'BR',
  'porto alegre': 'BR',
  
  'buenos aires': 'AR',
  'córdoba': 'AR',
  'rosario': 'AR',
  'mendoza': 'AR',
  'la plata': 'AR',
  
  'santiago': 'CL',
  'valparaíso': 'CL',
  'concepción': 'CL',
  'la serena': 'CL',
  'antofagasta': 'CL',
  
  'bogotá': 'CO',
  'medellín': 'CO',
  'cali': 'CO',
  'barranquilla': 'CO',
  'cartagena': 'CO',
  
  'lima': 'PE',
  'arequipa': 'PE',
  'trujillo': 'PE',
  'chiclayo': 'PE',
  'huancayo': 'PE',
  
  'caracas': 'VE',
  'maracaibo': 'VE',
  'valencia venezuela': 'VE',
  'valencia ve': 'VE',
  'barquisimeto': 'VE',
  
  'mexico city': 'MX',
  'guadalajara': 'MX',
  'monterrey': 'MX',
  'puebla': 'MX',
  'tijuana': 'MX',
  'león': 'MX',
  'juárez': 'MX',
  'torreón': 'MX',
  'querétaro': 'MX',
  'san luis potosí': 'MX',
}

/**
 * Parse location string and return country code
 * @param location - Raw location string
 * @returns ISO 3166-1 alpha-2 country code or null if not found
 */
export function parseLocationToCountryCode(location: string): string | null {
  if (!location || typeof location !== 'string') {
    return null
  }

  // Normalize the location string
  const normalized = location.toLowerCase().trim()
  
  // Remove common prefixes/suffixes
  const cleaned = normalized
    .replace(/^(in|at|from)\s+/i, '')
    .replace(/\s+(area|region|state|country)$/i, '')
    .replace(/[,\-()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Direct country mapping
  if (COUNTRY_MAPPINGS[cleaned]) {
    return COUNTRY_MAPPINGS[cleaned]
  }

  // Check for city mapping
  if (CITY_MAPPINGS[cleaned]) {
    return CITY_MAPPINGS[cleaned]
  }

  // Check if location contains country/city names
  for (const [key, value] of Object.entries(COUNTRY_MAPPINGS)) {
    if (cleaned.includes(key)) {
      return value
    }
  }

  for (const [key, value] of Object.entries(CITY_MAPPINGS)) {
    if (cleaned.includes(key)) {
      return value
    }
  }

  // Handle specific conflicting cases first
  if (cleaned.includes('georgia')) {
    // If it mentions US states, cities, or USA, it's probably Georgia state
    if (cleaned.match(/\b(atlanta|savannah|columbus|augusta|macon|usa?|united states)\b/i)) {
      return 'US'
    }
    // If it mentions Georgia country context, it's the country
    if (cleaned.match(/\b(tbilisi|caucasus|eurasia|eastern europe)\b/i)) {
      return 'GE'
    }
    // Default to country if unclear
    return 'GE'
  }
  
  if (cleaned.includes('valencia')) {
    // If it mentions Spain context, it's Valencia Spain
    if (cleaned.match(/\b(spain|españa|spanish|es)\b/i)) {
      return 'ES'
    }
    // If it mentions Venezuela context, it's Valencia Venezuela
    if (cleaned.match(/\b(venezuela|venezuelan|ve)\b/i)) {
      return 'VE'
    }
    // Default to Spain (more common)
    return 'ES'
  }

  // Check for patterns like "City, Country"
  const parts = cleaned.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1]
    if (COUNTRY_MAPPINGS[lastPart]) {
      return COUNTRY_MAPPINGS[lastPart]
    }
    
    // Check if any part is a country
    for (const part of parts) {
      if (COUNTRY_MAPPINGS[part]) {
        return COUNTRY_MAPPINGS[part]
      }
    }
  }

  return null
}

/**
 * Get country name from country code
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Country name
 */
export function getCountryName(countryCode: string): string {
  const countryNames = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'PL': 'Poland',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'IS': 'Iceland',
    'PT': 'Portugal',
    'IE': 'Ireland',
    'CZ': 'Czech Republic',
    'SK': 'Slovakia',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'HR': 'Croatia',
    'SI': 'Slovenia',
    'EE': 'Estonia',
    'LV': 'Latvia',
    'LT': 'Lithuania',
    'MT': 'Malta',
    'CY': 'Cyprus',
    'LU': 'Luxembourg',
    'GR': 'Greece',
    'CN': 'China',
    'JP': 'Japan',
    'KR': 'South Korea',
    'IN': 'India',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'ID': 'Indonesia',
    'PH': 'Philippines',
    'VN': 'Vietnam',
    'TW': 'Taiwan',
    'HK': 'Hong Kong',
    'AU': 'Australia',
    'NZ': 'New Zealand',
    'IL': 'Israel',
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'TR': 'Turkey',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'VE': 'Venezuela',
    'UY': 'Uruguay',
    'EC': 'Ecuador',
    'BO': 'Bolivia',
    'PY': 'Paraguay',
    'MX': 'Mexico',
    'CR': 'Costa Rica',
    'PA': 'Panama',
    'GT': 'Guatemala',
    'HN': 'Honduras',
    'SV': 'El Salvador',
    'NI': 'Nicaragua',
    'BZ': 'Belize',
    'RU': 'Russia',
    'UA': 'Ukraine',
    'BY': 'Belarus',
    'MD': 'Moldova',
    'GE': 'Georgia',
    'AM': 'Armenia',
    'AZ': 'Azerbaijan',
    'KZ': 'Kazakhstan',
    'UZ': 'Uzbekistan',
    'KG': 'Kyrgyzstan',
    'TJ': 'Tajikistan',
    'TM': 'Turkmenistan',
  }
  
  return countryNames[countryCode] || countryCode
}