import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Trash2,
  CheckCircle2,
  Mail,
  RefreshCw,
  AlertCircle,
  X,
  Filter,
  Info,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import {
  fetchSimpleLoginAliases,
  getStoredApiKey,
  updateSimpleLoginAlias,
  type SimpleLoginAlias,
} from '@/lib/simplelogin-api'
import { generatePersona, type Persona } from '@/lib/persona-generator'

interface SavedPersona extends Persona {
  id: string
  domain: string
  createdAt: string
  simpleLoginAliasId?: number
  simpleLoginEmail?: string
  simpleLoginEnabled?: boolean
  simpleLoginDeleted?: boolean
}

interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { theme, setTheme } = useTheme()
  const [apiKey, setApiKey] = useState('')
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [aliases, setAliases] = useState<SimpleLoginAlias[]>([])
  const [savedPersonas, setSavedPersonas] = useState<SavedPersona[]>([])
  const [isLoadingAliases, setIsLoadingAliases] = useState(false)
  const [deletedAliasIds, setDeletedAliasIds] = useState<number[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [aliasFilters, setAliasFilters] = useState<string[]>(['active', 'disabled', 'linked', 'unlinked', 'wontSync'])
  const [syncPersonasToSimpleLogin, setSyncPersonasToSimpleLogin] = useState(false)
  const [isSyncingPersonas, setIsSyncingPersonas] = useState(false)
  const [aliasSearchQuery, setAliasSearchQuery] = useState('')

  useEffect(() => {
    // Load saved API key
    chrome.storage.local.get(['simpleLoginApiKey'], (result) => {
      if (result.simpleLoginApiKey) {
        setApiKey(result.simpleLoginApiKey)
        setHasExistingKey(true)
      }
    })

    // Load deleted alias IDs
    chrome.storage.local.get(['deletedSimpleLoginAliasIds'], (result) => {
      setDeletedAliasIds(result.deletedSimpleLoginAliasIds || [])
    })

    // Load sync personas setting
    chrome.storage.local.get(['syncPersonasToSimpleLogin'], (result) => {
      setSyncPersonasToSimpleLogin(result.syncPersonasToSimpleLogin || false)
    })

    // Load saved personas
    loadPersonas()
  }, [])

  useEffect(() => {
    // Load aliases when API key is available
    if (hasExistingKey) {
      loadAliases()
    }
  }, [hasExistingKey])

  const loadPersonas = async () => {
    const result = await chrome.storage.local.get(['personas'])
    const personas = result.personas || []
    setSavedPersonas(personas)
  }

  const loadAliases = async () => {
    setIsLoadingAliases(true)
    try {
      const key = await getStoredApiKey()
      if (key) {
        const fetchedAliases = await fetchSimpleLoginAliases(key)
        setAliases(fetchedAliases)
      }
    } catch (error) {
      console.error('Error loading aliases:', error)
    } finally {
      setIsLoadingAliases(false)
    }
  }

  const saveApiKey = async () => {
    if (!apiKey.trim()) return
    await chrome.storage.local.set({ simpleLoginApiKey: apiKey })
    setHasExistingKey(true)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const deleteApiKey = async () => {
    await chrome.storage.local.remove(['simpleLoginApiKey'])
    setApiKey('')
    setHasExistingKey(false)
    setIsDeleted(true)
    setTimeout(() => setIsDeleted(false), 2000)
  }
  const removeFromDeletedList = async (aliasId: number) => {
    const updatedDeletedIds = deletedAliasIds.filter((id) => id !== aliasId)
    setDeletedAliasIds(updatedDeletedIds)
    await chrome.storage.local.set({ deletedSimpleLoginAliasIds: updatedDeletedIds })
  }

  const toggleAliasFilter = (filter: string) => {
    setAliasFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    )
  }

  const toggleSyncPersonas = async (checked: boolean) => {
    setSyncPersonasToSimpleLogin(checked)
    await chrome.storage.local.set({ syncPersonasToSimpleLogin: checked })
    
    // If enabling sync, immediately sync all existing personas with linked aliases
    if (checked) {
      await syncAllPersonasToSimpleLogin()
    }
  }

  const syncAllPersonasToSimpleLogin = async () => {
    setIsSyncingPersonas(true)
    try {
      const apiKey = await getStoredApiKey()
      if (!apiKey) {
        console.error('No API key found')
        return
      }

      // Get personas that have SimpleLogin aliases linked
      const personasWithAliases = savedPersonas.filter((p) => p.simpleLoginAliasId)

      let updatedCount = 0
      for (const persona of personasWithAliases) {
        try {
          // Create JSON representation of persona (excluding sensitive/redundant fields)
          const personaData = {
            fullName: persona.fullName,
            firstName: persona.firstName,
            lastName: persona.lastName,
            username: persona.username,
            phone: persona.phone,
            dateOfBirth: persona.dateOfBirth,
            address: persona.address,
            city: persona.city,
            state: persona.state,
            zipCode: persona.zipCode,
            country: persona.country,
            domain: persona.domain,
            createdAt: persona.createdAt,
          }

          // Update the alias note with persona data
          await updateSimpleLoginAlias(apiKey, persona.simpleLoginAliasId!, {
            note: JSON.stringify(personaData, null, 2),
          })
          updatedCount++
        } catch (error) {
          console.error(`Failed to update alias ${persona.simpleLoginAliasId}:`, error)
        }
      }

      setSyncMessage({
        type: 'success',
        text: `Successfully synced ${updatedCount} persona${updatedCount !== 1 ? 's' : ''} to SimpleLogin aliases.`,
      })
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (error) {
      console.error('Error syncing personas:', error)
      setSyncMessage({
        type: 'error',
        text: 'Failed to sync personas to SimpleLogin.',
      })
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setIsSyncingPersonas(false)
    }
  }

  const getFilteredAliases = () => {
    return aliases.filter((alias) => {
      // Search filter
      if (aliasSearchQuery) {
        const query = aliasSearchQuery.toLowerCase()
        const emailMatch = alias.email.toLowerCase().includes(query)
        const noteMatch = alias.note?.toLowerCase().includes(query)
        const linkedPersona = savedPersonas.find((p) => p.simpleLoginAliasId === alias.id)
        const personaMatch = linkedPersona?.fullName.toLowerCase().includes(query)
        
        if (!emailMatch && !noteMatch && !personaMatch) {
          return false
        }
      }

      // Status filters
      const isActive = alias.enabled
      const isDisabled = !alias.enabled
      const statusMatch =
        (aliasFilters.includes('active') && isActive) ||
        (aliasFilters.includes('disabled') && isDisabled)

      // Linked status filters
      const hasLinkedPersona = savedPersonas.some((p) => p.simpleLoginAliasId === alias.id)
      const linkedMatch =
        (aliasFilters.includes('linked') && hasLinkedPersona) ||
        (aliasFilters.includes('unlinked') && !hasLinkedPersona)

      // Won't sync filter
      const isMarkedWontSync = deletedAliasIds.includes(alias.id)
      const wontSyncMatch = aliasFilters.includes('wontSync') && isMarkedWontSync

      // If no filters selected, show all
      if (aliasFilters.length === 0) return true

      // Show if matches any selected filter
      return statusMatch || linkedMatch || wontSyncMatch
    })
  }
  const syncSimpleLoginAliases = async () => {
    setIsSyncing(true)
    setSyncMessage(null)

    try {
      const apiKeyFromStorage = await getStoredApiKey()

      if (!apiKeyFromStorage) {
        setSyncMessage({
          type: 'error',
          text: 'No API key found. Please add your SimpleLogin API key first.',
        })
        setIsSyncing(false)
        return
      }

      const fetchedAliases = await fetchSimpleLoginAliases(apiKeyFromStorage)

      if (fetchedAliases.length === 0) {
        setSyncMessage({
          type: 'error',
          text: 'No aliases found in your SimpleLogin account.',
        })
        setIsSyncing(false)
        return
      }

      let newPersonasCount = 0
      let updatedPersonasCount = 0
      const updatedPersonas = [...savedPersonas]
      const fetchedAliasIds = fetchedAliases.map((a) => a.id)

      // First, mark any personas whose aliases no longer exist in SimpleLogin
      updatedPersonas.forEach((persona, index) => {
        if (persona.simpleLoginAliasId && !fetchedAliasIds.includes(persona.simpleLoginAliasId)) {
          if (!persona.simpleLoginDeleted) {
            updatedPersonas[index] = {
              ...persona,
              simpleLoginDeleted: true,
            }
            updatedPersonasCount++
          }
        } else if (persona.simpleLoginDeleted) {
          // Clear the deleted flag if the alias exists again
          updatedPersonas[index] = {
            ...persona,
            simpleLoginDeleted: false,
          }
          updatedPersonasCount++
        }
      })

      for (const alias of fetchedAliases) {
        // Skip if this alias was manually deleted by the user
        if (deletedAliasIds.includes(alias.id)) {
          continue
        }

        // Check if persona for this alias already exists
        const existingPersonaIndex = updatedPersonas.findIndex(
          (p) => p.simpleLoginAliasId === alias.id
        )

        if (existingPersonaIndex !== -1) {
          // Update existing persona's enabled status only if it changed
          const existingPersona = updatedPersonas[existingPersonaIndex]
          if (existingPersona.simpleLoginEnabled !== alias.enabled) {
            updatedPersonas[existingPersonaIndex] = {
              ...existingPersona,
              simpleLoginEnabled: alias.enabled,
            }
            updatedPersonasCount++
          }
          continue
        }

        // Extract domain from alias note or use a generic one
        const domain = alias.note || 'simplelogin.io'

        // Generate a new persona
        const newPersona = generatePersona(domain)

        // Create saved persona with SimpleLogin alias info
        const savedPersona: SavedPersona = {
          ...newPersona,
          email: alias.email, // Use the actual alias email
          id: Date.now().toString() + '-' + alias.id,
          domain: domain,
          createdAt: new Date(alias.creation_timestamp * 1000).toISOString(),
          simpleLoginAliasId: alias.id,
          simpleLoginEmail: alias.email,
          simpleLoginEnabled: alias.enabled,
        }

        updatedPersonas.push(savedPersona)
        newPersonasCount++
      }

      // Save to storage
      await chrome.storage.local.set({ personas: updatedPersonas })
      setSavedPersonas(updatedPersonas)

      // Reload aliases to update the list
      setAliases(fetchedAliases)

      const messageText =
        newPersonasCount > 0
          ? `Successfully synced! ${newPersonasCount} new persona${newPersonasCount !== 1 ? 's' : ''} created${updatedPersonasCount > 0 ? ` and ${updatedPersonasCount} updated` : ''}.`
          : updatedPersonasCount > 0
            ? `Successfully synced! ${updatedPersonasCount} persona${updatedPersonasCount !== 1 ? 's' : ''} updated.`
            : 'All aliases already synced!'

      setSyncMessage({
        type: 'success',
        text: messageText,
      })
    } catch (error) {
      console.error('Error syncing SimpleLogin aliases:', error)
      setSyncMessage({
        type: 'error',
        text: 'Failed to sync aliases. Please check your API key and try again.',
      })
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  return (
    <div
      className="w-[400px] h-[600px] p-4 flex flex-col overflow-hidden animate-in fade-in duration-300"
      style={{
        backgroundImage:
          'linear-gradient(to bottom, color-mix(in oklch, var(--muted), transparent 50%), var(--background))',
      }}
    >
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="simplelogin">SimpleLogin</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex items-center gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex items-center gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="simplelogin" className="space-y-4 mt-4 overflow-y-auto max-h-[450px]">
            {/* SimpleLogin API Key */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="apiKey" className="text-sm font-medium">
                  API Key
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your SimpleLogin API key for email alias integration
                </p>
              </div>

              {hasExistingKey ? (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium">API Key Connected</p>
                        <p className="text-xs text-muted-foreground">Integration active</p>
                      </div>
                    </div>
                    <Button
                      onClick={deleteApiKey}
                      variant="outline"
                      size="sm"
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      {isDeleted ? (
                        'Deleted'
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button
                    onClick={saveApiKey}
                    size="sm"
                    className="w-full"
                    disabled={!apiKey.trim()}
                  >
                    {isSaved ? 'Saved!' : 'Save API Key'}
                  </Button>
                </div>
              )}
            </div>

            {/* Sync Personas to SimpleLogin */}
            {hasExistingKey && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Sync Personas to SimpleLogin</Label>
                      <p className="text-xs text-muted-foreground">
                        Store persona data as JSON in alias notes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncPersonasToSimpleLogin}
                        onChange={(e) => toggleSyncPersonas(e.target.checked)}
                        disabled={isSyncingPersonas}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  {isSyncingPersonas && (
                    <Alert>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Syncing personas to SimpleLogin aliases...
                      </AlertDescription>
                    </Alert>
                  )}
                  {syncPersonasToSimpleLogin && !isSyncingPersonas && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        When enabled, persona information will be saved as JSON in the note field of your SimpleLogin aliases. This allows you to backup and sync your personas across devices.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}

            {/* Sync Message */}
            {syncMessage && (
              <Alert variant={syncMessage.type === 'error' ? 'destructive' : 'default'}>
                <AlertCircle className="w-4 h-4" />
                <AlertTitle className="text-md">
                  {syncMessage.type === 'success' ? 'Success!' : 'Error'}
                </AlertTitle>
                <AlertDescription>{syncMessage.text}</AlertDescription>
              </Alert>
            )}

            {/* Sync Button */}
            {hasExistingKey && (
              <div className="space-y-3">
                <Separator className="my-4" />
                <div>
                  <Label className="text-sm font-medium">Sync Aliases</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Import all your SimpleLogin aliases as personas
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={syncSimpleLoginAliases}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>Syncing...</>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Sync All Aliases
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* SimpleLogin Aliases Overview */}
            {hasExistingKey && (
              <>
                <div className="border-t" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        Your Aliases {aliases.length > 0 && `(${aliases.length})`}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Email aliases and their linked personas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuCheckboxItem
                            checked={aliasFilters.includes('active')}
                            onCheckedChange={() => toggleAliasFilter('active')}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Active
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={aliasFilters.includes('disabled')}
                            onCheckedChange={() => toggleAliasFilter('disabled')}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Disabled
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={aliasFilters.includes('linked')}
                            onCheckedChange={() => toggleAliasFilter('linked')}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Linked
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={aliasFilters.includes('unlinked')}
                            onCheckedChange={() => toggleAliasFilter('unlinked')}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Unlinked
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={aliasFilters.includes('wontSync')}
                            onCheckedChange={() => toggleAliasFilter('wontSync')}
                            onSelect={(e) => e.preventDefault()}
                          >
                            Won't Sync
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadAliases}
                        disabled={isLoadingAliases}
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingAliases ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  {aliases.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search aliases by email, note, or persona..."
                        value={aliasSearchQuery}
                        onChange={(e) => setAliasSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  )}

                  {aliases.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Showing {getFilteredAliases().length} of {aliases.length} alias{aliases.length !== 1 ? 'es' : ''}
                    </p>
                  )}

                  {isLoadingAliases ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Loading aliases...
                    </div>
                  ) : aliases.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No aliases found. Use the sync button on a persona page to create personas
                      from your aliases.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredAliases().map((alias) => {
                        const linkedPersona = savedPersonas.find(
                          (p) => p.simpleLoginAliasId === alias.id
                        )

                        return (
                          <div
                            key={alias.id}
                            className="border rounded-lg p-3 bg-muted/30 space-y-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{alias.email}</p>
                                {alias.note && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {alias.note}
                                  </p>
                                )}
                              </div>
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {linkedPersona ? (
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Linked to {linkedPersona.fullName}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No persona linked</p>
                              )}

                              {alias.enabled ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                                >
                                  Active Alias
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                                >
                                  Disabled Aliasd
                                </Badge>
                              )}

                              {deletedAliasIds.includes(alias.id) && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 border-orange-600 text-orange-600 dark:border-orange-400 dark:text-orange-400 cursor-pointer hover:bg-orange-600/10 flex items-center gap-0.5"
                                  onClick={() => removeFromDeletedList(alias.id)}
                                >
                                  Won't Sync
                                  <X className="h-2.5 w-2.5" />
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
