export interface Persona {
  email: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  phone: string
  dateOfBirth: string
  address: {
    street: string
    city: string
    state: string
    region: string
    zipCode: string
    country: string
    full: string
  }
}

const firstNames = [
  'Alex',
  'Jordan',
  'Morgan',
  'Casey',
  'Riley',
  'Taylor',
  'Avery',
  'Quinn',
  'Sam',
  'Jamie',
  'Charlie',
  'Dakota',
  'Parker',
  'Reese',
  'Skylar',
  'Blake',
  'Cameron',
  'Drew',
  'Finley',
  'Harper',
  'Hayden',
  'Hunter',
  'Jesse',
  'Kai',
  'Logan',
  'Mason',
  'Nova',
  'Oakley',
  'Payton',
  'Phoenix',
  'River',
  'Rowan',
  'Sage',
  'Spencer',
  'Sydney',
  'Tatum',
  'Winter',
  'Wren',
  'Ellis',
  'Emerson',
]

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Thompson',
  'White',
  'Harris',
  'Clark',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Hall',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
]

const cities = [
  'Springfield',
  'Riverside',
  'Fairview',
  'Oak Park',
  'Maple Grove',
  'Georgetown',
  'Arlington',
  'Madison',
  'Salem',
  'Franklin',
  'Clinton',
  'Bristol',
  'Dover',
  'Manchester',
  'Newport',
  'Auburn',
  'Clayton',
  'Milton',
  'Oxford',
  'Hudson',
]

const states = [
  { name: 'California', code: 'CA' },
  { name: 'Texas', code: 'TX' },
  { name: 'Florida', code: 'FL' },
  { name: 'New York', code: 'NY' },
  { name: 'Pennsylvania', code: 'PA' },
  { name: 'Illinois', code: 'IL' },
  { name: 'Ohio', code: 'OH' },
  { name: 'Georgia', code: 'GA' },
  { name: 'North Carolina', code: 'NC' },
  { name: 'Michigan', code: 'MI' },
]

const streetNames = [
  'Main',
  'Oak',
  'Maple',
  'Cedar',
  'Elm',
  'Park',
  'Pine',
  'Washington',
  'Lake',
  'Hill',
  'Forest',
  'River',
  'Sunset',
  'Spring',
  'Church',
  'Walnut',
]

const streetTypes = ['St', 'Ave', 'Rd', 'Blvd', 'Dr', 'Ln', 'Way', 'Ct']

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generatePhone(): string {
  // Generate US format: (XXX) XXX-XXXX
  const areaCode = getRandomNumber(200, 999)
  const prefix = getRandomNumber(200, 999)
  const lineNumber = getRandomNumber(1000, 9999)
  return `(${areaCode}) ${prefix}-${lineNumber}`
}

function generateDateOfBirth(): string {
  // Generate age between 18 and 65
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - getRandomNumber(18, 65)
  const month = String(getRandomNumber(1, 12)).padStart(2, '0')
  const day = String(getRandomNumber(1, 28)).padStart(2, '0')
  return `${birthYear}-${month}-${day}`
}

function generateAddress() {
  const streetNumber = getRandomNumber(100, 9999)
  const streetName = getRandomItem(streetNames)
  const streetType = getRandomItem(streetTypes)
  const street = `${streetNumber} ${streetName} ${streetType}`

  const city = getRandomItem(cities)
  const state = getRandomItem(states)
  const zipCode = String(getRandomNumber(10000, 99999))
  const country = 'United States'

  return {
    street,
    city,
    state: state.code,
    region: state.name,
    zipCode,
    country,
    full: `${street}, ${city}, ${state.code} ${zipCode}, ${country}`,
  }
}

export function generatePersona(domain: string): Persona {
  const firstName = getRandomItem(firstNames)
  const lastName = getRandomItem(lastNames)
  const randomId = Math.random().toString(36).substring(2, 8)

  // Create site-specific but readable identifiers
  const siteName = domain.replace(/\.(com|net|org|io|co)$/i, '').replace(/\./g, '')

  return {
    email: `${siteName}_${firstName.toLowerCase()}${randomId}@pseudofill.local`,
    username: `${siteName}_${firstName.toLowerCase()}_${randomId}`,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    phone: generatePhone(),
    dateOfBirth: generateDateOfBirth(),
    address: generateAddress(),
  }
}
