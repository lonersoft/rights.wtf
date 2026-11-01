/**
 * Canonical jurisdiction list.
 *
 * Countries: ISO 3166-1 alpha-2.
 * Subdivisions: only where law genuinely varies (US states, UK nations,
 * German Länder, Canadian provinces, Australian states).
 *
 * This list exists so every jurisdiction can have a page even before anyone
 * has written data for it. Authored data lives in src/content/jurisdictions/.
 */

export type Canonical = {
	code: string;
	name: string;
	parent: string | null;
};

const COUNTRY_PAIRS: [string, string][] = [
	["af", "Afghanistan"], ["al", "Albania"], ["dz", "Algeria"], ["ad", "Andorra"],
	["ao", "Angola"], ["ag", "Antigua and Barbuda"], ["ar", "Argentina"], ["am", "Armenia"],
	["au", "Australia"], ["at", "Austria"], ["az", "Azerbaijan"], ["bs", "Bahamas"],
	["bh", "Bahrain"], ["bd", "Bangladesh"], ["bb", "Barbados"], ["by", "Belarus"],
	["be", "Belgium"], ["bz", "Belize"], ["bj", "Benin"], ["bt", "Bhutan"],
	["bo", "Bolivia"], ["ba", "Bosnia and Herzegovina"], ["bw", "Botswana"], ["br", "Brazil"],
	["bn", "Brunei"], ["bg", "Bulgaria"], ["bf", "Burkina Faso"], ["bi", "Burundi"],
	["cv", "Cabo Verde"], ["kh", "Cambodia"], ["cm", "Cameroon"], ["ca", "Canada"],
	["cf", "Central African Republic"], ["td", "Chad"], ["cl", "Chile"], ["cn", "China"],
	["co", "Colombia"], ["km", "Comoros"], ["cg", "Congo"], ["cd", "DR Congo"],
	["cr", "Costa Rica"], ["ci", "Côte d'Ivoire"], ["hr", "Croatia"], ["cu", "Cuba"],
	["cy", "Cyprus"], ["cz", "Czechia"], ["dk", "Denmark"], ["dj", "Djibouti"],
	["dm", "Dominica"], ["do", "Dominican Republic"], ["ec", "Ecuador"], ["eg", "Egypt"],
	["sv", "El Salvador"], ["gq", "Equatorial Guinea"], ["er", "Eritrea"], ["ee", "Estonia"],
	["sz", "Eswatini"], ["et", "Ethiopia"], ["fj", "Fiji"], ["fi", "Finland"],
	["fr", "France"], ["ga", "Gabon"], ["gm", "Gambia"], ["ge", "Georgia"],
	["de", "Germany"], ["gh", "Ghana"], ["gr", "Greece"], ["gd", "Grenada"],
	["gt", "Guatemala"], ["gn", "Guinea"], ["gw", "Guinea-Bissau"], ["gy", "Guyana"],
	["ht", "Haiti"], ["hn", "Honduras"], ["hu", "Hungary"], ["is", "Iceland"],
	["in", "India"], ["id", "Indonesia"], ["ir", "Iran"], ["iq", "Iraq"],
	["ie", "Ireland"], ["il", "Israel"], ["it", "Italy"], ["jm", "Jamaica"],
	["jp", "Japan"], ["jo", "Jordan"], ["kz", "Kazakhstan"], ["ke", "Kenya"],
	["ki", "Kiribati"], ["kw", "Kuwait"], ["kg", "Kyrgyzstan"], ["la", "Laos"],
	["lv", "Latvia"], ["lb", "Lebanon"], ["ls", "Lesotho"], ["lr", "Liberia"],
	["ly", "Libya"], ["li", "Liechtenstein"], ["lt", "Lithuania"], ["lu", "Luxembourg"],
	["mg", "Madagascar"], ["mw", "Malawi"], ["my", "Malaysia"], ["mv", "Maldives"],
	["ml", "Mali"], ["mt", "Malta"], ["mh", "Marshall Islands"], ["mr", "Mauritania"],
	["mu", "Mauritius"], ["mx", "Mexico"], ["fm", "Micronesia"], ["md", "Moldova"],
	["mc", "Monaco"], ["mn", "Mongolia"], ["me", "Montenegro"], ["ma", "Morocco"],
	["mz", "Mozambique"], ["mm", "Myanmar"], ["na", "Namibia"], ["nr", "Nauru"],
	["np", "Nepal"], ["nl", "Netherlands"], ["nz", "New Zealand"], ["ni", "Nicaragua"],
	["ne", "Niger"], ["ng", "Nigeria"], ["kp", "North Korea"], ["mk", "North Macedonia"],
	["no", "Norway"], ["om", "Oman"], ["pk", "Pakistan"], ["pw", "Palau"],
	["ps", "Palestine"], ["pa", "Panama"], ["pg", "Papua New Guinea"], ["py", "Paraguay"],
	["pe", "Peru"], ["ph", "Philippines"], ["pl", "Poland"], ["pt", "Portugal"],
	["qa", "Qatar"], ["ro", "Romania"], ["ru", "Russia"], ["rw", "Rwanda"],
	["kn", "Saint Kitts and Nevis"], ["lc", "Saint Lucia"], ["vc", "Saint Vincent and the Grenadines"],
	["ws", "Samoa"], ["sm", "San Marino"], ["st", "São Tomé and Príncipe"], ["sa", "Saudi Arabia"],
	["sn", "Senegal"], ["rs", "Serbia"], ["sc", "Seychelles"], ["sl", "Sierra Leone"],
	["sg", "Singapore"], ["sk", "Slovakia"], ["si", "Slovenia"], ["sb", "Solomon Islands"],
	["so", "Somalia"], ["za", "South Africa"], ["kr", "South Korea"], ["ss", "South Sudan"],
	["es", "Spain"], ["lk", "Sri Lanka"], ["sd", "Sudan"], ["sr", "Suriname"],
	["se", "Sweden"], ["ch", "Switzerland"], ["sy", "Syria"], ["tw", "Taiwan"],
	["tj", "Tajikistan"], ["tz", "Tanzania"], ["th", "Thailand"], ["tl", "Timor-Leste"],
	["tg", "Togo"], ["to", "Tonga"], ["tt", "Trinidad and Tobago"], ["tn", "Tunisia"],
	["tr", "Türkiye"], ["tm", "Turkmenistan"], ["tv", "Tuvalu"], ["ug", "Uganda"],
	["ua", "Ukraine"], ["ae", "United Arab Emirates"], ["gb", "United Kingdom"],
	["us", "United States"], ["uy", "Uruguay"], ["uz", "Uzbekistan"], ["vu", "Vanuatu"],
	["va", "Vatican City"], ["ve", "Venezuela"], ["vn", "Vietnam"], ["ye", "Yemen"],
	["zm", "Zambia"], ["zw", "Zimbabwe"],
];

