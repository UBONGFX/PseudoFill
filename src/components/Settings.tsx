import { useState, useEffect } from 'react'
import { ArrowLeft, Moon, Sun, Monitor, Trash2, CheckCircle2, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from '@/components/theme-provider'
import {
  fetchSimpleLoginAliases,
  getStoredApiKey,
  type SimpleLoginAlias,
} from '@/lib/simplelogin-api'
import type { Persona } from '@/lib/persona-generator'

interface SavedPersona extends Persona {
  id: string
  domain: string
  createdAt: string
  simpleLoginAliasId?: number
  simpleLoginEmail?: string
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

  useEffect(() => {
    // Load saved API key
    chrome.storage.local.get(['simpleLoginApiKey'], (result) => {
      if (result.simpleLoginApiKey) {
        setApiKey(result.simpleLoginApiKey)
        setHasExistingKey(true)
      }
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

            {/* SimpleLogin Aliases Overview */}
            {hasExistingKey && (
              <>
                <div className="border-t" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Your Aliases</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Email aliases and their linked personas
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadAliases}
                      disabled={isLoadingAliases}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingAliases ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

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
                      {aliases.map((alias) => {
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

                            {linkedPersona ? (
                              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                Linked to {linkedPersona.fullName}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">No persona linked</p>
                            )}
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
