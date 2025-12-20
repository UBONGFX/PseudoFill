import { useState, useEffect } from 'react'
import { ArrowLeft, Moon, Sun, Monitor, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/components/theme-provider'

interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { theme, setTheme } = useTheme()
  const [apiKey, setApiKey] = useState('')
  const [hasExistingKey, setHasExistingKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  useEffect(() => {
    // Load saved API key
    chrome.storage.local.get(['simpleLoginApiKey'], (result) => {
      if (result.simpleLoginApiKey) {
        setApiKey(result.simpleLoginApiKey)
        setHasExistingKey(true)
      }
    })
  }, [])

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
      <div className="space-y-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        <div className="space-y-6">
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

          {/* Separator */}
          <div className="border-t" />

          {/* SimpleLogin API Key */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="apiKey" className="text-sm font-medium">
                SimpleLogin API Key
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Enter your SimpleLogin API key for email alias integration
              </p>
            </div>

            {hasExistingKey ? (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium">API Key Connected</p>
                      <p className="text-xs text-muted-foreground">
                        SimpleLogin integration active
                      </p>
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
                <Button onClick={saveApiKey} size="sm" className="w-full" disabled={!apiKey.trim()}>
                  {isSaved ? 'Saved!' : 'Save API Key'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
