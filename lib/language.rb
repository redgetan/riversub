module Language
  CODES = {
    "en" =>    "English",
    "af" =>    "Afrikaans",
    "sq" =>    "Albanian",
    "ar" =>    "Arabic",
    "hy" =>    "Armenian",
    "az" =>    "Azerbaijani",
    "eu" =>    "Basque",
    "be" =>    "Belarusian",
    "bn" =>    "Bengali",
    "bs" =>    "Bosnian",
    "bg" =>    "Bulgarian",
    "ca" =>    "Catalan",
    "ceb" =>   "Cebuano",
    "zh-cn" => "Chinese (China)",
    "zh-tw" => "Chinese (Taiwan)",
    "zh-hk" => "Chinese (Hong Kong)",
    "hr" =>    "Croatian",
    "cs" =>    "Czech",
    "da" =>    "Danish",
    "nl" =>    "Dutch",
    "en" =>    "English",
    "eo" =>    "Esperanto",
    "et" =>    "Estonian",
    "fil" =>   "Filipino",
    "fi" =>    "Finnish",
    "fr" =>    "French",
    "gl" =>    "Galician",
    "ka" =>    "Georgian",
    "de" =>    "German",
    "el" =>    "Greek",
    "gu" =>    "Gujarati",
    "ht" =>    "Haitian",
    "hau" =>   "Hausa",
    "he" =>    "Hebrew",
    "hi" =>    "Hindi",
    "hu" =>    "Hungarian",
    "is" =>    "Icelandic",
    "ibo" =>   "Igbo",
    "id" =>    "Indonesian",
    "ga" =>    "Irish",
    "it" =>    "Italian",
    "ja" =>    "Japanese",
    "jv" =>    "Javanese",
    "kn" =>    "Kannada",
    "km" =>    "Khmer",
    "ko" =>    "Korean",
    "lo" =>    "Lao",
    "la" =>    "Latin",
    "lv" =>    "Latvian",
    "lt" =>    "Lithuanian",
    "mk" =>    "Macedonian",
    "ms" =>    "Malay",
    "mt" =>    "Maltese",
    "mi" =>    "Maori",
    "mr" =>    "Marathi",
    "mn" =>    "Mongolian",
    "ne" =>    "Nepali",
    "nn" =>    "Norwegian",
    "fa" =>    "Persian",
    "pl" =>    "Polish",
    "pt" =>    "Portuguese",
    "pnb" =>   "Punjabi",
    "ro" =>    "Romanian",
    "ru" =>    "Russian",
    "sr" =>    "Serbian",
    "sk" =>    "Slovak",
    "sl" =>    "Slovenian",
    "som" =>   "Somali",
    "es" =>    "Spanish",
    "swa" =>   "Swahili",
    "sv" =>    "Swedish",
    "ta" =>    "Tamil",
    "te" =>    "Telugu",
    "th" =>    "Thai",
    "tr" =>    "Turkish",
    "uk" =>    "Ukrainian",
    "ur" =>    "Urdu",
    "vi" =>    "Vietnamese",
    "cy" =>    "Welsh",
    "yi" =>    "Yiddish",
    "yor" =>   "Yoruba",
    "zul" =>   "Zulu"
  }

  COUNTRIES_BY_CONTINENT = {
    "Europe" => {
      "at" => "Austria",
      "be" => "Belgium",
      "cz" => "Czech republic",
      "dk" => "Denmark",
      "fi" => "Finland",
      "fr" => "France",
      "de" => "Germany",
      "gr" => "Greece",
      "hu" => "Hungary",
      "ie" => "Ireland",
      "it" => "Italy",
      "ma" => "Morocco",
      "nl" => "Netherlands",
      "no" => "Norway",
      "pl" => "Poland",
      "ro" => "Romania",
      "ru" => "Russia",
      "es" => "Spain",
      "se" => "Sweden",
      "ch" => "Switzerland",
      "tr" => "Turkey",
      "gb" => "United kingdom"
    },
    "Asia and Middle East" => {
      "bd" => "Bangladesh",
      "cn" => "China",
      "hk" => "Hong kong",
      "in" => "India",
      "id" => "Indonesia",
      "ir" => "Iran",
      "il" => "Israel",
      "jp" => "Japan",
      "jo" => "Jordan",
      "kr" => "Korea",
      "lb" => "Lebanon",
      "my" => "Malaysia",
      "pk" => "Pakistan",
      "ph" => "Philippines",
      "sa" => "Saudi Arabia",
      "sg" => "Singapore",
      "tw" => "Taiwan",
      "th" => "Thailand",
      "vn" => "Vietnam"
    },
    "Latin America" => {
      "ar" => "Argentina",
      "br" => "Brazil",
      "cl" => "Chile",
      "co" => "Columbia",
      "mx" => "Mexico",
      "pe" => "Peru",
      "pr" => "Puerto Rico"    
    },
    "Africa" => {
      "za" => "South africa", 
      "ng" => "Nigeria", 
      "ug" => "Uganda", 
      "ke" => "Kenya"
    },
    "Other" => {
      "au"=>"Australia", 
      "ca"=>"Canada", 
      "nz"=>"New zealand",
      "us"=>"United states" 
    }
  }

  def self.country_code_to_country_name
    COUNTRIES_BY_CONTINENT.values.inject(:merge)
  end

  def self.language_code_to_country_name(language_code)
    country_code = language_code_to_country_code_map[language_code]
    country_code_to_country_name[country_code]
  end

  def self.language_code_to_country_code_map
    {
      "ja" => "jp",    # Japan
      "zh-cn" => "cn", # China
      "zh-tw" => "tw", # Taiwan
      "zh-hk" => "hk", # Hongkong
      "cs" => "cz",    # Czech republic
      "da" => "dk",    # Denmark
      "fi" => "fi",    # Finland
      "fr" => "fr",    # France
      "de" => "de",    # Germany
      "it" => "it",    # Italy
      "ko" => "kr",    # Korea
      "nn" => "no",    # Norway
      "ru" => "ru",    # Russia
      "pt" => "br",    # Brazil
      "es" => "es",    # Spain
      "sv" => "se",    # Sweden
      "th" => "th",    # Thailand
      "vi" => "vn",    # Vietnam
      "af" => "za",    # South Africa
      "hi" => "in",    # India
      "fa" => "ir",    # Iran
      "el" => "gr",    # Greek
      "fil" => "ph",   # Philippines
      "tr" => "tr",    # Turkey
      "ur" => "pk",    # Pakistan
      "id" => "id",    # Indonesia
      "he" => "il",    # Israel
      "nl" => "nl",    # Netherlands
      "en" => "us",    # United States
    }      
  end
end
