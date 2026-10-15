export interface Dua {
  id: string;
  categories: string[];
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  repeat?: string;
}

export const DUA_CATEGORIES = [
  "Morning",
  "Evening",
  "After Prayer",
  "Daily Life",
] as const;

// Authentic daily adhkar — short, well-established texts with generic
// source references (no hadith numbering, which varies by edition).
export const DUAS: Dua[] = [
  {
    id: "morning-sovereignty",
    categories: ["Morning"],
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallah wahdahu la sharika lah",
    translation: "We have reached the morning, and sovereignty belongs to Allah. Praise be to Allah. None is worthy of worship but Allah alone, without partner.",
    reference: "Sahih Muslim",
  },
  {
    id: "morning-bika",
    categories: ["Morning"],
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur",
    translation: "O Allah, by You we enter the morning and by You we enter the evening. By You we live and by You we die, and to You is the resurrection.",
    reference: "Jami' at-Tirmidhi",
  },
  {
    id: "morning-knowledge",
    categories: ["Morning"],
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalal",
    translation: "O Allah, I ask You for beneficial knowledge, wholesome provision, and accepted deeds.",
    reference: "Sunan Ibn Majah",
  },
  {
    id: "contentment",
    categories: ["Morning", "Evening"],
    arabic: "رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا",
    transliteration: "Raditu billahi rabban, wa bil-islami dinan, wa bi Muhammadin nabiyya",
    translation: "I am pleased with Allah as my Lord, Islam as my religion, and Muhammad as my Prophet.",
    reference: "Sunan Abi Dawud",
    repeat: "3x",
  },
  {
    id: "evening-bika",
    categories: ["Evening"],
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
    transliteration: "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir",
    translation: "O Allah, by You we enter the evening and by You we enter the morning. By You we live and by You we die, and to You is the final return.",
    reference: "Jami' at-Tirmidhi",
  },
  {
    id: "sufficient",
    categories: ["Morning", "Evening"],
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Hasbiyallahu la ilaha illa huwa, 'alayhi tawakkaltu, wa huwa rabbul-'arshil-'azim",
    translation: "Allah is sufficient for me. None is worthy of worship but Him. In Him I put my trust, and He is the Lord of the Mighty Throne.",
    reference: "Sunan Abi Dawud",
    repeat: "7x",
  },
  {
    id: "after-salah-salam",
    categories: ["After Prayer"],
    arabic: "أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    transliteration: "Astaghfirullah (3x). Allahumma antas-salam, wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
    translation: "I seek Allah's forgiveness (3x). O Allah, You are Peace and from You is peace. Blessed are You, O Possessor of Majesty and Honor.",
    reference: "Sahih Muslim",
  },
  {
    id: "after-salah-help",
    categories: ["After Prayer"],
    arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    transliteration: "Allahumma a'inni 'ala dhikrika, wa shukrika, wa husni 'ibadatik",
    translation: "O Allah, help me to remember You, to thank You, and to worship You in the best manner.",
    reference: "Sunan Abi Dawud",
  },
  {
    id: "before-eating",
    categories: ["Daily Life"],
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillah",
    translation: "In the name of Allah. (If forgotten at the start, say: Bismillahi awwalahu wa akhirahu.)",
    reference: "Jami' at-Tirmidhi",
  },
  {
    id: "after-eating",
    categories: ["Daily Life"],
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
    transliteration: "Alhamdu lillahilladhi at'amana, wa saqana, wa ja'alana muslimin",
    translation: "Praise be to Allah who fed us, gave us drink, and made us Muslims.",
    reference: "Sunan Abi Dawud",
  },
  {
    id: "leaving-home",
    categories: ["Daily Life"],
    arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "Bismillahi tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah",
    translation: "In the name of Allah, I place my trust in Allah; there is no power nor might except with Allah.",
    reference: "Sunan Abi Dawud",
  },
  {
    id: "sleep",
    categories: ["Daily Life"],
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allahumma amutu wa ahya",
    translation: "In Your name, O Allah, I die and I live.",
    reference: "Sahih al-Bukhari",
  },
  {
    id: "waking",
    categories: ["Daily Life"],
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    transliteration: "Alhamdu lillahilladhi ahyana ba'da ma amatana, wa ilayhin-nushur",
    translation: "Praise be to Allah who gave us life after death, and to Him is the resurrection.",
    reference: "Sahih al-Bukhari",
  },
  {
    id: "entering-masjid",
    categories: ["Daily Life"],
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allahummaftah li abwaba rahmatik",
    translation: "O Allah, open for me the doors of Your mercy.",
    reference: "Sahih Muslim",
  },
  {
    id: "leaving-masjid",
    categories: ["Daily Life"],
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "Allahumma inni as'aluka min fadlik",
    translation: "O Allah, I ask You of Your bounty.",
    reference: "Sahih Muslim",
  },
];
