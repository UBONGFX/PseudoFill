export interface SimpleLoginAlias {
  id: number
  email: string
  creation_date: string
  creation_timestamp: number
  nb_forward: number
  nb_block: number
  nb_reply: number
  enabled: boolean
  note: string | null
  name: string | null
  mailboxes: Array<{
    id: number
    email: string
  }>
  latest_activity?: {
    timestamp: number
    action: string
    contact: {
      email: string
      name: string | null
    }
  }
}

export interface SimpleLoginAliasesResponse {
  aliases: SimpleLoginAlias[]
}

/**
 * Fetch all aliases from SimpleLogin API
 * @param apiKey SimpleLogin API key
 * @returns Array of aliases
 */
export async function fetchSimpleLoginAliases(apiKey: string): Promise<SimpleLoginAlias[]> {
  try {
    const response = await fetch('https://app.simplelogin.io/api/v2/aliases?page_id=0', {
      method: 'GET',
      headers: {
        'Authentication': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SimpleLogin API error:', response.status, errorText)
      throw new Error(`SimpleLogin API error: ${response.status} ${response.statusText}`)
    }

    const data: SimpleLoginAliasesResponse = await response.json()
    console.log('SimpleLogin API response:', data)
    return data.aliases || []
  } catch (error) {
    console.error('Fetch error:', error)
    throw error
  }
}

/**
 * Create a new alias on SimpleLogin
 * @param apiKey SimpleLogin API key
 * @param hostname Domain for the alias (optional)
 * @param note Note for the alias (optional)
 * @returns Created alias
 */
export async function createSimpleLoginAlias(
  apiKey: string,
  hostname?: string,
  note?: string
): Promise<SimpleLoginAlias> {
  const body: { hostname?: string; note?: string } = {}
  
  if (hostname) body.hostname = hostname
  if (note) body.note = note

  const response = await fetch('https://app.simplelogin.io/api/alias/random/new', {
    method: 'POST',
    headers: {
      'Authentication': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`SimpleLogin API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

/**
 * Get API key from Chrome storage
 */
export async function getStoredApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(['simpleLoginApiKey'])
  return result.simpleLoginApiKey || null
}

/**
 * Check if API key is valid by making a test request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await fetchSimpleLoginAliases(apiKey)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Update an alias note/name on SimpleLogin
 * @param apiKey SimpleLogin API key
 * @param aliasId Alias ID to update
 * @param note Note content (optional)
 * @param name Alias name (optional)
 * @returns Updated alias
 */
export async function updateSimpleLoginAlias(
  apiKey: string,
  aliasId: number,
  options: { note?: string; name?: string }
): Promise<SimpleLoginAlias> {
  const response = await fetch(`https://app.simplelogin.io/api/aliases/${aliasId}`, {
    method: 'PATCH',
    headers: {
      'Authentication': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('SimpleLogin API error:', response.status, errorText)
    throw new Error(`Failed to update alias: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data
}
