import { useState, useEffect } from 'react'
import {
  PlusIcon,
  ArrowLeft,
  Copy,
  CheckIcon,
  Mail,
  User,
  Phone,
  Calendar,
  MapPin,
  Save,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  Settings as SettingsIcon,
} from 'lucide-react'
import { Settings } from '../components/Settings'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { generatePersona, type Persona } from '@/lib/persona-generator'
import { fetchSimpleLoginAliases, getStoredApiKey } from '@/lib/simplelogin-api'

interface SavedPersona extends Persona {
  id: string
  domain: string
  createdAt: string
  simpleLoginAliasId?: number
  simpleLoginEmail?: string
  simpleLoginEnabled?: boolean
  simpleLoginDeleted?: boolean
}

function App() {
  const [persona, setPersona] = useState<Persona | null>(null)
  const [copiedField, setCopiedField] = useState<string>('')
  const [showPersona, setShowPersona] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [savedPersonas, setSavedPersonas] = useState<SavedPersona[]>([])
  const [currentDomain, setCurrentDomain] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchFilters, setSearchFilters] = useState<string[]>(['name', 'email', 'domain'])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Load saved personas on mount
  useEffect(() => {
    loadPersonas()
    getCurrentDomain()
  }, [])

  const getCurrentDomain = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const domain = new URL(tab.url || '').hostname
    setCurrentDomain(domain)
  }

  const loadPersonas = async () => {
    const result = await chrome.storage.local.get(['personas'])
    const personas = result.personas || []
    setSavedPersonas(personas)
  }

  // Get sorted personas with current domain first
  const getSortedPersonas = () => {
    return [...savedPersonas].sort((a, b) => {
      // Current domain personas come first
      const aIsCurrentDomain = a.domain === currentDomain
      const bIsCurrentDomain = b.domain === currentDomain

      if (aIsCurrentDomain && !bIsCurrentDomain) return -1
      if (!aIsCurrentDomain && bIsCurrentDomain) return 1

      // Otherwise sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }

  // Get filtered personas based on search query and filters
  const getFilteredPersonas = () => {
    const sorted = getSortedPersonas()

    if (!searchQuery.trim()) return sorted

    const query = searchQuery.toLowerCase()
    return sorted.filter((persona) => {
      if (searchFilters.includes('name') && persona.fullName.toLowerCase().includes(query))
        return true
      if (searchFilters.includes('email') && persona.email.toLowerCase().includes(query))
        return true
      if (searchFilters.includes('username') && persona.username.toLowerCase().includes(query))
        return true
      if (searchFilters.includes('domain') && persona.domain.toLowerCase().includes(query))
        return true
      if (searchFilters.includes('phone') && persona.phone.includes(query)) return true
      if (searchFilters.includes('address') && persona.address.full.toLowerCase().includes(query))
        return true
      return false
    })
  }

  const toggleFilter = (filter: string) => {
    setSearchFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    )
  }

  const savePersonaToStorage = async () => {
    if (!persona) return

    const savedPersona: SavedPersona = {
      ...persona,
      id: Date.now().toString(),
      domain: currentDomain,
      createdAt: new Date().toISOString(),
    }

    const updatedPersonas = [...savedPersonas, savedPersona]
    await chrome.storage.local.set({ personas: updatedPersonas })
    setSavedPersonas(updatedPersonas)
    setShowPersona(false)
    setPersona(null)
  }

  const deletePersonaFromStorage = async (id: string) => {
    const personaToDelete = savedPersonas.find((p) => p.id === id)
    const updatedPersonas = savedPersonas.filter((p) => p.id !== id)
    await chrome.storage.local.set({ personas: updatedPersonas })
    setSavedPersonas(updatedPersonas)

    // If this persona was linked to a SimpleLogin alias, track it as deleted
    if (personaToDelete?.simpleLoginAliasId) {
      const result = await chrome.storage.local.get('deletedSimpleLoginAliasIds')
      const deletedIds = result.deletedSimpleLoginAliasIds || []
      if (!deletedIds.includes(personaToDelete.simpleLoginAliasId)) {
        deletedIds.push(personaToDelete.simpleLoginAliasId)
        await chrome.storage.local.set({ deletedSimpleLoginAliasIds: deletedIds })
      }
    }
  }

  const viewPersona = (savedPersona: SavedPersona) => {
    setPersona(savedPersona)
    setShowPersona(true)
  }

  const generateNewPersona = async () => {
    // Get current tab domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const domain = new URL(tab.url || '').hostname

    const newPersona = generatePersona(domain)
    setPersona(newPersona)
    setShowPersona(true)
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const goBack = () => {
    setShowPersona(false)
    setPersona(null)
  }

  const goBackFromSettings = () => {
    setShowSettings(false)
    // Reload personas to reflect any changes made in Settings
    loadPersonas()
  }

  const openSettings = () => {
    setShowSettings(true)
  }

  const deletePersona = () => {
    // Check if this is a saved persona with an ID
    if (persona && 'id' in persona) {
      deletePersonaFromStorage((persona as SavedPersona).id)
    }
    setShowPersona(false)
    setPersona(null)
  }

  const syncSimpleLoginAliases = async () => {
    setIsSyncing(true)
    setSyncMessage(null)

    try {
      const apiKey = await getStoredApiKey()

      if (!apiKey) {
        setSyncMessage({
          type: 'error',
          text: 'No API key found. Please add your SimpleLogin API key in Settings.',
        })
        setIsSyncing(false)
        return
      }

      const aliases = await fetchSimpleLoginAliases(apiKey)

      if (aliases.length === 0) {
        setSyncMessage({
          type: 'error',
          text: 'No aliases found in your SimpleLogin account.',
        })
        setIsSyncing(false)
        return
      }

      let newPersonasCount = 0
      const updatedPersonas = [...savedPersonas]

      for (const alias of aliases) {
        // Check if persona for this alias already exists
        const existingPersona = updatedPersonas.find((p) => p.simpleLoginAliasId === alias.id)

        if (existingPersona) {
          continue // Skip if persona already exists
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
        }

        updatedPersonas.push(savedPersona)
        newPersonasCount++
      }

      // Save to storage
      await chrome.storage.local.set({ personas: updatedPersonas })
      setSavedPersonas(updatedPersonas)

      setSyncMessage({
        type: 'success',
        text: `Successfully synced! ${newPersonasCount} new persona${newPersonasCount !== 1 ? 's' : ''} created from ${aliases.length} alias${aliases.length !== 1 ? 'es' : ''}.`,
      })

      // Go back to list view after successful sync
      setTimeout(() => {
        setShowPersona(false)
        setPersona(null)
      }, 2000)
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

  // Check if current persona is saved
  const isPersonaSaved = persona && 'id' in persona

  // Check if a persona already exists for the current domain
  const existingPersonaForDomain =
    persona && !isPersonaSaved ? savedPersonas.find((p) => p.domain === currentDomain) : null

  if (showSettings) {
    return <Settings onBack={goBackFromSettings} />
  }

  if (showPersona && persona) {
    return (
      <div
        className="w-[400px] h-[650px] p-4 overflow-y-auto animate-in fade-in duration-300"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, color-mix(in oklch, var(--muted), transparent 50%), var(--background))',
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              {isPersonaSaved ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Persona?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {persona.fullName}? This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deletePersona}
                        className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button variant="ghost" size="sm" onClick={savePersonaToStorage}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              )}
            </div>
          </div>

          {existingPersonaForDomain && (
            <Alert className="my-4">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle className="text-md">
                You already have a persona for this website
              </AlertTitle>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Avatar className="h-20 w-20 mx-auto border-4 border-primary/20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {persona.firstName[0]}
                  {persona.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{persona.fullName}</h2>
              <p className="text-xs text-muted-foreground">
                Your privacy-protected persona for{' '}
                <span className="font-medium">{currentDomain}</span>
              </p>
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {(persona as SavedPersona).domain === currentDomain && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0.5 flex-shrink-0 border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                  >
                    Current Site
                  </Badge>
                )}
                {(persona as SavedPersona).simpleLoginAliasId &&
                  ((persona as SavedPersona).simpleLoginDeleted ? (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 flex-shrink-0 border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Alias Deleted
                    </Badge>
                  ) : (persona as SavedPersona).simpleLoginEnabled === false ? (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 flex-shrink-0 border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Alias Disabled
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs px-2 py-0.5 flex-shrink-0">
                      <Mail className="h-3 w-3 mr-1" />
                      Alias Active
                    </Badge>
                  ))}
                {(persona as SavedPersona).createdAt &&
                  new Date().getTime() - new Date((persona as SavedPersona).createdAt).getTime() <
                    48 * 60 * 60 * 1000 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                      New
                    </Badge>
                  )}
              </div>
            </div>

            <div className="space-y-2">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">First Name</p>
                    <p className="text-sm">{persona.firstName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(persona.firstName, 'firstName')}
                  >
                    {copiedField === 'firstName' ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Last Name</p>
                    <p className="text-sm">{persona.lastName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(persona.lastName, 'lastName')}
                  >
                    {copiedField === 'lastName' ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-mono truncate">{persona.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.email, 'email')}
                >
                  {copiedField === 'email' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Username */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="text-sm font-mono truncate">{persona.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.username, 'username')}
                >
                  {copiedField === 'username' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-mono">{persona.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.phone, 'phone')}
                >
                  {copiedField === 'phone' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Date of Birth */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-mono">{persona.dateOfBirth}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.dateOfBirth, 'dob')}
                >
                  {copiedField === 'dob' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{persona.address.street}</p>
                  <p className="text-sm">
                    {persona.address.city}, {persona.address.state} {persona.address.zipCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{persona.address.country}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(persona.address.full, 'address')}
                >
                  {copiedField === 'address' ? (
                    <CheckIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-center text-muted-foreground">
                Click any <Copy className="h-3 w-3 inline" /> icon to copy
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`w-[400px] p-4 flex flex-col overflow-hidden animate-in fade-in duration-300 ${savedPersonas.length === 0 ? 'h-[350px]' : 'h-[600px]'}`}
      style={{
        backgroundImage:
          'linear-gradient(to bottom, color-mix(in oklch, var(--muted), transparent 50%), var(--background))',
      }}
    >
      <div className="space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">PseudoFill</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={openSettings}>
              <SettingsIcon className="h-4 w-4" />
            </Button>
            {savedPersonas.length > 0 && (
              <Button variant="default" size="sm" onClick={generateNewPersona}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {savedPersonas.length > 0 && (
          <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuCheckboxItem
                  checked={searchFilters.includes('name')}
                  onCheckedChange={() => toggleFilter('name')}
                  onSelect={(e) => e.preventDefault()}
                >
                  Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={searchFilters.includes('email')}
                  onCheckedChange={() => toggleFilter('email')}
                  onSelect={(e) => e.preventDefault()}
                >
                  Email
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={searchFilters.includes('username')}
                  onCheckedChange={() => toggleFilter('username')}
                  onSelect={(e) => e.preventDefault()}
                >
                  Username
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={searchFilters.includes('domain')}
                  onCheckedChange={() => toggleFilter('domain')}
                  onSelect={(e) => e.preventDefault()}
                >
                  Domain
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={searchFilters.includes('phone')}
                  onCheckedChange={() => toggleFilter('phone')}
                  onSelect={(e) => e.preventDefault()}
                >
                  Phone
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={searchFilters.includes('address')}
                  onCheckedChange={() => toggleFilter('address')}
                  onSelect={(e) => e.preventDefault()}
                >
                  Address
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {savedPersonas.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <div className="flex -space-x-2">
                  <Avatar className="h-12 w-12 border-2 border-background grayscale">
                    <AvatarFallback>TL</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-12 w-12 border-2 border-background grayscale">
                    <AvatarFallback>JI</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-12 w-12 border-2 border-background grayscale">
                    <AvatarFallback>CW</AvatarFallback>
                  </Avatar>
                </div>
              </EmptyMedia>
              <EmptyTitle>No Pseudonym Personas Created</EmptyTitle>
              <EmptyDescription>
                Create one now to protect your privacy across websites.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" onClick={generateNewPersona}>
                <PlusIcon />
                Create Persona
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground">
              {getFilteredPersonas().length} of {savedPersonas.length} persona
              {savedPersonas.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {savedPersonas.length > 0 && (
        <div className="space-y-2 overflow-y-auto flex-1 mt-4 pr-1">
          {getFilteredPersonas().map((savedPersona) => (
            <div
              key={savedPersona.id}
              className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:border-primary/30 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => viewPersona(savedPersona)}
            >
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {savedPersona.firstName[0]}
                  {savedPersona.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{savedPersona.fullName}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs text-muted-foreground truncate">{savedPersona.domain}</p>
                  {savedPersona.domain === currentDomain && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 flex-shrink-0 border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                    >
                      Current Site
                    </Badge>
                  )}
                  {savedPersona.simpleLoginAliasId &&
                    (savedPersona.simpleLoginDeleted ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 flex-shrink-0 border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400"
                      >
                        <Mail className="h-2.5 w-2.5 mr-1" />
                        Alias Deleted
                      </Badge>
                    ) : savedPersona.simpleLoginEnabled === false ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 flex-shrink-0 border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                      >
                        <Mail className="h-2.5 w-2.5 mr-1" />
                        Alias Disabled
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                        <Mail className="h-2.5 w-2.5 mr-1" />
                        Alias Active
                      </Badge>
                    ))}
                  {new Date().getTime() - new Date(savedPersona.createdAt).getTime() <
                    48 * 60 * 60 * 1000 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      New
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
export default App
