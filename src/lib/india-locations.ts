// Compact India states + cities catalogue used for location dropdowns
// in signup, admin, and the public Find-Barrister page. Coverage:
// every state / UT + the top metros / district HQs. Extend any entry
// with more cities — UI does prefix-match so order doesn't matter.

export const INDIA_LOCATIONS: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Anantapur', 'Kadapa'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Tezpur', 'Nagaon', 'Tinsukia'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia', 'Arrah', 'Begusarai'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Hisar', 'Karnal', 'Ambala', 'Rohtak', 'Sonipat', 'Yamunanagar'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Manali', 'Kullu', 'Hamirpur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Tumakuru', 'Shivamogga', 'Udupi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Malappuram', 'Palakkad', 'Alappuzha'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Rewa', 'Satna', 'Dewas', 'Ratlam'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Navi Mumbai', 'Solapur', 'Kolhapur', 'Sangli', 'Amravati', 'Akola', 'Nanded', 'Ahmednagar'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Pathankot'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Sikar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Geyzing'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Tiruppur', 'Thanjavur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Mahbubnagar'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Greater Noida', 'Mathura'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Nainital'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur'],
  // Union Territories
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa', 'Diu'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh', 'Vasant Kunj', 'Pitampura', 'Janakpuri'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'],
}

export const INDIA_STATES = Object.keys(INDIA_LOCATIONS).sort()

export function citiesFor(state: string): string[] {
  return INDIA_LOCATIONS[state] || []
}

// Given (lat, lng), pick the closest known city. Used by browser-geo
// detection. Uses a tiny curated lookup table — falls back to manual.
const CITY_COORDS: { state: string; city: string; lat: number; lng: number }[] = [
  { state: 'Delhi', city: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { state: 'Maharashtra', city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { state: 'Maharashtra', city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { state: 'Karnataka', city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { state: 'Tamil Nadu', city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { state: 'Telangana', city: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { state: 'West Bengal', city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { state: 'Gujarat', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { state: 'Rajasthan', city: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { state: 'Uttar Pradesh', city: 'Lucknow', lat: 26.8467, lng: 80.9462 },
  { state: 'Uttar Pradesh', city: 'Noida', lat: 28.5355, lng: 77.3910 },
  { state: 'Haryana', city: 'Gurugram', lat: 28.4595, lng: 77.0266 },
  { state: 'Kerala', city: 'Kochi', lat: 9.9312, lng: 76.2673 },
  { state: 'Madhya Pradesh', city: 'Bhopal', lat: 23.2599, lng: 77.4126 },
  { state: 'Madhya Pradesh', city: 'Indore', lat: 22.7196, lng: 75.8577 },
  { state: 'Punjab', city: 'Ludhiana', lat: 30.9010, lng: 75.8573 },
  { state: 'Bihar', city: 'Patna', lat: 25.5941, lng: 85.1376 },
  { state: 'Odisha', city: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
  { state: 'Assam', city: 'Guwahati', lat: 26.1445, lng: 91.7362 },
  { state: 'Chandigarh', city: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
]

export function nearestCity(lat: number, lng: number): { state: string; city: string; km: number } | null {
  let best: { state: string; city: string; km: number } | null = null
  for (const c of CITY_COORDS) {
    const dLat = (c.lat - lat) * Math.PI / 180
    const dLng = (c.lng - lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    const km = 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (!best || km < best.km) best = { state: c.state, city: c.city, km }
  }
  return best
}