const US_STATES: [string, string][] = [
	["al", "Alabama"], ["ak", "Alaska"], ["az", "Arizona"], ["ar", "Arkansas"],
	["ca", "California"], ["co", "Colorado"], ["ct", "Connecticut"], ["de", "Delaware"],
	["fl", "Florida"], ["ga", "Georgia"], ["hi", "Hawaii"], ["id", "Idaho"],
	["il", "Illinois"], ["in", "Indiana"], ["ia", "Iowa"], ["ks", "Kansas"],
	["ky", "Kentucky"], ["la", "Louisiana"], ["me", "Maine"], ["md", "Maryland"],
	["ma", "Massachusetts"], ["mi", "Michigan"], ["mn", "Minnesota"], ["ms", "Mississippi"],
	["mo", "Missouri"], ["mt", "Montana"], ["ne", "Nebraska"], ["nv", "Nevada"],
	["nh", "New Hampshire"], ["nj", "New Jersey"], ["nm", "New Mexico"], ["ny", "New York"],
	["nc", "North Carolina"], ["nd", "North Dakota"], ["oh", "Ohio"], ["ok", "Oklahoma"],
	["or", "Oregon"], ["pa", "Pennsylvania"], ["ri", "Rhode Island"], ["sc", "South Carolina"],
	["sd", "South Dakota"], ["tn", "Tennessee"], ["tx", "Texas"], ["ut", "Utah"],
	["vt", "Vermont"], ["va", "Virginia"], ["wa", "Washington"], ["wv", "West Virginia"],
	["wi", "Wisconsin"], ["wy", "Wyoming"], ["dc", "District of Columbia"],
];

const OTHER_SUBDIVISIONS: [string, string, string][] = [
	// [code, name, parent]
	["gb-eng", "England", "gb"], ["gb-sct", "Scotland", "gb"],
	["gb-wls", "Wales", "gb"], ["gb-nir", "Northern Ireland", "gb"],
	["de-bw", "Baden-Württemberg", "de"], ["de-by", "Bavaria", "de"],
	["de-be", "Berlin", "de"], ["de-bb", "Brandenburg", "de"],
	["de-hb", "Bremen", "de"], ["de-hh", "Hamburg", "de"],
	["de-he", "Hesse", "de"], ["de-mv", "Mecklenburg-Vorpommern", "de"],
	["de-ni", "Lower Saxony", "de"], ["de-nw", "North Rhine-Westphalia", "de"],
	["de-rp", "Rhineland-Palatinate", "de"], ["de-sl", "Saarland", "de"],
	["de-sn", "Saxony", "de"], ["de-st", "Saxony-Anhalt", "de"],
	["de-sh", "Schleswig-Holstein", "de"], ["de-th", "Thuringia", "de"],
	["ca-on", "Ontario", "ca"], ["ca-qc", "Quebec", "ca"], ["ca-bc", "British Columbia", "ca"],
	["ca-ab", "Alberta", "ca"], ["ca-mb", "Manitoba", "ca"], ["ca-sk", "Saskatchewan", "ca"],
	["ca-ns", "Nova Scotia", "ca"], ["ca-nb", "New Brunswick", "ca"],
	["ca-nl", "Newfoundland and Labrador", "ca"], ["ca-pe", "Prince Edward Island", "ca"],
	["au-nsw", "New South Wales", "au"], ["au-vic", "Victoria", "au"],
	["au-qld", "Queensland", "au"], ["au-wa", "Western Australia", "au"],
	["au-sa", "South Australia", "au"], ["au-tas", "Tasmania", "au"],
	["au-act", "Australian Capital Territory", "au"], ["au-nt", "Northern Territory", "au"],
];

export const CANONICAL: Canonical[] = [
	...COUNTRY_PAIRS.map(([code, name]) => ({ code, name, parent: null })),
	...US_STATES.map(([code, name]) => ({ code: `us-${code}`, name: `${name} (US)`, parent: "us" })),
	...OTHER_SUBDIVISIONS.map(([code, name, parent]) => ({ code, name, parent })),
];

export const CANONICAL_BY_CODE = new Map(CANONICAL.map((j) => [j.code, j]));
